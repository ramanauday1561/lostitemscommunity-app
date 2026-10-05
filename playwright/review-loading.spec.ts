import { test, expect, type Page } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers';

/**
 * Re-opening a screen that already has rows must refresh quietly: no "Loading …" spinner on top of the list. The
 * spinner is only for the first load, when there is nothing else to look at. Each case opens a screen, leaves it,
 * makes the next fetch slow (so there is a window where old rows and a spinner could both show) and re-opens it.
 * (The Lost/Found registry is different on purpose: its old rows belong to another filter, so it shows the spinner alone.)
 */
test.use({ viewport: { width: 390, height: 844 } });

const LOADING = /^Loading .*…$/;

async function tab(page: Page, name: string) {
  await page.getByText(name, { exact: true }).last().click();
}

async function expectQuietRefresh(page: Page, opts: { open: () => Promise<void>; rows: string | RegExp; slowUrl: RegExp }) {
  await opts.open();
  const row = page.getByText(opts.rows, typeof opts.rows === 'string' ? { exact: true } : undefined).first();
  const hasRows = await row.waitFor({ timeout: 15000 }).then(() => true, () => false);
  test.skip(!hasRows, 'No rows to keep on screen (the list is empty)');

  await tab(page, 'Home');
  await page.route(opts.slowUrl, async (route) => { await new Promise((r) => setTimeout(r, 2500)); await route.continue(); });
  await opts.open();

  await expect(row).toBeVisible();
  for (let i = 0; i < 6; i++) { // ~1.8 s, inside the slow window
    await expect(page.getByText(LOADING)).toHaveCount(0);
    await page.waitForTimeout(300);
  }
}

test.describe('superadmin lists', () => {
  test('Review', async ({ page }) => {
    await loginAs(page, TEST_USERS.superadmin);
    await expectQuietRefresh(page, { open: () => tab(page, 'Review'), rows: 'Approve', slowUrl: /moderation/ });
  });

  test('Support inbox', async ({ page }) => {
    await loginAs(page, TEST_USERS.superadmin);
    await expectQuietRefresh(page, { open: () => page.getByText('Support inbox', { exact: true }).first().click(), rows: 'Open & reply', slowUrl: /support/ });
  });

  test('Members', async ({ page }) => {
    await loginAs(page, TEST_USERS.superadmin);
    await expectQuietRefresh(page, { open: () => tab(page, 'Members'), rows: /@e2e_member/, slowUrl: /profiles/ });
  });

  test('Forum', async ({ page }) => {
    await loginAs(page, TEST_USERS.superadmin);
    await expectQuietRefresh(page, { open: () => tab(page, 'Forum'), rows: /repl(y|ies)/, slowUrl: /forum/ });
  });
});

test.describe('member lists', () => {
  test('Messages', async ({ page }) => {
    await loginAs(page, TEST_USERS.regularUser);
    await expectQuietRefresh(page, {
      open: () => page.getByText('chat', { exact: true }).first().click(),
      rows: /e2e_member2|testuser[12]|e2e_admin/, slowUrl: /conversations/,
    });
  });
});

test('first load of the Review page still shows the spinner while there is nothing else to show', async ({ page }) => {
  await page.route(/moderation/, async (route) => { await new Promise((r) => setTimeout(r, 2500)); await route.continue(); });
  await loginAs(page, TEST_USERS.superadmin);
  await tab(page, 'Review');
  await expect(page.getByText('Loading the review queue…')).toBeVisible({ timeout: 5000 });
});
