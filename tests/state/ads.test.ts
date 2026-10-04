/// <reference types="node" />
import { fake } from '../api/setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';

const placement = (over: Record<string, unknown> = {}) => ({
  id: 'p-uuid-1', display_id: 'AD-01', campaign_id: 'c-uuid-1', screen: 'Home', slot: 'Below activity', format: 'Native strip',
  size: '320 x 104', duration_days: 30, starts_at: '2026-09-20', is_live: true, revenue: 120.5, impressions: 4000, ctr: 2.5,
  days_left: 12, ended: false, campaign_key: 'keysmart', campaign_name: 'KeySmart tags', advertiser: 'KeySmart', icon: 'key',
  rate_label: '$14 CPM', cpm: 14, ...over,
});
const campaign = (over: Record<string, unknown> = {}) => ({
  id: 'c-uuid-1', key: 'keysmart', name: 'KeySmart tags', advertiser: 'KeySmart', icon: 'key', rate_label: '$14 CPM', cpm: 14, ...over,
});

function adStore(over: Record<string, unknown> = {}) {
  const store = new Store();
  store.setState({
    screen: 'ads', role: 'admin',
    profile: { id: 'adm', role: 'superadmin', display_name: 'Admin', handle: 'admin', username: 'admin', post_count: 0, is_suspended: false, created_at: '2026-01-01T00:00:00Z' } as any,
    dbAdPlacements: [placement(), placement({ id: 'p-uuid-2', display_id: 'AD-02', screen: 'Forum', is_live: false, days_left: 0, ended: true, revenue: 0, impressions: 0, ctr: 0 })] as any,
    dbAdCampaigns: [campaign(), campaign({ id: 'c-uuid-2', key: 'citylock', name: 'CityLock 24h', advertiser: 'CityLock', icon: 'lock', rate_label: '$22 CPM', cpm: 22 })] as any,
    suTerms: true,
    ...over,
  } as any);
  return store;
}

