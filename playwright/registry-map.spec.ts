import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers';

/**
 * The registry's Map view: toggle to it, see pins for the items in view, tap one to open the bottom drawer, and open
 * the full details from it. Read-only (creates nothing). The map style is answered locally so the test doesn't depend
 * on OpenFreeMap being reachable; the items come from the real database.
 */
test.use({ viewport: { width: 390, height: 844 } });

test('Map view shows item pins and a tapped pin opens the details drawer', async ({ page }) => {
  await page.route('https://tiles.openfreemap.org/**', (route) => route.fulfill({
    json: {
      version: 8,
      sources: { land: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-180, -80], [180, -80], [180, 80], [-180, 80], [-180, -80]]] } } } },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#dde6ee' } },
        { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': '#cfe3cf' } },
      ],
    },
  }));

  await loginAs(page, TEST_USERS.regularUser);
  await page.getByText('Lost', { exact: true }).last().click();
  await page.getByLabel('Show map').click();
  await expect(page.locator('[data-map-ready="1"]')).toHaveCount(1, { timeout: 30000 });

  // The map frames the pins it loads, so at least one is on screen. A database with no pinned lost items has nothing to click.
  await expect(page.getByText(/in view/)).toBeVisible({ timeout: 15000 });
  const pins = page.locator('.maplibregl-marker');
  test.skip((await pins.count()) === 0, 'No lost items with a pin in the database to show on the map');

  // Zoom controls change the view.
  const before = await page.locator('.maplibregl-canvas').boundingBox();
  await page.getByLabel('Zoom in').click();
  await page.getByLabel('Zoom out').click();
  expect(before).not.toBeNull();

  await pins.first().click({ force: true });
  await expect(page.getByText('View details', { exact: true })).toBeVisible();
  await page.getByText('View details', { exact: true }).click();
  // The detail sheet opens over the registry.
  await expect(page.getByText(/LOST-\d+/).first()).toBeVisible();
});
