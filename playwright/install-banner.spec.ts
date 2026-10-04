import { test, expect, devices } from '@playwright/test';

/** The "add to Home Screen" banner. No sign-in needed: it shows on the first screen. */
test.use({ viewport: { width: 390, height: 844 } });

test.describe('install banner', () => {
  test('Android / Chrome: shows an Install button that triggers the browser prompt', async ({ page }) => {
    await page.addInitScript(() => {
      // Fire the event Chrome fires when the site is installable, with a prompt() we can observe.
      (window as any).__installed = 0;
      window.addEventListener('DOMContentLoaded', () => setTimeout(() => {
        const e: any = new Event('beforeinstallprompt', { cancelable: true });
        e.prompt = async () => { (window as any).__installed += 1; };
        e.userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(e);
      }, 300));
    });
    await page.goto('/');
    await expect(page.getByText('Add Lost Items to your Home Screen')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Install the app' }).or(page.getByLabel('Install the app')).first().click();
    await expect.poll(() => page.evaluate(() => (window as any).__installed)).toBe(1);
    await expect(page.getByText('Add Lost Items to your Home Screen')).toBeHidden();
  });

  test('dismissing hides it and it stays away on the next visit', async ({ page }) => {
    await page.addInitScript(() => {
      window.addEventListener('DOMContentLoaded', () => setTimeout(() => {
        const e: any = new Event('beforeinstallprompt', { cancelable: true });
        e.prompt = async () => {}; e.userChoice = Promise.resolve({ outcome: 'dismissed' });
        window.dispatchEvent(e);
      }, 300));
    });
    await page.goto('/');
    await expect(page.getByText('Add Lost Items to your Home Screen')).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Not now').first().click();
    await expect(page.getByText('Add Lost Items to your Home Screen')).toBeHidden();
    await page.reload();
    await page.waitForTimeout(3500);
    await expect(page.getByText('Add Lost Items to your Home Screen')).toHaveCount(0);
  });

  test('iPhone: shows the Share -> Add to Home Screen steps', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone 14'] });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByText('Add Lost Items to your Home Screen')).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Show how to add to Home Screen').first().click();
    await expect(page.getByText('Add to Home Screen”')).toBeVisible();
    await context.close();
  });

  test('the banner never covers the welcome screen\'s Skip button, and ?install=1 brings it back after a dismissal', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone 14'] });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByText('Add Lost Items to your Home Screen')).toBeVisible({ timeout: 10000 });
    await page.getByText('Skip', { exact: true }).click({ timeout: 5000 }); // would time out if the banner sat on top of it
    await page.getByLabel('Not now').first().click();
    await page.goto('/?install=1');
    await expect(page.getByText('Add Lost Items to your Home Screen')).toBeVisible({ timeout: 10000 });
    await context.close();
  });

  test('the manifest and service worker are served', async ({ request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.ok()).toBe(true);
    const m = await manifest.json();
    expect(m.display).toBe('standalone');
    expect(m.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
    const sw = await request.get('/sw.js');
    expect(sw.ok()).toBe(true);
    expect(await sw.text()).toContain("addEventListener('fetch'");
  });

  test('a browser that cannot install shows nothing', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3500);
    await expect(page.getByText('Add Lost Items to your Home Screen')).toHaveCount(0);
  });
});