describe('ads in Supabase mode (10.1-10.5)', () => {
  beforeEach(() => fake.reset());

  test('the list shows the real placements, never the mock ones', () => {
    const v = buildVals(adStore());
    assert.deepEqual(v.adSlots.map((a) => a.id), ['p-uuid-1', 'p-uuid-2']);
    assert.equal(v.adSlots[0].campaign, 'KeySmart tags');
    assert.deepEqual(v.adSlots[0].metrics.map((m) => m.value), ['$121', '4.0K', '2.5%']); // real revenue / impressions / CTR
    assert.equal(v.adSlots[1].statusLabel, 'Ended');
  });

  test('totals come from the real rows, with no fake month-over-month figure', () => {
    const v = buildVals(adStore());
    assert.equal(v.adRevenue, '$121');
    assert.equal(v.adRevenueDelta, '');
    assert.deepEqual(v.adTotals.map((t) => t.value), ['4.0K', '1 / 2', '1.3%']);
    assert.equal(v.adLiveCount, '1 running');
  });

  test('before anything has loaded there are no rows, and the averages do not divide by zero', () => {
    const v = buildVals(adStore({ dbAdPlacements: null, dbAdCampaigns: null }));
    assert.deepEqual(v.adSlots, []);
    assert.equal(v.adTotals[2].value, '0.0%');
    assert.equal(v.adRevenue, '$0');
  });

  test('the editor edits the selected REAL placement and offers the real campaigns', () => {
    const store = adStore();
    buildVals(store).adSlots[1].edit();
    const v = buildVals(store);
    assert.equal(v.sheetAd, true);
    assert.equal(v.adEdit.id, 'AD-02');
    assert.equal(v.adEdit.screen, 'Forum');
    assert.deepEqual(v.adCampaigns.map((c) => c.key), ['keysmart', 'citylock']);
    assert.equal(v.adCampaigns[0].on, true, 'the placement\'s current campaign is preselected');
  });

  test('picking a campaign and a duration updates the draft and the projection', () => {
    const store = adStore();
    buildVals(store).adSlots[0].edit();
    buildVals(store).adCampaigns[1].pick();
    buildVals(store).adDurations.find((d) => d.label === '60 days')!.pick();
    assert.deepEqual(store.state.adDraft, { campaignKey: 'citylock', days: 60 });
    const v = buildVals(store);
    assert.equal(v.adEdit.advertiser, 'CityLock');
    assert.match(v.adEdit.projectedNote, /60 days at \$22 CPM/);
  });

  test('saving updates the real placement (campaign uuid, days), reloads, closes the sheet and toasts', async () => {
    const store = adStore();
    buildVals(store).adSlots[0].edit();
    buildVals(store).adCampaigns[1].pick();
    fake.queue({}, { data: { id: 'p-uuid-1' } }, { data: [placement({ campaign_key: 'citylock', advertiser: 'CityLock' })] }, { data: [campaign()] });
    await buildVals(store).saveAd();
    const update = fake.calls.find((c) => c.name === 'ad_placements')!;
    const [patch] = update.ops.find(([m]) => m === 'update')![1] as [Record<string, unknown>];
    assert.equal(patch.campaign_id, 'c-uuid-2');
    assert.equal(patch.is_live, true);
    assert.ok(update.ops.some(([m, a]) => m === 'eq' && a[0] === 'id' && a[1] === 'p-uuid-1'));
    assert.equal(store.state.sheet, null);
    assert.match(store.state.toast, /AD-01 updated · CityLock for 30 days/);
  });

  test('a failed save keeps the sheet open and reports the error', async () => {
    const store = adStore();
    buildVals(store).adSlots[0].edit();
    fake.queue({ error: { message: 'permission denied' } });
    await buildVals(store).saveAd();
    assert.equal(store.state.sheet, 'ad');
    // The API throws Supabase's error object (not an Error), so the store shows its generic message.
    assert.match(store.state.toast, /Could not save this placement/);
  });

  test('saving with no campaign picked does not call the database', async () => {
    const store = adStore({ dbAdCampaigns: [] });
    buildVals(store).adSlots[0].edit();
    await buildVals(store).saveAd();
    assert.equal(fake.calls.length, 0);
  });

  describe('live slots on member screens (10.5)', () => {
    const slot = (store: Store, screen: string) => store.slotFor(screen, false, store.state) as any;

    test('a live, unexpired placement shows its real campaign', () => {
      const s = slot(adStore(), 'Home');
      assert.deepEqual([s.live, s.campaign, s.advertiser, s.icon], [true, 'KeySmart tags', 'KeySmart', 'key']);
    });

    test('paused, ended, missing or unknown screens show nothing', () => {
      const store = adStore();
      assert.equal(slot(store, 'Forum').live, false, 'paused/ended');
      assert.equal(slot(store, 'Registry').live, false, 'no placement for that screen');
      assert.equal(slot(adStore({ dbAdPlacements: null }), 'Home').live, false, 'not loaded yet');
    });

    test('an expired placement is hidden even if still flagged live', () => {
      const store = adStore({ dbAdPlacements: [placement({ days_left: 0, ended: true })] });
      assert.equal(slot(store, 'Home').live, false);
    });

    test('a brand-new user who has not accepted the guidelines sees no ads (same rule as the prototype)', () => {
      const store = adStore({ suTerms: false });
      assert.equal(store.slotFor('Home', true, store.state).live, false);
      assert.equal(store.slotFor('Home', false, store.state).live, true);
    });
  });

  test('loadAdsSupabase fills placements and campaigns for any signed-in user', async () => {
    const store = adStore({ dbAdPlacements: null, dbAdCampaigns: null, role: 'user' });
    fake.queue({ data: [placement()] }, { data: [campaign()] });
    await store.loadAdsSupabase();
    assert.equal(store.state.dbAdPlacements?.length, 1);
    assert.equal(store.state.dbAdCampaigns?.length, 1);
    assert.equal(store.state.loads.ads, 'ready');
  });
});
