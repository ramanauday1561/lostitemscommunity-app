import { test, expect } from '@playwright/test';

/**
 * A page that is running an old build reloads itself into the new one. Needs a build made with
 * EXPO_PUBLIC_BUILD_ID set (the deploy does this); a plain local build has the id "dev" and skips the check.
 */
test.use({ viewport: { width: 390, height: 844 } });

async function buildId(page: import('@playwright/test').Page) {
  const html = await page.content();
  return /var BUILD = "([^"]*)"/.exec(html)?.[1] ?? 'dev';
}

test('a newer build on the server makes the page fetch it, once', async ({ page }) => {
  const visits: string[] = [];
  page.on('request', (r) => { if (r.resourceType() === 'document') visits.push(r.url()); });
  await page.route('**/version.json', (route) => route.fulfill({ json: { id: 'build-newer-than-this-one' } }));
  await page.goto('/');
  test.skip((await buildId(page)) === 'dev', 'This build has no id (local build): the update check is off');
  await expect.poll(() => visits.filter((u) => u.includes('v=build-newer')).length, { timeout: 10000 }).toBe(1);
  await page.waitForTimeout(2500); // the guard stops a second reload even though the (mocked) server still says "newer"
  expect(visits.filter((u) => u.includes('v=build-newer')).length).toBe(1);
  await expect(page.getByText('Lost Items Community').first()).toBeVisible();
});

test('the same build on the server changes nothing', async ({ page }) => {
  const visits: string[] = [];
  page.on('request', (r) => { if (r.resourceType() === 'document') visits.push(r.url()); });
  await page.goto('/');
  const id = await buildId(page);
  test.skip(id === 'dev', 'This build has no id (local build): the update check is off');
  await page.route('**/version.json', (route) => route.fulfill({ json: { id } }));
  await page.reload();
  await page.waitForTimeout(2500);
  expect(visits.filter((u) => u.includes('v=')).length).toBe(0);
});
