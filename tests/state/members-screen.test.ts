/// <reference types="node" />
import { fake } from '../api/setup';
import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';
import { waitFor } from './waitFor';

const member = (over: Record<string, unknown> = {}) => ({
  id: 'm1', username: 'cara', handle: 'cara', display_name: 'Cara Diaz', role: 'user', is_suspended: false, post_count: 3,
  created_at: '2026-03-15T10:00:00Z', guidelines_accepted_at: null, ...over,
});
function admin(members: unknown[]) {
  const store = new Store();
  store.setState({ screen: 'members', role: 'admin', suTerms: true,
    profile: { id: 'adm', role: 'superadmin' } as any, dbMembers: members } as any);
  return store;
}

describe('admin Members screen in Supabase mode', () => {
  beforeEach(() => fake.reset());
  // a test's trailing reload must finish before the next test starts recording calls
  afterEach(() => new Promise((r) => setTimeout(r, 100)));

  test('lists the REAL profiles, never the demo members', () => {
    const rows = buildVals(admin([member(), member({ id: 'm2', handle: 'ben', display_name: 'Ben', is_suspended: true })])).members;
    assert.deepEqual(rows.map((r) => r.name), ['Cara Diaz', 'Ben']);
    assert.ok(!rows.some((r) => /Alex Jordan|Subway Finder/.test(r.name)));
    assert.equal(rows[0].meta, '@cara · 3 posts · joined Mar 2026');
    assert.deepEqual(rows.map((r) => r.status), ['Active', 'Suspended']);
    assert.deepEqual(rows.map((r) => r.toggleLabel), ['Suspend', 'Restore']);
  });

  test('staff accounts have no actions; nobody has a Remove (there is no permanent delete yet)', () => {
    const rows = buildVals(admin([member(), member({ id: 'a', role: 'superadmin', handle: 'boss', display_name: 'Boss' })])).members;
    assert.deepEqual(rows.map((r) => r.canAct), [true, false]);
    assert.deepEqual(rows.map((r) => r.canRemove), [false, false]);
    assert.match(rows[1].meta, /Super Admin/);
  });

  test('Suspend updates the real profile, then reloads the list', async () => {
    const store = admin([member()]);
    buildVals(store).members[0].toggle();
    await waitFor(() => fake.calls.length >= 2);
    assert.equal(fake.calls[0].name, 'profiles');
    assert.deepEqual(fake.args('update', 0), [{ is_suspended: true }]);
    assert.ok(fake.has('eq', 'id', 'm1'));
    assert.equal(fake.calls[1].name, 'profiles', 'list reloaded');
  });

  test('Restore does the opposite', async () => {
    const store = admin([member({ is_suspended: true })]);
    buildVals(store).members[0].toggle();
    await waitFor(() => fake.calls.length >= 1);
    assert.deepEqual(fake.args('update', 0), [{ is_suspended: false }]);
  });

  test('typing searches on the server after a pause (one request for a burst of keystrokes)', async () => {
    const store = admin([member()]);
    const v = buildVals(store);
    v.onUserQuery('c'); v.onUserQuery('ca'); v.onUserQuery('car');
    await waitFor(() => fake.calls.length >= 1, 'debounced search');
    await new Promise((r) => setTimeout(r, 500));   // a late extra request would show up by now
    assert.equal(fake.calls.length, 1, 'one request for the whole burst');
    assert.ok(fake.has('or', 'username.ilike.%car%,handle.ilike.%car%,display_name.ilike.%car%'));
    assert.equal(store.state.memberSearchQuery, 'car');
  });

  test('a slow, older search never overwrites a newer one', async () => {
    const store = admin([]);
    // first search resolves late with "old", second resolves first with "new"
    fake.queue({ data: [member({ id: 'old', handle: 'old', display_name: 'Old' })] }, { data: [member({ id: 'new', handle: 'new', display_name: 'New' })] });
    const first = store.searchMembersSupabase('a');
    const second = store.searchMembersSupabase('ab');
    await Promise.all([first, second]);
    assert.ok(store.state.dbMembers!.every((m: any) => m.id !== undefined));
    assert.equal(store.state.memberSearchQuery, 'ab');
    assert.deepEqual(store.state.dbMembers!.map((m: any) => m.id), ['new']);
  });
});
