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
    test('loads pending flags newest first and enriches each with its target', async () => {
      fake.queue(
        { data: [flag(), flag({ id: 'f2', target_type: 'forum_thread', target_id: 't1' })] },
        { data: { title: 'Wallet', reporter_id: 'r1', created_at: 'c1' } },
        { data: { title: 'A thread', author_id: 'a1', created_at: 'c2' } },
      );
      const q = await mod.loadModerationQueue();
      assert.ok(fake.has('eq', 'status', 'pending'));
      assert.deepEqual(q.map((f) => [f.id, f.target_title, f.target_author]), [['f1', 'Wallet', 'r1'], ['f2', 'A thread', 'a1']]);
      assert.equal(fake.calls[1].name, 'items');
      assert.equal(fake.calls[2].name, 'forum_threads');
    });

    test('drops flags whose target no longer exists', async () => {
      fake.queue({ data: [flag()] }, { data: null });
      assert.deepEqual(await mod.loadModerationQueue(), []);
    });

    test('returns [] if the flags query fails', async () => {
      fake.queue({ error: { message: 'denied' } });
      assert.deepEqual(await mod.loadModerationQueue(), []);
    });
  });

  test('loadModerationStats counts each status, defaulting nulls to 0', async () => {
    fake.queue({ count: 3 }, { count: 5 }, { count: null });
    assert.deepEqual(await mod.loadModerationStats(), { pending: 3, approved: 5, removed: 0 });
    assert.ok(fake.has('eq', 'status', 'approved'));
  });

  test('approveFlag closes the flag with the reviewer and a timestamp, and keeps the content', async () => {
    await mod.approveFlag('f1', 'admin1');
    const [patch] = fake.args('update') as [Record<string, string>];
    assert.equal(patch.status, 'approved');
    assert.equal(patch.reviewed_by, 'admin1');
    assert.ok(!Number.isNaN(Date.parse(patch.reviewed_at)));
    assert.equal(fake.calls.length, 1);
  });

  describe('removeFlag', () => {
    test('item flag: hard-deletes the item, then marks the flag removed', async () => {
      fake.queue({ data: flag() });
      await mod.removeFlag('f1', 'admin1');
      assert.equal(fake.calls[1].name, 'items');
      assert.ok(fake.methods(1).includes('delete'));
      assert.equal((fake.args('update', 2) as [{ status: string }])[0].status, 'removed');
    });

    test('thread flag: suspends (does not delete) the thread', async () => {
      fake.queue({ data: flag({ target_type: 'forum_thread', target_id: 't1' }) });
      await mod.removeFlag('f1', 'admin1');
      assert.equal(fake.calls[1].name, 'forum_threads');
      assert.deepEqual(fake.args('update', 1), [{ status: 'suspended' }]);
      assert.ok(!fake.methods(1).includes('delete'));
    });

    test('unknown flag throws and changes nothing', async () => {
      fake.queue({ data: null });
      await assert.rejects(mod.removeFlag('nope', 'admin1'), /Flag not found/);
      assert.equal(fake.calls.length, 1);
    });

    test('if deleting the target fails, the flag is NOT marked removed', async () => {
      fake.queue({ data: flag() }, { error: { message: 'fk violation' } });
      await assert.rejects(mod.removeFlag('f1', 'admin1'), /fk violation/);
      assert.equal(fake.calls.length, 2);
    });
  });
});
