/// <reference types="node" />
import { fake } from './setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as conv from '../../src/api/conversations';

const convRow = (over: Record<string, unknown> = {}) => ({
  id: 'c1', item_id: 'i1', reporter_id: 'me', claimant_id: 'them', created_at: '2026-09-20T10:00:00Z',
  items: { title: 'Wallet', icon: 'wallet', display_id: 'LOST-1' },
  messages: [],
  reporter: { handle: 'me.handle' }, claimant: { handle: 'them.handle' }, ...over,
});

describe('conversations api', () => {
  beforeEach(() => fake.reset());

  describe('loadConversations', () => {
    test('queries conversations where the user is reporter or claimant', async () => {
      fake.queue({ data: [] });
      await conv.loadConversations('me');
      assert.equal(fake.calls[0].name, 'conversations');
      assert.deepEqual(fake.args('or'), ['reporter_id.eq.me,claimant_id.eq.me']);
    });

    test('"with" is the OTHER party: claimant for the reporter, reporter for the claimant', async () => {
      fake.queue({ data: [convRow()] });
      assert.equal((await conv.loadConversations('me'))[0].with, 'them.handle');
      fake.queue({ data: [convRow()] });
      assert.equal((await conv.loadConversations('them'))[0].with, 'me.handle');
    });

    test('unread counts only messages from others with no read_at', async () => {
      const messages = [
        { id: 'm1', read_at: null, sender_id: 'them', created_at: '2026-09-20T10:01:00Z' },
        { id: 'm2', read_at: null, sender_id: 'them', created_at: '2026-09-20T10:02:00Z' },
        { id: 'm3', read_at: '2026-09-20T11:00:00Z', sender_id: 'them', created_at: '2026-09-20T10:03:00Z' },
        { id: 'm4', read_at: null, sender_id: 'me', created_at: '2026-09-20T10:04:00Z' },
      ];
      fake.queue({ data: [convRow({ messages })] });
      assert.equal((await conv.loadConversations('me'))[0].unread, 2);
    });

    test('falls back for a deleted item, missing handle, and array-shaped item join', async () => {
      fake.queue({ data: [convRow({ items: null, claimant: null })] });
      const [c] = await conv.loadConversations('me');
      assert.equal(c.item, '(item deleted)');
      assert.equal(c.icon, 'inventory_2');
      assert.equal(c.with, 'Unknown');

      fake.queue({ data: [convRow({ items: [{ title: 'Keys', icon: 'key', display_id: 'F-1' }] })] });
      assert.equal((await conv.loadConversations('me'))[0].item, 'Keys');
    });

    test('throws on error so the UI can show an error + retry', async () => {
      fake.queue({ error: { message: 'boom' } });
      await assert.rejects(conv.loadConversations('me'), /boom/);
    });
  });

  describe('loadMessages', () => {
    test('oldest first, and marks who sent each message', async () => {
      fake.queue({ data: [
        { id: 'm1', sender_id: 'me', body: 'hi', created_at: '2026-09-20T10:00:00Z', read_at: null },
        { id: 'm2', sender_id: 'them', body: 'hello', created_at: '2026-09-20T10:01:00Z', read_at: null },
      ] });
      const msgs = await conv.loadMessages('c1', 'me');
      assert.deepEqual(msgs.map((m) => [m.text, m.from]), [['hi', 'me'], ['hello', 'them']]);
      assert.ok(fake.has('eq', 'conversation_id', 'c1'));
      assert.ok(fake.has('order', 'created_at', { ascending: true }));
    });

    test('returns [] on error', async () => {
      fake.queue({ error: { message: 'boom' } });
      assert.deepEqual(await conv.loadMessages('c1', 'me'), []);
    });
  });

  describe('sendMessage', () => {
    test('inserts the trimmed body', async () => {
      await conv.sendMessage('c1', 'me', '  hello  ');
      assert.deepEqual(fake.args('insert'), [{ conversation_id: 'c1', sender_id: 'me', body: 'hello' }]);
    });

    test('a blank message is a no-op (no request)', async () => {
      await conv.sendMessage('c1', 'me', '   ');
      assert.equal(fake.calls.length, 0);
    });

    test('throws on error', async () => {
      fake.queue({ error: { message: 'denied' } });
      await assert.rejects(conv.sendMessage('c1', 'me', 'x'), /denied/);
    });
  });

  test('markConversationRead only touches unread messages sent by someone else', async () => {
    await conv.markConversationRead('c1', 'me');
    const [patch] = fake.args('update') as [{ read_at: string }];
    assert.ok(!Number.isNaN(Date.parse(patch.read_at)));
    assert.ok(fake.has('eq', 'conversation_id', 'c1'));
    assert.ok(fake.has('is', 'read_at', null));
    assert.ok(fake.has('neq', 'sender_id', 'me'));
  });
});
