/// <reference types="node" />
import { fake } from '../api/setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';
import { HANDOFF_NOTICE } from '../../src/api/support';
import { waitFor } from './waitFor';

const profile = (over: Record<string, unknown> = {}) => ({
  id: 'u1', role: 'user', display_name: 'Ann', handle: 'ann', username: 'ann', post_count: 0, is_suspended: false, created_at: '2026-01-01T00:00:00Z', ...over,
}) as any;
const tables = () => fake.calls.map((c) => c.name);
const quiet = async (fn: () => Promise<void> | void) => { const o = console.error; console.error = () => {}; try { await fn(); } finally { console.error = o; } };

function member() {
  const store = new Store();
  store.setState({ screen: 'dash', role: 'user', sheet: 'support', suTerms: true, profile: profile(), dbSupportMessages: [] } as any);
  return store;
}
function admin(inbox: unknown = null) {
  const store = new Store();
  store.setState({ screen: 'dash', role: 'admin', suTerms: true, profile: profile({ id: 'adm', role: 'superadmin', handle: 'superadmin', display_name: 'Super' }), dbSupportInbox: inbox } as any);
  return store;
}
const item = (over: Record<string, unknown> = {}) => ({
  requestId: 'r1', userId: 'u1', handle: 'ann', displayName: 'Ann', openedAt: '2026-10-01T09:00:00Z',
  messages: [{ id: 'm1', user_id: 'u1', body: 'my question', sender: 'user', created_at: '2026-10-01T09:00:00Z' }], ...over,
});

