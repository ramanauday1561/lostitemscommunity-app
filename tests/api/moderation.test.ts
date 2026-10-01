/// <reference types="node" />
import { fake } from './setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as mod from '../../src/api/moderation';

const flag = (over: Record<string, unknown> = {}) => ({
  id: 'f1', target_type: 'item', target_id: 'i1', reason: 'spam', status: 'pending', ...over,
});

describe('moderation api', () => {
  beforeEach(() => fake.reset());

  describe('loadModerationQueue', () => {
    test('loads pending flags newest first, then enriches them with ONE batched query per kind', async () => {
      fake.queue(
        { data: [flag(), flag({ id: 'f2', target_type: 'forum_thread', target_id: 't1' }), flag({ id: 'f3', target_id: 'i2' })] },
        { data: [
          { id: 'i1', display_id: 'LOST-1', title: 'Wallet', created_at: 'c1', reporter: { handle: 'ann' } },
          { id: 'i2', display_id: 'FOUND-2', title: 'Keys', created_at: 'c3', reporter: [{ handle: 'bob' }] },
        ] },
        { data: [{ id: 't1', title: 'A thread', created_at: 'c2', author: { handle: 'cara' } }] },
      );
      const q = await mod.loadModerationQueue();
      assert.ok(fake.has('eq', 'status', 'pending'));
      assert.ok(fake.has('order', 'created_at', { ascending: false }));
      assert.equal(fake.calls.length, 3, 'flags + items + threads, not one query per flag');
      assert.deepEqual(fake.args('in', 1), ['id', ['i1', 'i2']]);
      assert.deepEqual(fake.args('in', 2), ['id', ['t1']]);
      assert.deepEqual(q.map((f) => [f.id, f.target_ref, f.target_title, f.target_author]), [
        ['f1', 'LOST-1', 'Wallet', 'ann'], ['f2', 'Forum thread', 'A thread', 'cara'], ['f3', 'FOUND-2', 'Keys', 'bob'],
      ]);
    });

    test('only item flags: the threads query is skipped (and vice versa)', async () => {
      fake.queue({ data: [flag()] }, { data: [{ id: 'i1', display_id: 'LOST-1', title: 'W', created_at: 'c', reporter: { handle: 'a' } }] });
      await mod.loadModerationQueue();
      assert.equal(fake.calls.length, 2);
    });

    test('drops flags whose target no longer exists; no flags = no further queries', async () => {
      fake.queue({ data: [flag()] }, { data: [] });
      assert.deepEqual(await mod.loadModerationQueue(), []);
      fake.reset(); fake.queue({ data: [] });
      assert.deepEqual(await mod.loadModerationQueue(), []);
      assert.equal(fake.calls.length, 1);
    });

    test('throws if any query fails (not an empty "queue is clear")', async () => {
      fake.queue({ error: { message: 'denied' } });
      await assert.rejects(mod.loadModerationQueue(), /denied/);
      fake.reset(); fake.queue({ data: [flag()] }, { error: { message: 'items denied' } });
      await assert.rejects(mod.loadModerationQueue(), /items denied/);
    });
  });

  test('loadModerationStats counts each status, defaulting nulls to 0', async () => {
    fake.queue({ count: 3 }, { count: 5 }, { count: null });
    assert.deepEqual(await mod.loadModerationStats(), { pending: 3, approved: 5, removed: 0 });
    assert.ok(fake.has('eq', 'status', 'approved'));
  });

  test('approve and remove both go through the resolve_moderation_flag function (status, audit log and owner notification together)', async () => {
    await mod.approveFlag('f1');
    assert.equal(fake.calls[0].kind, 'rpc');
    assert.equal(fake.calls[0].name, 'resolve_moderation_flag');
    assert.deepEqual(fake.args('args', 0), [{ flag_id: 'f1', approve: true }]);
    fake.reset();
    await mod.removeFlag('f1');
    assert.deepEqual(fake.args('args', 0), [{ flag_id: 'f1', approve: false }]);
  });

  test('a rejected resolve (not a superadmin, flag gone) is thrown with the database message', async () => {
    fake.queue({ error: { message: 'only a superadmin can resolve moderation flags' } });
    await assert.rejects(mod.approveFlag('f1'), /only a superadmin/);
    fake.queue({ error: { message: 'moderation flag f1 not found' } });
    await assert.rejects(mod.removeFlag('f1'), /not found/);
  });
});
