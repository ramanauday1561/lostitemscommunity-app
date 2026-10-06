/// <reference types="node" />
import { fake } from './setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as items from '../../src/api/items';

const row = (over: Record<string, unknown> = {}) => ({
  id: 'uuid-1', display_id: 'LOST-1031', kind: 'lost', status: 'active', title: 'Blue backpack',
  location_text: 'Union Station', icon: 'backpack', description: null, occurred_on: '2026-09-20',
  created_at: '2026-09-21T10:00:00Z', location_lat: null, location_lng: null, reporter_id: 'u1',
  reporter: { handle: 'ann' }, ...over,
});

describe('items api', () => {
  beforeEach(() => fake.reset());

  describe('toFrontendItem', () => {
    test('maps enums to UI labels and keeps the db ids', () => {
      const it = items.toFrontendItem(row({ kind: 'found', status: 'reunited' }) as any);
      assert.equal(it.kind, 'Found');
      assert.equal(it.status, 'Reunited');
      assert.equal(it.id, 'LOST-1031');
      assert.equal(it.dbId, 'uuid-1');
      assert.equal(it.reporterId, 'u1');
      assert.equal(it.desc, '');
      assert.equal(it.coords, null);
    });

    test('handles the reporter join as an object or a one-element array, or null', () => {
      assert.equal(items.toFrontendItem(row({ reporter: [{ handle: 'bo' }] }) as any).by, 'bo');
      assert.equal(items.toFrontendItem(row({ reporter: [] }) as any).by, '');
      assert.equal(items.toFrontendItem(row({ reporter: null }) as any).by, '');
    });

    test('uses the first photo (by position, then upload time) as the list thumbnail', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://proj.supabase.co';
      const photos = [
        { storage_path: 'u1/uuid-1/b.jpg', position: 0, created_at: '2026-09-21T10:05:00Z' },
        { storage_path: 'u1/uuid-1/a.jpg', position: 0, created_at: '2026-09-21T10:01:00Z' },
        { storage_path: 'u1/uuid-1/c.jpg', position: 1, created_at: '2026-09-21T09:00:00Z' },
      ];
      assert.equal(items.toFrontendItem(row({ photos }) as any).photo, 'https://proj.supabase.co/storage/v1/object/public/item-photos/u1/uuid-1/a.jpg');
    });

    test('a post without photos has no thumbnail (the row falls back to its icon)', () => {
      assert.equal(items.toFrontendItem(row() as any).photo, undefined);
      assert.equal(items.toFrontendItem(row({ photos: [] }) as any).photo, undefined);
    });

    test('formats coords only when both lat and lng exist', () => {
      assert.equal(items.toFrontendItem(row({ location_lat: 40.7, location_lng: -73.9 }) as any).coords, '40.7, -73.9');
      assert.equal(items.toFrontendItem(row({ location_lat: 40.7 }) as any).coords, null);
    });
  });

  describe('listItems', () => {
    test('asks for each post\'s photos in the same query', async () => {
      fake.queue({ data: [] });
      await items.listItems({ kind: 'lost', filter: 'All' });
      const select = fake.calls[0].ops.find(([m]) => m === 'select')![1][0] as string;
      assert.match(select, /photos:item_photos\(storage_path, position, created_at\)/);
    });

    test('filters by kind, newest first, capped at 50', async () => {
      fake.queue({ data: [row()] });
      const r = await items.listItems({ kind: 'lost', filter: 'All' });
      assert.equal(r.items.length, 1);
      assert.ok(fake.has('eq', 'kind', 'lost'));
      assert.ok(fake.has('order', 'created_at', { ascending: false }));
      assert.ok(!fake.calls[0].ops.some(([m, a]) => m === 'eq' && a[0] === 'status'));
    });

    test('"My posts" filters by reporter, and returns [] without a user (no query at all would be wrong: it must not leak all rows)', async () => {
      fake.queue({ data: [row()] });
      await items.listItems({ kind: 'lost', filter: 'My posts', userId: 'u1' });
      assert.ok(fake.has('eq', 'reporter_id', 'u1'));

      fake.reset();
      assert.deepEqual(await items.listItems({ kind: 'lost', filter: 'My posts', userId: null }), { items: [], hasMore: false });
    });

    test('a status pill becomes a lowercase status filter', async () => {
      fake.queue({ data: [] });
      await items.listItems({ kind: 'found', filter: 'Reunited' });
      assert.ok(fake.has('eq', 'status', 'reunited'));
    });

    test('search term is ilike\'d across title, location and display id', async () => {
      fake.queue({ data: [] });
      await items.listItems({ kind: 'lost', filter: 'All', query: '  keys ' });
      const [expr] = fake.args('or') as [string];
      assert.equal(expr, 'title.ilike.%keys%,location_text.ilike.%keys%,display_id.ilike.%keys%');
    });

    test('search strips % and , so a term cannot inject extra PostgREST filters', async () => {
      fake.queue({ data: [] });
      await items.listItems({ kind: 'lost', filter: 'All', query: 'a%,status.eq.flagged' });
      const [expr] = fake.args('or') as [string];
      assert.ok(!expr.includes('%,status'));
      assert.equal(expr.split(',').length, 3);
    });

    test('a query error throws (so the UI can show an error + retry, not a fake empty list)', async () => {
      fake.queue({ error: { message: 'boom' } });
      await assert.rejects(items.listItems({ kind: 'lost', filter: 'All' }), /boom/);
    });

    test('null data with no error is a genuine empty list', async () => {
      fake.queue({ data: null });
      assert.deepEqual(await items.listItems({ kind: 'lost', filter: 'All' }), { items: [], hasMore: false });
    });

    describe('paging (3.4)', () => {
      const rows = (n: number) => Array.from({ length: n }, (_, i) => row({ id: `uuid-${i}`, display_id: `LOST-${i}` }));

      test('the first page asks for rows 0..pageSize (inclusive) in a stable order', async () => {
        fake.queue({ data: [] });
        await items.listItems({ kind: 'lost', filter: 'All' });
        assert.deepEqual(fake.args('range'), [0, items.REGISTRY_PAGE_SIZE]);
        assert.ok(fake.has('order', 'created_at', { ascending: false }));
        assert.ok(fake.has('order', 'id', { ascending: true }), 'tie-break so equal timestamps cannot swap between pages');
      });

      test('a later page starts at the offset', async () => {
        fake.queue({ data: [] });
        await items.listItems({ kind: 'lost', filter: 'All', offset: 40, pageSize: 10 });
        assert.deepEqual(fake.args('range'), [40, 50]);
      });

      test('pageSize + 1 rows means more exist, and only pageSize are returned', async () => {
        fake.queue({ data: rows(4) });
        const page = await items.listItems({ kind: 'lost', filter: 'All', pageSize: 3 });
        assert.equal(page.items.length, 3);
        assert.equal(page.hasMore, true);
        assert.deepEqual(page.items.map((i) => i.id), ['LOST-0', 'LOST-1', 'LOST-2']);
      });

      test('exactly pageSize rows (or fewer) means this is the last page', async () => {
        fake.queue({ data: rows(3) });
        assert.equal((await items.listItems({ kind: 'lost', filter: 'All', pageSize: 3 })).hasMore, false);
        fake.queue({ data: rows(1) });
        assert.equal((await items.listItems({ kind: 'lost', filter: 'All', pageSize: 3 })).hasMore, false);
      });

      test('filters and search still apply to every page', async () => {
        fake.queue({ data: [] });
        await items.listItems({ kind: 'found', filter: 'Active', query: 'keys', offset: 20 });
        assert.ok(fake.has('eq', 'status', 'active'));
        assert.ok(fake.methods(0).includes('or'));
        assert.deepEqual(fake.args('range'), [20, 40]);
      });
    });
  });

  describe('listItems near', () => {
    const near = { center: { lat: 40.7, lng: -73.9 }, radiusM: 2000 };

    test('asks items_near for a page, then loads those rows in distance order', async () => {
      fake.queue({ data: [{ id: 'uuid-2', distance_m: 120 }, { id: 'uuid-1', distance_m: 900 }] });
      fake.queue({ data: [row({ id: 'uuid-1', display_id: 'LOST-1' }), row({ id: 'uuid-2', display_id: 'LOST-2' })] });
      const page = await items.listItems({ kind: 'lost', filter: 'Active', query: ' bag ', near });
      assert.equal(fake.calls[0].name, 'items_near');
      assert.deepEqual((fake.args('args', 0) as any[])[0], {
        p_lat: 40.7, p_lng: -73.9, p_radius_m: 2000, p_kind: 'lost', p_status: 'active', p_query: 'bag', p_limit: 21, p_offset: 0,
      });
      assert.deepEqual(page.items.map((i) => [i.id, i.distanceM]), [['LOST-2', 120], ['LOST-1', 900]]);
      assert.equal(page.hasMore, false);
    });

    test('an empty result skips the second query', async () => {
      fake.queue({ data: [] });
      const page = await items.listItems({ kind: 'found', filter: 'All', near });
      assert.deepEqual(page, { items: [], hasMore: false });
      assert.equal(fake.calls.length, 1);
    });

    test('My posts ignores the location filter', async () => {
      fake.queue({ data: [] });
      await items.listItems({ kind: 'lost', filter: 'My posts', userId: 'u1', near });
      assert.equal(fake.calls[0].name, 'items');
    });

    test('surfaces an rpc error', async () => {
      fake.queue({ error: { message: 'boom' } });
      await assert.rejects(items.listItems({ kind: 'lost', filter: 'All', near }), /boom/);
    });
  });

  describe('listItemsInBounds', () => {
    const bounds = { south: 40, west: -74, north: 41, east: -73 };

    test('filters by the visible box, kind and status, and maps the rows', async () => {
      fake.queue({ data: [row({ location_lat: 40.5, location_lng: -73.5 })] });
      const found = await items.listItemsInBounds({ kind: 'lost', filter: 'Active', bounds });
      assert.equal(fake.has('eq', 'kind', 'lost'), true);
      assert.equal(fake.has('eq', 'status', 'active'), true);
      assert.equal(fake.has('gte', 'location_lat', 40), true);
      assert.equal(fake.has('lte', 'location_lng', -73), true);
      assert.equal(found[0].coords, '40.5, -73.5');
    });

    test('a view across the antimeridian drops the longitude bound instead of matching nothing', async () => {
      await items.listItemsInBounds({ kind: 'found', filter: 'All', bounds: { ...bounds, west: 170, east: -170 } });
      assert.equal(fake.calls[0].ops.some(([m, a]) => m === 'gte' && a[0] === 'location_lng'), false);
    });

    test('My posts without a user returns nothing and never queries rows', async () => {
      assert.deepEqual(await items.listItemsInBounds({ kind: 'lost', filter: 'My posts', bounds }), []);
    });
  });

  describe('createItem', () => {
    const input = {
      kind: 'lost' as const, category: 'Bags', title: 'Backpack', locationText: 'Station',
      lat: 40.7, lng: -73.9, occurredOn: '2026-09-20', description: null, reporterId: 'u1',
    };

    test('sends display_id null so the trigger assigns it, and returns the mapped item', async () => {
      fake.queue({ data: row() });
      const it = await items.createItem(input);
      const [inserted] = fake.args('insert') as [Record<string, unknown>];
      assert.equal(inserted.display_id, null);
      assert.equal(inserted.reporter_id, 'u1');
      assert.equal(inserted.occurred_on, '2026-09-20');
      assert.equal(it.id, 'LOST-1031');
    });

    test('an unparseable date becomes null instead of an Invalid Date crash', async () => {
      fake.queue({ data: row() });
      await items.createItem({ ...input, occurredOn: 'last tuesday-ish' });
      assert.equal((fake.args('insert') as [Record<string, unknown>])[0].occurred_on, null);
    });

    test('throws the database message on failure', async () => {
      fake.queue({ error: { message: 'new row violates row-level security policy' } });
      await assert.rejects(items.createItem(input), /row-level security/);
    });
  });

  test('updateItemStatus writes the lowercase db status for the item', async () => {
    await items.updateItemStatus('uuid-1', 'Reunited');
    assert.deepEqual(fake.args('update'), [{ status: 'reunited' }]);
    assert.ok(fake.has('eq', 'id', 'uuid-1'));
  });

  test('updateItemStatus / deleteItem throw on error', async () => {
    fake.queue({ error: { message: 'denied' } });
    await assert.rejects(items.updateItemStatus('x', 'Active'), /denied/);
    fake.queue({ error: { message: 'denied' } });
    await assert.rejects(items.deleteItem('x'), /denied/);
  });

  test('claimItem upserts on (item_id, claimant_id) ignoring duplicates', async () => {
    await items.claimItem('item1', 'reporter1', 'claimant1');
    assert.equal(fake.calls[0].name, 'conversations');
    assert.deepEqual(fake.args('upsert'), [
      { item_id: 'item1', reporter_id: 'reporter1', claimant_id: 'claimant1' },
      { onConflict: 'item_id,claimant_id', ignoreDuplicates: true },
    ]);
  });

  describe('flagItem', () => {
    test('records the flag, then marks the item flagged', async () => {
      assert.equal(await items.flagItem('item1', 'spam', 'admin1'), 'queued');
      assert.equal(fake.calls[0].name, 'moderation_flags');
      assert.deepEqual(fake.args('insert', 0), [{ target_type: 'item', target_id: 'item1', reason: 'spam', flagged_by: 'admin1' }]);
      assert.equal(fake.calls[1].name, 'items');
      assert.deepEqual(fake.args('update', 1), [{ status: 'flagged' }]);
    });

    test('sending an already-flagged item again is not an error (one pending flag per target)', async () => {
      fake.queue({ error: { message: 'duplicate key value', code: '23505' } as any });
      assert.equal(await items.flagItem('item1', 'spam', 'admin1'), 'already_queued');
      assert.equal(fake.calls.length, 1, 'nothing else is changed');
    });

    test('does not touch the item if recording the flag failed', async () => {
      fake.queue({ error: { message: 'denied' } });
      await assert.rejects(items.flagItem('item1', 'spam', 'admin1'), /denied/);
      assert.equal(fake.calls.length, 1);
    });
  });

  describe('uploadItemPhoto', () => {
    const blob = new Blob(['x'], { type: 'image/png' });

    test('uploads under <uploader>/<item>/ (the storage RLS folder rule), then records the row', async () => {
      await items.uploadItemPhoto('item1', 'u1', blob, 'Pic.PNG');
      assert.equal(fake.calls[0].kind, 'storage');
      assert.equal(fake.calls[0].name, 'item-photos');
      const [path, , opts] = fake.args('upload') as [string, Blob, { contentType: string }];
      assert.match(path, /^u1\/item1\/\d+\.png$/);
      assert.equal(opts.contentType, 'image/png');
      assert.equal(fake.calls[1].name, 'item_photos');
      assert.deepEqual(fake.args('insert', 1), [{ item_id: 'item1', storage_path: path }]);
    });

    test('a failed upload does not insert the item_photos row', async () => {
      fake.queue({ error: { message: 'bucket full' } });
      await assert.rejects(items.uploadItemPhoto('item1', 'u1', blob, 'a.jpg'), /bucket full/);
      assert.equal(fake.calls.length, 1);
    });
  });
});
