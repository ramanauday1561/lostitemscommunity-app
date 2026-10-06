/// <reference types="node" />
import { fake } from '../api/setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';
import { REGISTRY_PAGE_SIZE } from '../../src/api/items';
import { waitFor } from './waitFor';

const itemRow = (n: number) => ({
  id: `uuid-${n}`, display_id: `LOST-${n}`, kind: 'lost', status: 'active', title: `Item ${n}`, location_text: 'Here',
  icon: 'inventory_2', description: null, occurred_on: null, created_at: '2026-09-21T10:00:00Z',
  location_lat: null, location_lng: null, reporter_id: 'u1', reporter: { handle: 'ann' },
});
const page = (from: number, n: number) => Array.from({ length: n }, (_, i) => itemRow(from + i));
const FULL = REGISTRY_PAGE_SIZE + 1; // a full page plus the "one more" row that signals hasMore

function registryStore(over: Record<string, unknown> = {}) {
  const store = new Store();
  store.setState({
    screen: 'lost', role: 'user', filter: 'All', q: '',
    profile: { id: 'u1', role: 'user', display_name: 'Ann', handle: 'ann', username: 'ann', post_count: 0, is_suspended: false, created_at: '2026-01-01T00:00:00Z' } as any,
    ...over,
  } as any);
  return store;
}

