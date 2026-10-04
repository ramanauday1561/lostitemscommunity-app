/// <reference types="node" />
import { fake } from '../api/setup';
import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';
import { waitFor } from './waitFor';

const tables = () => fake.calls.map((c) => c.name);

function admin() {
  const store = new Store();
  store.setState({ screen: 'dash', role: 'admin', suTerms: true,
    profile: { id: 'adm', role: 'superadmin', handle: 'boss' } as any,
    dbItems: [{ id: 'LOST-1', dbId: 'item-uuid', reporterId: 'rep', title: 'Bag', kind: 'Lost', by: 'x', status: 'Active', place: '', date: '', cat: 'Bags', icon: 'bag', desc: '', photos: [] }] as any,
    sel: 'LOST-1' } as any);
  return store;
}

describe('the moderation queue stays fresh for an admin', () => {
  beforeEach(() => fake.reset());

  test('opening Review refetches the queue (items get flagged while the admin is elsewhere)', async () => {
    const store = admin();
    buildVals(store).goModeration();
    await waitFor(() => tables().includes('moderation_flags'));
    assert.equal(store.state.screen, 'moderation');
  });

  test('flagging an item from its detail sheet reloads the queue so it shows up straight away', async () => {
    const store = admin();
    await store.flagItemSupabase();
    await waitFor(() => tables().filter((t) => t === 'moderation_flags').length >= 2, 'insert flag + reload queue');
    assert.equal(tables()[0], 'moderation_flags', 'flag inserted first');
  });

  test('other screens do not trigger it', async () => {
    const store = admin();
    buildVals(store).goAnalysis();
    await new Promise((r) => setTimeout(r, 40));
    assert.ok(!tables().includes('moderation_flags'));
  });
});

describe('Approve / Delete on the review queue (Supabase mode)', () => {
  // let the store's trailing reload finish so it can't leak calls into the next test's recording
  beforeEach(() => fake.reset());
  afterEach(() => new Promise((r) => setTimeout(r, 80)));
  const queue = () => [{
    id: 'flag-uuid-1', target_type: 'item', target_id: 'item-uuid', reason: 'Flagged by a superadmin from the item detail sheet.',
    status: 'pending', target_title: 'Wallet', target_author: 'ann', target_date: '2026-10-01T11:29:00Z', target_ref: 'FOUND-2019',
    created_at: '2026-10-01T11:33:00Z',
  }];
  const withQueue = () => {
    const store = admin();
    store.setState({ dbModerationQueue: queue(), dbModerationStats: { pending: 1, approved: 0, removed: 0 } } as any);
    return store;
  };

  test('rows show the item reference and @handle, not raw uuids and ISO timestamps', () => {
    const row = buildVals(withQueue()).flagged[0];
    assert.equal(row.id, 'FOUND-2019');
    assert.match(row.sub, /^@ann · /);
    assert.ok(!/2026-10-01T/.test(row.sub) && !/-[0-9a-f]{4}-/.test(row.sub));
    assert.equal((row as any).key, 'flag-uuid-1');
  });

  test('Approve calls the database function with the REAL flag id (it used to only edit demo state)', async () => {
    const store = withQueue();
    buildVals(store).flagged[0].approve();
    await waitFor(() => fake.calls.some((c) => c.name === 'resolve_moderation_flag'));
    const rpc = fake.calls.find((c) => c.name === 'resolve_moderation_flag')!;
    assert.deepEqual(rpc.ops[0][1], [{ flag_id: 'flag-uuid-1', approve: true }]);
    await waitFor(() => /FOUND-2019 approved/.test(store.state.toast));
    await waitFor(() => fake.calls.filter((c) => c.name === 'moderation_flags').length >= 1, 'queue reloaded');
  });

  test('Delete does the same with approve=false and says so', async () => {
    const store = withQueue();
    buildVals(store).flagged[0].remove();
    await waitFor(() => fake.calls.some((c) => c.name === 'resolve_moderation_flag'));
    assert.deepEqual(fake.calls.find((c) => c.name === 'resolve_moderation_flag')!.ops[0][1], [{ flag_id: 'flag-uuid-1', approve: false }]);
    await waitFor(() => /FOUND-2019 was permanently deleted/.test(store.state.toast));
  });

  test('a database refusal is shown, and nothing is faked locally', async () => {
    const store = withQueue();
    fake.queue({ error: { message: 'only a superadmin can resolve moderation flags' } });
    buildVals(store).flagged[0].approve();
    await waitFor(() => /only a superadmin/.test(store.state.toast));
    assert.equal(store.state.dbModerationQueue!.length, 1, 'the queue is unchanged');
  });
});

describe('flagging an item that is already in the queue', () => {
  beforeEach(() => fake.reset());
  test('says so instead of failing', async () => {
    const store = admin();
    fake.queue({ error: { message: 'duplicate key', code: '23505' } as any });
    await store.flagItemSupabase();
    assert.match(store.state.toast, /already in the moderation queue/);
  });
});
