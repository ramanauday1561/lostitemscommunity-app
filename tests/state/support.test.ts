/// <reference types="node" />
import { fake } from '../api/setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';
import { FAQ_FALLBACK } from '../../src/api/support';
import { waitFor } from './waitFor';

const faq = (over: Record<string, unknown> = {}) => ({
  id: 'f1', keywords: ['claim', 'owner'], question: 'How can I claim an item?', answer: 'Open the item and message the finder.', position: 1, ...over,
});
const msg = (over: Record<string, unknown> = {}) => ({
  id: 'm1', user_id: 'u1', body: 'hello', sender: 'user', created_at: '2026-09-30T10:00:00Z', ...over,
});

function supportStore(over: Record<string, unknown> = {}) {
  const store = new Store();
  store.setState({
    authMode: 'supabase', screen: 'dash', role: 'user', sheet: 'support', suTerms: true,
    profile: { id: 'u1', role: 'user', display_name: 'Ann', handle: 'ann', username: 'ann', post_count: 0, is_suspended: false, created_at: '2026-01-01T00:00:00Z' } as any,
    dbFaqEntries: [faq(), faq({ id: 'f2', keywords: ['photo'], question: 'How do I add a photo?', answer: 'Tap Add a photo.', position: 2 })] as any,
    dbSupportMessages: [],
    ...over,
  } as any);
  return store;
}
const inserts = () => fake.calls.filter((c) => c.name === 'support_messages' && c.ops.some(([m]) => m === 'insert'))
  .map((c) => (c.ops.find(([m]) => m === 'insert')![1] as [{ body: string; sender: string }])[0]);

describe('support chat in Supabase mode (11.1-11.2)', () => {
  beforeEach(() => fake.reset());

  test('the chips are the real FAQ questions, not the mock ones', () => {
    const v = buildVals(supportStore());
    assert.deepEqual(v.faqChips.map((c) => c.q), ['How can I claim an item?', 'How do I add a photo?']);
  });

  test('the conversation is the stored one; an empty history shows the assistant greeting', () => {
    const empty = buildVals(supportStore());
    assert.equal(empty.supportMessages.length, 1);
    assert.equal(empty.supportMessages[0].mine, false);

    const v = buildVals(supportStore({ dbSupportMessages: [msg(), msg({ id: 'm2', body: 'hi back', sender: 'bot' })] }));
    assert.deepEqual(v.supportMessages.map((m) => [m.text, m.mine]), [['hello', true], ['hi back', false]]);
  });

  test('asking stores the question, then the matching FAQ answer as the bot, and reloads', async () => {
    const store = supportStore();
    // user insert, reload, bot insert, reload
    fake.queue({}, { data: [msg({ body: 'how do I claim this?' })] }, {}, { data: [msg({ body: 'how do I claim this?' }), msg({ id: 'm2', body: 'Open the item and message the finder.', sender: 'bot' })] });
    store.askBot('how do I claim this?');
    assert.equal(store.state.botTyping, true);
    await waitFor(() => !store.state.botTyping && inserts().length === 2, 'bot answer to be stored', 5000);

    assert.deepEqual(inserts().map((i) => [i.sender, i.body]), [
      ['user', 'how do I claim this?'],
      ['bot', 'Open the item and message the finder.'],
    ]);
    assert.equal(store.state.dbSupportMessages?.length, 2);
    assert.equal(store.state.supportDraft, '');
  });

  test('a question with no FAQ match gets the fallback answer', async () => {
    const store = supportStore();
    store.askBot('what is the weather like?');
    await waitFor(() => !store.state.botTyping && inserts().length === 2, 'fallback to be stored', 5000);
    assert.equal(inserts()[1].body, FAQ_FALLBACK);
  });

  test('a failed send restores the draft and does not store a bot answer', async () => {
    const store = supportStore();
    const orig = console.error; console.error = () => {};
    try {
      fake.queue({ error: { message: 'denied' } });
      store.askBot('hello?');
      await waitFor(() => !store.state.botTyping, 'bot to stop typing');
      assert.equal(store.state.supportDraft, 'hello?');
      assert.equal(inserts().length, 1, 'only the failed user insert was attempted');
      assert.match(store.state.toast, /Couldn't send/);
    } finally { console.error = orig; }
  });

  test('a blank question does nothing', () => {
    const store = supportStore();
    store.askBot('   ');
    assert.equal(fake.calls.length, 0);
    assert.equal(store.state.botTyping, false);
  });

  test('demo mode still uses the mock FAQ and keeps messages local', () => {
    const store = new Store();
    const chips = buildVals(store).faqChips;
    assert.ok(chips.length > 0);
    assert.equal(fake.calls.length, 0);
  });
});

describe('logout clears every cached server list', () => {
  test('all db* fields (and notifications) are reset, so the next account never sees the last user\'s data', () => {
    const store = new Store();
    store.setState({ authMode: 'supabase', screen: 'dash', role: 'admin' } as any);
    const dbKeys = Object.keys(store.state).filter((k) => k.startsWith('db'));
    assert.ok(dbKeys.length >= 12, `expected the cached lists to be db* fields, found ${dbKeys.join(',')}`);
    const filled: Record<string, unknown> = {};
    for (const k of dbKeys) filled[k] = [{ leak: true }];
    store.setState({ ...filled, notifications: [{ id: 'n' }] } as any);

    buildVals(store).logout();
    for (const k of dbKeys) assert.equal((store.state as any)[k], null, `${k} should be cleared on logout`);
    assert.deepEqual(store.state.notifications, []);
  });
});
