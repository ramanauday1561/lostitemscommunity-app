/// <reference types="node" />
import { fake } from './setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as notifications from '../../src/api/notifications';

const row = (over: Record<string, unknown> = {}) => ({
  id: 'n1', user_id: 'u1', type: 'message', title: 'New message from bo', body: 'hi there',
  item_id: 'i1', conversation_id: 'c1', is_read: false, created_at: '2026-09-20T10:00:00Z', ...over,
});

describe('notifications api', () => {
  beforeEach(() => fake.reset());

  test('toAppNotification maps fields and nulls a missing body to ""', () => {
    const n = notifications.toAppNotification(row({ body: null }) as any);
    assert.deepEqual([n.id, n.type, n.title, n.body, n.itemId, n.conversationId, n.isRead],
      ['n1', 'message', 'New message from bo', '', 'i1', 'c1', false]);
    assert.ok(n.time.length > 0);
  });

  test('loadNotifications is scoped to the user, newest first, capped at 50', async () => {
    fake.queue({ data: [row(), row({ id: 'n2', is_read: true })] });
    const r = await notifications.loadNotifications('u1');
    assert.deepEqual(r.map((n) => [n.id, n.isRead]), [['n1', false], ['n2', true]]);
    assert.equal(fake.calls[0].name, 'notifications');
    assert.ok(fake.has('eq', 'user_id', 'u1'));
    assert.ok(fake.has('order', 'created_at', { ascending: false }));
    assert.ok(fake.has('limit', 50));
  });

  test('loadNotifications throws on error (so the sheet shows an error + retry); null data is empty', async () => {
    fake.queue({ error: { message: 'boom' } });
    await assert.rejects(notifications.loadNotifications('u1'), /boom/);
    fake.queue({ data: null });
    assert.deepEqual(await notifications.loadNotifications('u1'), []);
  });

  test('markNotificationRead updates just that row', async () => {
    await notifications.markNotificationRead('n1');
    assert.deepEqual(fake.args('update'), [{ is_read: true }]);
    assert.ok(fake.has('eq', 'id', 'n1'));
  });

  test('markAllNotificationsRead only touches this user\'s unread rows', async () => {
    await notifications.markAllNotificationsRead('u1');
    assert.deepEqual(fake.args('update'), [{ is_read: true }]);
    assert.ok(fake.has('eq', 'user_id', 'u1'));
    assert.ok(fake.has('eq', 'is_read', false));
  });

  test('both mark functions throw on error', async () => {
    fake.queue({ error: { message: 'denied' } });
    await assert.rejects(notifications.markNotificationRead('n1'), /denied/);
    fake.queue({ error: { message: 'denied' } });
    await assert.rejects(notifications.markAllNotificationsRead('u1'), /denied/);
  });
});