describe('"Talk to a human" (11.3)', () => {
  beforeEach(() => fake.reset());

  describe('member side', () => {
    test('opens a request, posts the hand-off notice into the thread, reloads and confirms', async () => {
      const store = member();
      buildVals(store).escalate();
      await waitFor(() => !!store.state.toast);
      assert.deepEqual(tables().slice(0, 2), ['support_requests', 'support_messages']);
      assert.deepEqual(fake.args('insert', 1), [{ user_id: 'u1', body: HANDOFF_NOTICE, sender: 'bot' }]);
      assert.equal(tables()[2], 'support_messages', 'thread reloaded');
      assert.match(store.state.toast, /Passed to our support team/);
      assert.equal(store.state.sheet, 'support', 'the sheet stays open so they see the notice');
    });

    test('asking again while a request is open does not duplicate the notice', async () => {
      const store = member();
      fake.queue({ error: { message: 'duplicate', code: '23505' } as any });
      buildVals(store).escalate();
      await waitFor(() => !!store.state.toast);
      assert.ok(!fake.calls.some((c) => c.ops.some(([m, a]) => m === 'insert' && (a[0] as any).sender === 'bot')), 'no second notice');
      assert.match(store.state.toast, /already with our support team/);
    });

    test('a rate-limit rejection shows its message; other failures are generic', async () => {
      const a = member();
      fake.queue({ error: { message: 'You are doing that too often. Please wait a few minutes and try again.' } });
      await quiet(async () => { buildVals(a).escalate(); await waitFor(() => !!a.state.toast); });
      assert.match(a.state.toast, /too often/);

      fake.reset();
      const b = member();
      fake.queue({ error: { message: 'relation "x" does not exist' } });
      await quiet(async () => { buildVals(b).escalate(); await waitFor(() => !!b.state.toast); });
      assert.equal(b.state.toast, "Couldn't reach the support team. Please try again.");
    });

    test('a "Support replied" notification refreshes the thread, and tapping it opens the support sheet', async () => {
      const store = member();
      store.setState({ sheet: null } as any);
      await store.handleIncomingNotification({ id: 'n1', user_id: 'u1', type: 'system', title: 'Support replied', body: 'Hi', created_at: '2026-10-01T10:00:00Z', is_read: false, item_id: null, conversation_id: null } as any);
      await waitFor(() => tables().includes('support_messages'));
      fake.reset();
      await store.openNotification('n1');
      assert.equal(store.state.sheet, 'support');
      await waitFor(() => tables().includes('support_messages'));
    });
  });

  describe('superadmin inbox', () => {
    test('a non-admin never loads the inbox', async () => {
      const store = member();
      await store.loadSupportInboxSupabase();
      assert.equal(fake.calls.length, 0);
    });

    test('loads into state with load status ready, and the dashboard count follows', async () => {
      const store = admin();
      fake.queue(
        { data: [{ id: 'r1', user_id: 'u1', created_at: '2026-10-01T09:00:00Z', profiles: { handle: 'ann', display_name: 'Ann' } }] },
        { data: [{ id: 'm1', user_id: 'u1', body: 'my question', sender: 'user', created_at: '2026-10-01T09:00:00Z' }] },
      );
      await store.loadSupportInboxSupabase();
      assert.equal(store.state.loads.support, 'ready');
      const v = buildVals(store);
      assert.equal(v.supportOpenCount, 1);
      assert.equal(v.supportInbox[0].name, 'Ann');
      assert.equal(v.supportInbox[0].needsReply, true);
      assert.equal(v.supportInbox[0].status, 'Needs a reply');
    });

    test('a load failure shows as an error (not an empty inbox)', async () => {
      const store = admin();
      fake.queue({ error: { message: 'boom' } });
      await quiet(() => store.loadSupportInboxSupabase());
      assert.equal(store.state.loads.support, 'error');
    });

    test('a thread whose last message is from staff reads "Replied, waiting on member"', () => {
      const store = admin([item({ messages: [
        { id: 'm1', user_id: 'u1', body: 'q', sender: 'user', created_at: '2026-10-01T09:00:00Z' },
        { id: 'm2', user_id: 'u1', body: 'a', sender: 'agent', created_at: '2026-10-01T09:05:00Z' },
      ] })]);
      const row = buildVals(store).supportInbox[0];
      assert.equal(row.needsReply, false);
      assert.equal(row.status, 'Replied, waiting on member');
    });

    test('open shows that member\'s thread, with staff messages on the right', () => {
      const store = admin([item({ messages: [
        { id: 'm1', user_id: 'u1', body: 'q', sender: 'user', created_at: '2026-10-01T09:00:00Z' },
        { id: 'm2', user_id: 'u1', body: 'a', sender: 'agent', created_at: '2026-10-01T09:05:00Z' },
      ] })]);
      buildVals(store).supportInbox[0].open();
      const v = buildVals(store);
      assert.equal(store.state.sheet, 'supportReply');
      assert.equal(v.sheetSupportReply, true);
      assert.deepEqual(v.supportReplyMessages.map((m: any) => m.mine), [false, true]);
      assert.equal(v.supportReplyWho?.handle, 'ann');
    });

    test('reply stores an agent message for the member, clears the draft and refreshes the inbox', async () => {
      const store = admin([item()]);
      store.openSupportReply('u1');
      store.setState({ supportReplyDraft: '  Happy to help  ' } as any);
      await store.sendSupportReply();
      assert.deepEqual(fake.args('insert', 0), [{ user_id: 'u1', body: 'Happy to help', sender: 'agent' }]);
      assert.equal(fake.calls[0].name, 'support_messages');
      assert.equal(store.state.supportReplyDraft, '');
      assert.ok(tables().includes('support_requests'), 'inbox reloaded');
    });

    test('a failed reply keeps the draft and says why', async () => {
      const store = admin([item()]);
      store.openSupportReply('u1');
      store.setState({ supportReplyDraft: 'text' } as any);
      fake.queue({ error: { message: 'permission denied' } });
      await store.sendSupportReply();
      assert.equal(store.state.supportReplyDraft, 'text');
      assert.match(store.state.toast, /permission denied/);
    });

    test('an empty reply sends nothing', async () => {
      const store = admin([item()]);
      store.openSupportReply('u1');
      store.setState({ supportReplyDraft: '   ' } as any);
      await store.sendSupportReply();
      assert.equal(fake.calls.length, 0);
    });

    test('resolve closes the request, closes the reply sheet, reloads and confirms', async () => {
      const store = admin([item()]);
      store.openSupportReply('u1');
      await store.resolveSupportRequest('r1');
      assert.equal(fake.calls[0].name, 'support_requests');
      assert.equal((fake.args('update', 0)![0] as any).closed_by, 'adm');
      assert.equal(store.state.sheet, null);
      assert.equal(store.state.activeSupportUser, null);
      assert.equal(store.state.toast, 'Request resolved.');
    });

    test('logout clears the cached inbox (another account on this device must not see it)', () => {
      const store = admin([item()]);
      buildVals(store).logout();
      assert.equal(store.state.dbSupportInbox, null);
      assert.equal(store.state.activeSupportUser, null);
    });
  });
});
