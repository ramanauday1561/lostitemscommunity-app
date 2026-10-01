/// <reference types="node" />
import { fake } from './setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as forum from '../../src/api/forum';

const thread = (over: Record<string, unknown> = {}) => ({
  id: 't1', title: 'Seen a dog', body: 'near the park', tag: 'Sighting', status: 'live', author_id: 'a1',
  created_at: '2026-09-20T10:00:00Z', helpful_count: 3,
  author: { handle: 'ann', display_name: 'Ann' }, replies: [{ id: 'r1' }, { id: 'r2' }],
  thread_votes: [{ user_id: 'me' }], ...over,
});

describe('forum api', () => {
  beforeEach(() => fake.reset());

  describe('loadThreads', () => {
    test('only live threads, newest first', async () => {
      fake.queue({ data: [] });
      await forum.loadThreads('me');
      assert.ok(fake.has('eq', 'status', 'live'));
      assert.ok(fake.has('order', 'created_at', { ascending: false }));
    });

    test('maps author, reply count, helpful count and whether I voted', async () => {
      fake.queue({ data: [thread(), thread({ id: 't2', thread_votes: [{ user_id: 'someone' }], replies: null, author: null })] });
      const [a, b] = await forum.loadThreads('me');
      assert.deepEqual(
        [a.author_handle, a.author_display_name, a.reply_count, a.helpful_vote_count, a.user_voted_helpful],
        ['ann', 'Ann', 2, 3, true],
      );
      assert.deepEqual([b.author_handle, b.reply_count, b.user_voted_helpful], ['Unknown', 0, false]);
    });

    test('applies a tag filter only for the three real tags', async () => {
      fake.queue({ data: [] });
      await forum.loadThreads('me', 'Question');
      assert.ok(fake.has('eq', 'tag', 'Question'));

      fake.reset(); fake.queue({ data: [] });
      await forum.loadThreads('me', 'All');
      assert.ok(!fake.calls[0].ops.some(([m, a]) => m === 'eq' && a[0] === 'tag'));
    });

    test('returns [] on error', async () => {
      fake.queue({ error: { message: 'boom' } });
      assert.deepEqual(await forum.loadThreads('me'), []);
    });
  });

  test('loadReplies returns oldest first with author fallback', async () => {
    fake.queue({ data: [
      { id: 'r1', thread_id: 't1', body: 'hi', author_id: 'a1', created_at: '2026-09-20T10:00:00Z', author: [{ handle: 'ann', display_name: 'Ann' }] },
      { id: 'r2', thread_id: 't1', body: 'yo', author_id: 'a2', created_at: '2026-09-20T10:01:00Z', author: null },
    ] });
    const r = await forum.loadReplies('t1', 'me');
    assert.deepEqual(r.map((x) => x.author_handle), ['ann', 'Unknown']);
    assert.ok(fake.has('eq', 'thread_id', 't1'));
    assert.ok(fake.has('order', 'created_at', { ascending: true }));
  });

  describe('createThread / replyToThread', () => {
    test('createThread inserts trimmed live thread', async () => {
      await forum.createThread('me', '  Title ', ' body ', 'Question');
      assert.deepEqual(fake.args('insert'), [{ author_id: 'me', title: 'Title', body: 'body', tag: 'Question', status: 'live' }]);
    });

    test('blank title or text is a no-op', async () => {
      await forum.createThread('me', '  ', 'body', 'Question');
      await forum.createThread('me', 'T', '   ', 'Question');
      await forum.replyToThread('t1', 'me', '  ');
      assert.equal(fake.calls.length, 0);
    });

    test('replyToThread inserts the trimmed reply', async () => {
      await forum.replyToThread('t1', 'me', ' thanks ');
      assert.deepEqual(fake.args('insert'), [{ thread_id: 't1', author_id: 'me', body: 'thanks' }]);
    });

    test('both throw the database message', async () => {
      fake.queue({ error: { message: 'suspended' } });
      await assert.rejects(forum.createThread('me', 'T', 'b', 'Question'), /suspended/);
      fake.queue({ error: { message: 'suspended' } });
      await assert.rejects(forum.replyToThread('t1', 'me', 'x'), /suspended/);
    });
  });

  describe('toggleThreadHelpful', () => {
    test('no existing vote -> inserts one', async () => {
      fake.queue({ data: null });
      await forum.toggleThreadHelpful('t1', 'me');
      assert.equal(fake.calls[1].name, 'forum_thread_votes');
      assert.deepEqual(fake.args('insert', 1), [{ thread_id: 't1', user_id: 'me' }]);
    });

    test('existing vote -> removes it (and does not insert)', async () => {
      fake.queue({ data: { thread_id: 't1' } });
      await forum.toggleThreadHelpful('t1', 'me');
      assert.ok(fake.methods(1).includes('delete'));
      assert.ok(!fake.methods(1).includes('insert'));
      assert.ok(fake.has('eq', 'user_id', 'me'));
    });

    test('a failed lookup throws before changing anything', async () => {
      fake.queue({ error: { message: 'boom' } });
      await assert.rejects(forum.toggleThreadHelpful('t1', 'me'), /boom/);
      assert.equal(fake.calls.length, 1);
    });
  });

  test('suspend / restore / delete target the thread by id', async () => {
    await forum.suspendThread('t1');
    assert.deepEqual(fake.args('update', 0), [{ status: 'suspended' }]);
    await forum.restoreThread('t1');
    assert.deepEqual(fake.args('update', 1), [{ status: 'live' }]);
    await forum.deleteThread('t1');
    assert.ok(fake.methods(2).includes('delete'));
    assert.ok(fake.calls.every((c) => c.ops.some(([m, a]) => m === 'eq' && a[0] === 'id' && a[1] === 't1')));
  });

  test('admin actions throw on error', async () => {
    for (const fn of [forum.suspendThread, forum.restoreThread, forum.deleteThread]) {
      fake.queue({ error: { message: 'not allowed' } });
      await assert.rejects(fn('t1'), /not allowed/);
    }
  });
});
