/// <reference types="node" />
import { fake } from '../api/setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { waitFor } from './waitFor';

const convo = (over: Record<string, unknown> = {}) => ({
  id: 'c1', itemId: 'i1', item: 'Wallet', icon: 'wallet', with: 'them.handle', time: '09:00', unread: 0, msgs: [], ...over,
});
const msg = (over: Record<string, unknown> = {}) => ({
  id: 'm1', conversation_id: 'c1', sender_id: 'them', body: 'hello', created_at: '2026-09-30T10:00:00Z', read_at: null, ...over,
});

function chatStore(over: Record<string, unknown> = {}) {
  const store = new Store();
  store.setState({
    screen: 'dash', role: 'user', sheet: null, activeConvo: null, convos: [convo()],
    profile: { id: 'me', role: 'user', display_name: 'Me', handle: 'me', username: 'me', post_count: 0, is_suspended: false, created_at: '2026-01-01T00:00:00Z' } as any,
    ...over,
  } as any);
  return store;
}

describe('live chat (5.3)', () => {
  beforeEach(() => fake.reset());

  test('a message in a thread that is not open bumps unread and shows a toast', () => {
    const store = chatStore();
    store.handleIncomingMessage(msg() as any);
    assert.equal(store.state.convos[0].unread, 1);
    assert.match(store.state.toast, /New message from them\.handle/);
    store.handleIncomingMessage(msg({ id: 'm2' }) as any);
    assert.equal(store.state.convos[0].unread, 2);
  });

  test('my own message arriving while the thread is closed (another device) does not count as unread', () => {
    const store = chatStore();
    store.handleIncomingMessage(msg({ sender_id: 'me' }) as any);
    assert.equal(store.state.convos[0].unread, 0);
    assert.equal(store.state.toast, '');
  });

  test('a message for the OPEN thread reloads it, marks it read, and does not toast', async () => {
    const store = chatStore({ sheet: 'chat', activeConvo: 'c1' });
    fake.queue({ data: [{ id: 'm1', sender_id: 'them', body: 'hello', created_at: '2026-09-30T10:00:00Z', read_at: null }] }, {});
    store.handleIncomingMessage(msg() as any);
    await waitFor(() => fake.calls.length >= 2 && store.state.convos[0].unread === 0 && store.state.convos[0].msgs.length === 1, 'thread reload + mark read');
    assert.deepEqual(store.state.convos[0].msgs.map((m) => [m.text, m.from]), [['hello', 'them']]);
    assert.equal(store.state.convos[0].unread, 0);
    assert.equal(store.state.toast, '');
    assert.deepEqual(fake.calls.map((c) => c.name), ['messages', 'messages']); // load, then mark read
    assert.ok(fake.methods(1).includes('update'));
  });

  test('a message for a conversation we have not loaded triggers a conversations reload', async () => {
    const store = chatStore({ convos: [] });
    fake.queue({ data: [] });
    store.handleIncomingMessage(msg({ conversation_id: 'new' }) as any);
    await waitFor(() => fake.calls.length >= 1, 'conversations reload');
    assert.equal(fake.calls[0].name, 'conversations');
  });

  test('startChatRealtime subscribes once (idempotent) and stopChatRealtime unsubscribes', async () => {
    const store = chatStore();
    await store.startChatRealtime('me');
    await store.startChatRealtime('me');
    assert.equal(fake.channels.length, 1);
    assert.equal(fake.channels[0].name, 'chat:me');

    store.stopChatRealtime();
    assert.deepEqual(fake.removedChannels, ['chat:me']);
    await store.startChatRealtime('me'); // can start again after stopping
    assert.equal(fake.channels.length, 2);
    store.stopChatRealtime();
  });

  test('a new conversation event reloads the conversation list', async () => {
    const store = chatStore();
    await store.startChatRealtime('me');
    fake.queue({ data: [] });
    fake.channels[0].listeners[1].cb({ new: { id: 'c9' } });
    await waitFor(() => fake.calls.length >= 1, 'conversations reload');
    assert.equal(fake.calls[0].name, 'conversations');
    store.stopChatRealtime();
  });
});