describe('registry paging (3.4)', () => {
  beforeEach(() => fake.reset());

  test('the first load shows one page and remembers whether more exist', async () => {
    const store = registryStore();
    fake.queue({ data: page(0, FULL) });
    await store.loadRegistry();
    assert.equal(store.state.dbItems?.length, REGISTRY_PAGE_SIZE);
    assert.equal(store.state.registryHasMore, true);
    assert.equal(buildVals(store).registryHasMore, true);
  });

  test('a short result has no "Load more"', async () => {
    const store = registryStore();
    fake.queue({ data: page(0, 5) });
    await store.loadRegistry();
    assert.equal(store.state.registryHasMore, false);
    assert.equal(buildVals(store).registryHasMore, false);
  });

  test('Load more appends the next page, starting after what is already shown', async () => {
    const store = registryStore();
    fake.queue({ data: page(0, FULL) }, { data: page(REGISTRY_PAGE_SIZE, 3) });
    await store.loadRegistry();
    await store.loadMoreRegistry();
    assert.equal(store.state.dbItems?.length, REGISTRY_PAGE_SIZE + 3);
    assert.equal(store.state.registryHasMore, false);
    assert.deepEqual(fake.args('range', 1), [REGISTRY_PAGE_SIZE, REGISTRY_PAGE_SIZE * 2]);
    assert.equal(store.state.registryLoadingMore, false);
  });

  test('rows already on screen are not duplicated if the server shifted between pages', async () => {
    const store = registryStore();
    fake.queue({ data: page(0, FULL) }, { data: page(REGISTRY_PAGE_SIZE - 2, 4) }); // overlaps the last two
    await store.loadRegistry();
    await store.loadMoreRegistry();
    const ids = store.state.dbItems!.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('Load more does nothing when there is no more, or one is already in flight', async () => {
    const store = registryStore();
    await store.loadMoreRegistry();
    assert.equal(fake.calls.length, 0, 'no first page loaded yet / hasMore false');

    fake.queue({ data: page(0, FULL) }, { data: page(REGISTRY_PAGE_SIZE, 1) });
    await store.loadRegistry();
    const first = store.loadMoreRegistry();
    await store.loadMoreRegistry(); // second tap while the first is in flight
    await first;
    assert.equal(fake.calls.length, 2, 'only one extra request was made');
  });

  test('a failed Load more keeps the items, reports it, and can be retried', async () => {
    const store = registryStore();
    const orig = console.error; console.error = () => {};
    try {
      fake.queue({ data: page(0, FULL) }, { error: { message: 'boom' } });
      await store.loadRegistry();
      await store.loadMoreRegistry();
      assert.equal(store.state.dbItems?.length, REGISTRY_PAGE_SIZE);
      assert.equal(store.state.registryHasMore, true, 'still more to try for');
      assert.equal(store.state.registryLoadingMore, false);
      assert.equal(store.state.loads.registry, 'ready', 'the list itself is not put into an error state');
      assert.match(store.state.toast, /Couldn't load more/);

      fake.queue({ data: page(REGISTRY_PAGE_SIZE, 2) });
      await store.loadMoreRegistry();
      assert.equal(store.state.dbItems?.length, REGISTRY_PAGE_SIZE + 2);
    } finally { console.error = orig; }
  });

  test('changing the filter while a next page is loading discards that page', async () => {
    const store = registryStore();
    fake.queue({ data: page(0, FULL) });
    await store.loadRegistry();

    fake.queue({ data: page(100, 2) }, { data: page(200, 3) });
    const more = store.loadMoreRegistry();            // request for page 2 (old filter) in flight
    store.setState({ filter: 'Reunited' } as any);
    await store.loadRegistry();                        // new filter loads page 1
    await more;
    assert.deepEqual(store.state.dbItems!.map((i) => i.id), ['LOST-200', 'LOST-201', 'LOST-202'].slice(0, 3).map((x, i) => `LOST-${200 + i}`));
    assert.equal(store.state.registryHasMore, false);
  });

  test('an older query finishing after a newer one cannot overwrite it', async () => {
    const store = registryStore();
    // Both queries are issued back to back; the FIRST response resolves last.
    fake.queue({ data: page(0, 2) }, { data: page(50, 1) });
    const first = store.loadRegistry();
    const second = store.loadRegistry();
    await Promise.all([first, second]);
    await waitFor(() => store.state.loads.registry === 'ready', 'registry ready');
    assert.equal(store.state.loads.registry, 'ready');
    assert.equal(store.state.dbItems!.length, 1, 'the newest query wins');
    assert.equal(store.state.dbItems![0].id, 'LOST-50');
  });
});

describe('registry map view', () => {
  beforeEach(() => fake.reset());

  test('toggling to the map loads pins for the reported bounds, and selecting a pin exposes the drawer card', async () => {
    const store = registryStore();
    store.setRegistryView('map');
    fake.queue({ data: [{ ...itemRow(1), location_lat: 40.7, location_lng: -73.9 }] });
    await store.mapMoved({ south: 40, west: -74, north: 41, east: -73 });
    let v = buildVals(store);
    assert.deepEqual(v.mapPins, [{ key: 'LOST-1', lat: 40.7, lng: -73.9 }]);
    assert.equal(v.mapCard, null);
    v.mapSelect('LOST-1');
    v = buildVals(store);
    assert.equal(v.mapCard?.title, 'Item 1');
  });

  test('a reload that no longer contains the selected pin clears the drawer', async () => {
    const store = registryStore();
    store.setRegistryView('map');
    fake.queue({ data: [{ ...itemRow(1), location_lat: 40.7, location_lng: -73.9 }] });
    await store.mapMoved({ south: 40, west: -74, north: 41, east: -73 });
    store.setState({ mapSelected: 'LOST-1' } as any);
    fake.queue({ data: [] });
    await store.mapMoved({ south: 10, west: 10, north: 11, east: 11 });
    assert.equal(store.state.mapSelected, null);
  });
});

describe('registry filters sheet state', () => {
  beforeEach(() => fake.reset());

  test('the badge counts active filters and each chip clears its own filter', async () => {
    const store = registryStore();
    assert.equal(buildVals(store).filterCount, 0);
    assert.deepEqual(buildVals(store).filterChips, []);
    store.setState({ filter: 'Active', nearCenter: { lat: 1, lng: 2, label: 'your location' } } as any);
    const v = buildVals(store);
    assert.equal(v.filterCount, 2);
    assert.deepEqual(v.filterChips.map((c) => c.label), ['Active', 'your location · 2 km']);
    v.filterChips[0].clear();
    assert.equal(store.state.filter, 'All');
  });

  test('picking a searched place closes the sheet and centres the registry on it', async () => {
    const store = registryStore({ sheet: 'filters' });
    fake.queue({ data: [] });
    store.setNearCenter({ lat: 1, lng: 2, label: 'Central Station' });
    assert.equal(store.state.sheet, null);
    assert.equal(store.state.nearCenter?.label, 'Central Station');
  });
});
