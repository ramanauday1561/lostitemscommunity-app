/// <reference types="node" />
import { fake } from '../api/setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store, IDLE_LOADS } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';

/** A signed-in Supabase session on the Lost registry, with nothing loaded yet. */
function supabaseStore(over: Record<string, unknown> = {}) {
  const store = new Store();
  store.setState({
    screen: 'lost', role: 'user', filter: 'All', q: '',
    profile: { id: 'u1', role: 'user', display_name: 'Ann', handle: 'ann', username: 'ann', post_count: 0, is_suspended: false, created_at: '2026-01-01T00:00:00Z' } as any,
    ...over,
  } as any);
  return store;
}

const itemRow = (n: number) => ({
  id: `uuid-${n}`, display_id: `LOST-${n}`, kind: 'lost', status: 'active', title: `Item ${n}`, location_text: 'Here',
  icon: 'inventory_2', description: null, occurred_on: null, created_at: '2026-09-21T10:00:00Z',
  location_lat: null, location_lng: null, reporter_id: 'u1', reporter: { handle: 'ann' },
});

describe('list load states (13.3)', () => {
  beforeEach(() => fake.reset());

  test('demo mode never leaves idle, so existing screens are untouched', () => {
    const store = new Store();
    assert.deepEqual(store.state.loads, IDLE_LOADS);
    const v = buildVals(store);
    assert.equal(v.loads.registry, 'idle');
  });

  test('a successful load goes idle -> loading -> ready and stores the rows', async () => {
    const store = supabaseStore();
    const seen: string[] = [];
    store.subscribe(() => seen.push(store.state.loads.registry));
    fake.queue({ data: [itemRow(1)] });
    await store.loadRegistry();
    assert.deepEqual([...new Set(seen)], ['loading', 'ready']);
    assert.equal(store.state.dbItems?.length, 1);
  });

  test('a failed load ends in error (not ready), and retrying can recover', async () => {
    const store = supabaseStore();
    const orig = console.error; console.error = () => {};
    try {
      fake.queue({ error: { message: 'boom' } });
      await store.loadRegistry();
      assert.equal(store.state.loads.registry, 'error');
      assert.equal(buildVals(store).registryEmpty, false, 'an error must not look like an empty registry');

      fake.queue({ data: [itemRow(1)] });
      await buildVals(store).retry.registry();
      assert.equal(store.state.loads.registry, 'ready');
    } finally { console.error = orig; }
  });

  test('the empty state only shows once loaded; never while loading or after an error', async () => {
    const store = supabaseStore();
    assert.equal(buildVals(store).registryEmpty, false, 'before the first load');

    store.setState((s) => ({ loads: { ...s.loads, registry: 'loading' } }));
    assert.equal(buildVals(store).registryEmpty, false, 'while loading');

    fake.queue({ data: [] });
    await store.loadRegistry();
    assert.equal(store.state.loads.registry, 'ready');
    assert.equal(buildVals(store).registryEmpty, true, 'loaded and genuinely empty');
  });

  test('"My posts" empty state follows the same rule', async () => {
    const store = supabaseStore({ filter: 'My posts' });
    assert.equal(buildVals(store).myPostsEmpty, false);
    fake.queue({ data: [] });
    await store.loadRegistry();
    assert.equal(buildVals(store).myPostsEmpty, true);
  });

  test('analysis and ads show nothing (not the mock chart/slots) before real data arrives', () => {
    const store = supabaseStore({ screen: 'analysis', role: 'admin' });
    const v = buildVals(store);
    assert.deepEqual(v.bars, []);
    assert.deepEqual(v.keywords, []);
    assert.deepEqual(v.adSlots, []);
  });

  test('analysis failing sets its own error state', async () => {
    const store = supabaseStore({ screen: 'analysis', role: 'admin' });
    const orig = console.error; console.error = () => {};
    try {
      fake.queue({ error: { message: 'boom' } });
      await store.loadAnalysisSupabase();
      assert.equal(store.state.loads.analysis, 'error');
      assert.equal(store.state.loads.registry, 'idle', 'other lists are unaffected');
    } finally { console.error = orig; }
  });
});

describe('superadmin dashboard tiles', () => {
  beforeEach(() => fake.reset());
  const admin = { id: 'a1', role: 'superadmin', display_name: 'Root', handle: 'root', username: 'root', post_count: 0, is_suspended: false, created_at: '2026-01-01T00:00:00Z' } as any;

  test('show a pending state (not 0) until the stats arrive', async () => {
    const store = supabaseStore({ screen: 'dash', role: 'superadmin', profile: admin });
    assert.equal(buildVals(store).adminStatsPending, true);
    assert.equal(buildVals(store).modStatsPending, true);
    // loadDashboardStats also fetches the account email, which shares the fake's response queue.
    const stats = { data: { active_lost: 4, recovered: 2, active_members: 9 } };
    fake.queue(stats, stats);
    await store.loadDashboardStats(admin);
    const v = buildVals(store);
    assert.equal(store.state.loads.dashboard, 'ready');
    assert.equal(v.adminStatsPending, false);
    assert.equal(v.adminMetrics[0].value, '4');
  });

  test('a failed fetch ends in error so the tiles stop spinning', async () => {
    const store = supabaseStore({ screen: 'dash', role: 'superadmin', profile: admin });
    const orig = console.error; console.error = () => {};
    try {
      fake.queue({ error: { message: 'boom' } });
      await store.loadDashboardStats(admin);
    } finally { console.error = orig; }
    assert.equal(store.state.loads.dashboard, 'error');
    assert.equal(buildVals(store).adminStatsPending, false);
  });
});
