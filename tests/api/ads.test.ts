/// <reference types="node" />
import { fake } from './setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as ads from '../../src/api/ads';

describe('ads api', () => {
  beforeEach(() => fake.reset());

  test('getAdCampaigns is ordered by name; null data is []; errors throw', async () => {
    fake.queue({ data: [{ id: 'c1', name: 'A' }] });
    assert.equal((await ads.getAdCampaigns()).length, 1);
    assert.ok(fake.has('order', 'name', { ascending: true }));
    fake.queue({ data: null });
    assert.deepEqual(await ads.getAdCampaigns(), []);
    fake.queue({ error: { message: 'denied' } });
    await assert.rejects(ads.getAdCampaigns());
  });

  test('getAdPlacements reads the status view ordered by screen; errors throw', async () => {
    fake.queue({ data: [{ id: 'p1', display_id: 'AD-01' }] });
    assert.equal((await ads.getAdPlacements())[0].display_id, 'AD-01');
    assert.equal(fake.calls[0].name, 'ad_placements_with_status');
    assert.ok(fake.has('order', 'screen', { ascending: true }));
    fake.queue({ error: { message: 'denied' } });
    await assert.rejects(ads.getAdPlacements());
  });

  describe('toggleAdLive', () => {
    test('updates is_live, then returns the row re-read from the status view', async () => {
      fake.queue({ data: { id: 'p1' } }, { data: { id: 'p1', ended: true, days_left: 0 } });
      const r = await ads.toggleAdLive('p1', false);
      assert.equal(fake.calls[0].name, 'ad_placements');
      assert.deepEqual(fake.args('update', 0), [{ is_live: false }]);
      assert.equal(fake.calls[1].name, 'ad_placements_with_status');
      assert.equal(r.ended, true);
    });

    test('a failed update does not re-read', async () => {
      fake.queue({ error: { message: 'denied' } });
      await assert.rejects(ads.toggleAdLive('p1', true));
      assert.equal(fake.calls.length, 1);
    });
  });

  describe('updateAdPlacement', () => {
    test('sets campaign + duration, starts today and goes live', async () => {
      fake.queue({}, { data: { id: 'p1', is_live: true } });
      await ads.updateAdPlacement('p1', 'camp1', 14);
      const [patch] = fake.args('update', 0) as [Record<string, unknown>];
      assert.equal(patch.campaign_id, 'camp1');
      assert.equal(patch.duration_days, 14);
      assert.equal(patch.is_live, true);
      assert.equal(patch.starts_at, new Date().toISOString().split('T')[0]);
    });

    test('throws if the update or the re-read fails', async () => {
      fake.queue({ error: { message: 'denied' } });
      await assert.rejects(ads.updateAdPlacement('p1', 'c', 7));
      fake.reset();
      fake.queue({}, { error: { message: 'gone' } });
      await assert.rejects(ads.updateAdPlacement('p1', 'c', 7));
    });
  });
});
