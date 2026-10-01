/// <reference types="node" />
import { fake } from '../api/setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { waitFor } from './waitFor';

const profile = (over: Record<string, unknown> = {}) => ({
  id: 'u1', role: 'user', display_name: 'Ann', handle: 'ann', username: 'ann', post_count: 0, is_suspended: false,
  created_at: '2026-01-01T00:00:00Z', guidelines_accepted_at: '2026-01-02T00:00:00Z', ...over,
});
const tables = () => new Set(fake.calls.filter((c) => c.kind === 'from').map((c) => c.name));
const quiet = async (fn: () => Promise<void>) => { const o = console.error; console.error = () => {}; try { await fn(); } finally { console.error = o; } };

/** Returning to the app with a stored session must load the same things as typing the password. */
describe('returning with a stored session loads everything sign-in does', () => {
  beforeEach(() => fake.reset());

  const MEMBER_TABLES = ['items', 'conversations', 'notifications', 'forum_threads', 'faq_entries', 'support_messages'];

  async function restore(p: ReturnType<typeof profile>) {
    const store = new Store();
    // getSession -> a session, getUser -> a user, profiles.single -> the profile, then empty lists.
    fake.queue({ data: { session: { user: { id: p.id } } } }, { data: { user: { id: p.id, email: 'a@b.co' } } }, { data: p });
    await quiet(async () => { await store.restoreSession(); await waitFor(() => tables().has('faq_entries') || store.state.screen !== 'welcome'); await new Promise((r) => setTimeout(r, 150)); });
    return store;
  }

  test('a member gets the FAQ, their support thread, the forum, chats and notifications', async () => {
    const store = await restore(profile());
    assert.equal(store.state.screen, 'dash');
    for (const t of MEMBER_TABLES) assert.ok(tables().has(t), `${t} should have been loaded (loaded: ${[...tables()].join(', ')})`);
    assert.ok(!tables().has('support_requests'), 'a member never loads the admin inbox');
  });

  test('a superadmin additionally gets the moderation queue, support inbox, members and analysis', async () => {
    const store = await restore(profile({ id: 'adm', role: 'superadmin' }));
    assert.equal(store.state.screen, 'dash');
    for (const t of [...MEMBER_TABLES.filter((t) => t !== 'items'), 'admin_dashboard_stats', 'moderation_flags', 'support_requests', 'profiles', 'moderation_keywords']) {
      assert.ok(tables().has(t), `${t} should have been loaded (loaded: ${[...tables()].join(', ')})`);
    }
  });

  test('no stored session: nothing is loaded and the user stays on the welcome screen', async () => {
    const store = new Store();
    fake.queue({ data: { session: null } });
    await store.restoreSession();
    assert.equal(store.state.screen, 'welcome');
    assert.ok(![...tables()].includes('faq_entries'));
  });
});
