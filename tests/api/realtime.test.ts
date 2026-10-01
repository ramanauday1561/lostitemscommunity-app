/// <reference types="node" />
import { fake } from './setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as rt from '../../src/api/realtime';

describe('realtime api', () => {
  beforeEach(() => fake.reset());

  test('subscribes to INSERTs on messages, conversations and the user\'s own notifications', () => {
    rt.subscribeToChat('u1', { onMessage: () => {}, onConversation: () => {} });
    assert.equal(fake.channels.length, 1);
    const [ch] = fake.channels;
    assert.equal(ch.name, 'chat:u1');
    assert.equal(ch.subscribed, true);
    assert.deepEqual(ch.listeners.map((l) => l.filter), [
      { event: 'INSERT', schema: 'public', table: 'messages' },
      { event: 'INSERT', schema: 'public', table: 'conversations' },
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.u1' },
    ]);
  });

  test('passes the new message row to onMessage and signals onConversation', () => {
    const msgs: unknown[] = []; let convs = 0;
    rt.subscribeToChat('u1', { onMessage: (m) => msgs.push(m), onConversation: () => { convs++; } });
    const [messageL, convL] = fake.channels[0].listeners;
    messageL.cb({ new: { id: 'm1', conversation_id: 'c1', body: 'hi' } });
    convL.cb({ new: { id: 'c2' } });
    assert.deepEqual(msgs, [{ id: 'm1', conversation_id: 'c1', body: 'hi' }]);
    assert.equal(convs, 1);
  });

  test('passes the new notification row to onNotification (and tolerates no handler)', () => {
    const got: unknown[] = [];
    rt.subscribeToChat('u1', { onMessage: () => {}, onConversation: () => {}, onNotification: (n) => got.push(n) });
    fake.channels[0].listeners[2].cb({ new: { id: 'n1', title: 'Hi' } });
    assert.deepEqual(got, [{ id: 'n1', title: 'Hi' }]);

    fake.reset();
    rt.subscribeToChat('u1', { onMessage: () => {}, onConversation: () => {} });
    assert.doesNotThrow(() => fake.channels[0].listeners[2].cb({ new: { id: 'n2' } }));
  });

  test('the returned function removes the channel', () => {
    const off = rt.subscribeToChat('u1', { onMessage: () => {}, onConversation: () => {} });
    assert.deepEqual(fake.removedChannels, []);
    off();
    assert.deepEqual(fake.removedChannels, ['chat:u1']);
  });
});
