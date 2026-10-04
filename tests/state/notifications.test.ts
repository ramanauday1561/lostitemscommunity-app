/// <reference types="node" />
import { fake } from '../api/setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';
import { waitFor } from './waitFor';

const note = (over: Record<string, unknown> = {}) => ({
  id: 'n1', type: 'moderation', title: 'Your post was flagged for review', body: 'Blue backpack',
  itemId: 'i1', conversationId: null, isRead: false, time: '09:00', ...over,
});
const dbRow = (over: Record<string, unknown> = {}) => ({
  id: 'n9', user_id: 'me', type: 'match', title: 'ann claimed your item', body: 'Wallet',
  item_id: 'i1', conversation_id: 'c1', is_read: false, created_at: '2026-09-30T10:00:00Z', ...over,
});

function appStore(over: Record<string, unknown> = {}) {
  const store = new Store();
  store.setState({
    screen: 'dash', role: 'user', sheet: null, notifications: [note()],
    convos: [{ id: 'c1', itemId: 'i1', item: 'Wallet', icon: 'wallet', with: 'ann', time: '09:00', unread: 0, msgs: [] }],
    profile: { id: 'me', role: 'user', display_name: 'Me', handle: 'me', username: 'me', post_count: 0, is_suspended: false, created_at: '2026-01-01T00:00:00Z' } as any,
    ...over,
  } as any);
  return store;
}

describe('notifications (12.3)', () => {
  beforeEach(() => fake.reset());

  test('the bell shows an unread count', () => {
    const v = buildVals(appStore({ notifications: [note(), note({ id: 'n2' }), note({ id: 'n3', isRead: true })] }));
    assert.equal(v.showBell, true);
    assert.equal(v.unreadNotifs, 2);
    assert.equal(v.hasUnreadNotifs, true);
  });

  test('a realtime notification is prepended, and toasts unless it is a chat message', async () => {
    const store = appStore();
    await store.handleIncomingNotification(dbRow() as any);
    assert.deepEqual(store.state.notifications.map((n) => n.id), ['n9', 'n1']);
    assert.equal(store.state.toast, 'ann claimed your item');

    const quiet = appStore();
    await quiet.handleIncomingNotification(dbRow({ id: 'n10', type: 'message' }) as any);
    assert.equal(quiet.state.notifications.length, 2);
    assert.equal(quiet.state.toast, '', 'message notifications are covered by the chat toast/badge');
  });

  test('a duplicate delivery is ignored', async () => {
    const store = appStore();
    await store.handleIncomingNotification(dbRow() as any);
    await store.handleIncomingNotification(dbRow() as any);
    assert.equal(store.state.notifications.length, 2);
  });

  test('opening the sheet loads from the server (loading -> ready)', async () => {
    const store = appStore({ notifications: [] });
    fake.queue({ data: [dbRow({ id: 'a' }), dbRow({ id: 'b', is_read: true })] });
    store.openNotifications();
    assert.equal(store.state.sheet, 'notifications');
    await waitFor(() => store.state.loads.notifications === 'ready', 'notifications to load');
    assert.equal(store.state.loads.notifications, 'ready');
    assert.deepEqual(store.state.notifications.map((n) => n.id), ['a', 'b']);
  });

  test('a failed load shows the error state, not the "all caught up" empty state', async () => {
    const store = appStore({ notifications: [] });
    const orig = console.error; console.error = () => {};
    try {
      fake.queue({ error: { message: 'boom' } });
      await store.loadNotificationsSupabase();
      assert.equal(store.state.loads.notifications, 'error');
      assert.equal(buildVals(store).noNotifications, false);
    } finally { console.error = orig; }
  });

  test('"all caught up" only shows once loaded and truly empty', async () => {
    const store = appStore({ notifications: [] });
    assert.equal(buildVals(store).noNotifications, false);
    fake.queue({ data: [] });
    await store.loadNotificationsSupabase();
    assert.equal(buildVals(store).noNotifications, true);
  });

  test('mark all read is optimistic and only writes when something is unread', async () => {
    const store = appStore({ notifications: [note(), note({ id: 'n2' })] });
    await store.markAllNotificationsRead();
    assert.ok(store.state.notifications.every((n) => n.isRead));
    assert.ok(fake.has('eq', 'is_read', false));

    fake.reset();
    await store.markAllNotificationsRead();
    assert.equal(fake.calls.length, 0, 'nothing unread -> no request');
  });

  test('mark all read rolls back and reports if the write fails', async () => {
    const store = appStore({ notifications: [note()] });
    fake.queue({ error: { message: 'denied' } });
    await store.markAllNotificationsRead();
    assert.equal(store.state.notifications[0].isRead, false);
    assert.match(store.state.toast, /denied/);
  });

  test('tapping a conversation notification marks it read and opens that chat', async () => {
    const store = appStore({ notifications: [note({ id: 'n1', type: 'match', conversationId: 'c1' })], sheet: 'notifications' });
    fake.queue({}, { data: [] }, {});
    await store.openNotification('n1');
    await waitFor(() => store.state.sheet === 'chat' && fake.calls.some((c) => c.name === 'notifications' && c.ops.some(([m]) => m === 'update')), 'chat to open and read-mark to be sent');
    assert.equal(store.state.notifications[0].isRead, true);
    assert.equal(store.state.sheet, 'chat');
    assert.equal(store.state.activeConvo, 'c1');
    assert.ok(fake.calls.some((c) => c.name === 'notifications' && c.ops.some(([m]) => m === 'update')));
  });

  test('tapping a notification with no chat just closes the sheet', async () => {
    const store = appStore({ sheet: 'notifications' });
    await store.openNotification('n1');
    assert.equal(store.state.sheet, null);
    assert.equal(store.state.notifications[0].isRead, true);
  });

  test('logging out clears notifications', () => {
    const store = appStore();
    buildVals(store).logout();
    assert.deepEqual(store.state.notifications, []);
  });
});
