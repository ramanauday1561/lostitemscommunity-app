import { test, expect } from '@playwright/test';
import { loginAs, pickDate, TEST_USERS } from './helpers';
import { attachPhoto } from './photo';

/**
 * The Report sheet's map: search a place, tap the map, submit, and see the pin on the post. The map style and the
 * place search are answered locally, so the test doesn't depend on OpenFreeMap or Nominatim being reachable.
 * Creates (and withdraws) one real post, so it needs E2E_ALLOW_DESTRUCTIVE=1.
 */
test.skip(!process.env.E2E_ALLOW_DESTRUCTIVE, 'Creates and removes a real post; set E2E_ALLOW_DESTRUCTIVE=1 to run');
test.use({ viewport: { width: 390, height: 844 } });

const TITLE = `PWMAP${Date.now().toString().slice(-6)} red scooter`;

test('pin a place on the map, submit, and see the pin on the post', async ({ page }) => {
  await page.route('https://tiles.openfreemap.org/**', (route) => route.fulfill({
    // A GeoJSON source is decoded in MapLibre's web worker, like real vector tiles: the map only reaches "ready" when the
    // worker file is actually served (it once was not, and the map stayed empty with no error on screen).
    json: {
      version: 8,
      sources: { land: { type: 'geojson', attribution: 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-180, -80], [180, -80], [180, 80], [-180, 80], [-180, -80]]] } } } },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#dde6ee' } },
        { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': '#cfe3cf' } },
      ],
    },
  }));
  await page.route('https://nominatim.openstreetmap.org/search**', (route) => route.fulfill({
    json: [{ display_name: 'Central Station, Railway Square, Sydney, Australia', lat: '-33.8830', lon: '151.2060' }],
  }));
  await page.route('https://nominatim.openstreetmap.org/reverse**', (route) => route.fulfill({ json: { display_name: 'Somewhere, Sydney' } }));

  const workerLoaded = page.waitForResponse((r) => r.url().includes('/maplibre/maplibre-gl-worker.js') && r.status() === 200);
  await loginAs(page, TEST_USERS.regularUser);
  await page.getByText('add', { exact: true }).last().click();
  await page.getByText('I lost this', { exact: true }).click();
  await page.getByPlaceholder('What is it? e.g. Blue backpack').fill(TITLE);
  await page.getByText('Other', { exact: true }).first().click();
  await page.getByText('Continue', { exact: true }).click();

  // Search -> pick a result: the pin and the place box are filled in.
  await page.getByPlaceholder('Search a street or landmark').fill('central station');
  await page.keyboard.press('Enter');
  await page.getByText('Central Station, Railway Square, Sydney').click();
  await expect(page.getByPlaceholder('Where? e.g. Central Station platform 3')).toHaveValue('Central Station, Railway Square, Sydney');
  await expect(page.getByText(/pin set · -33\.88300, 151\.20600/)).toBeVisible();
  await expect(page.locator('.maplibregl-marker')).toHaveCount(1);
  await workerLoaded;
  await expect(page.locator('[data-map-ready="1"]')).toHaveCount(1, { timeout: 15000 });
  // The data credits stay (their licences require them) but are folded behind the (i) button, not open over the map.
  await expect(page.locator('.maplibregl-ctrl-attrib-button')).toBeVisible();
  await expect(page.locator('.maplibregl-ctrl-attrib.maplibregl-compact-show')).toHaveCount(0);

  // Tapping elsewhere on the map moves the pin.
  const canvas = page.locator('.maplibregl-canvas');
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.8);
  await expect(page.getByText(/pin set · /)).not.toContainText('-33.88300, 151.20600');

  await pickDate(page, '2026-10-01');
  await attachPhoto(page, TITLE);
  await page.getByText('Submit to registry', { exact: true }).click();
  await expect(page.getByText('Report submitted')).toBeVisible({ timeout: 20000 });
  await page.getByText('View it in the registry', { exact: true }).click();

  // The post's own sheet shows a read-only map with the pin.
  await page.getByPlaceholder('Search title, place or reference').fill(TITLE);
  await page.getByText(TITLE).first().click();
  await expect(page.locator('.maplibregl-marker')).toHaveCount(1, { timeout: 15000 });
  await expect(page.locator('[data-map-ready="1"]')).toHaveCount(1, { timeout: 15000 });
  await expect(page.getByText('Map pin')).toBeVisible();
  await expect(page.getByText('Open in OpenStreetMap')).toBeVisible();
  await expect(page.getByText('01 Oct 2026').first()).toBeVisible(); // the picked date

  await page.getByText('Withdraw this post', { exact: true }).click();
});
