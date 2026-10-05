import { test, expect } from '@playwright/test';
import { loginAs, TEST_USERS } from './helpers';

/** Re-opening a screen that already has rows must refresh quietly: no spinner on top of the list. */
test.use({ viewport: { width: 390, height: 844 } });

test('Review page: a refresh does not show the loading spinner above rows that are already there', async ({ page }) => {
  await loginAs(page, TEST_USERS.superadmin);
  await page.getByText('Review', { exact: true }).last().click();
  const approve = page.getByText('Approve', { exact: true }).first();
  const hasRows = await approve.waitFor({ timeout: 15000 }).then(() => true, () => false);
  test.skip(!hasRows, 'The review queue is empty, so there is no list to keep on screen');

  await page.getByText('Home', { exact: true }).last().click();
  // Make the next fetch slow, so there is a window in which the old rows and a spinner could both be visible.
  await page.route(/moderation/, async (route) => { await new Promise((r) => setTimeout(r, 2500)); await route.continue(); });
  await page.getByText('Review', { exact: true }).last().click();

  await expect(approve).toBeVisible();
  for (let i = 0; i < 6; i++) { // ~1.8 s, inside the slow window
    await expect(page.getByText('Loading the review queue…')).toHaveCount(0);
    await page.waitForTimeout(300);
  }
});

test('first load of the Review page still shows the spinner while there is nothing else to show', async ({ page }) => {
  await page.route(/moderation/, async (route) => { await new Promise((r) => setTimeout(r, 2500)); await route.continue(); });
  await loginAs(page, TEST_USERS.superadmin);
  await page.getByText('Review', { exact: true }).last().click();
  await expect(page.getByText('Loading the review queue…')).toBeVisible({ timeout: 5000 });
});
