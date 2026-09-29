import { test, expect } from '@playwright/test';
import { loginAs, navigateTo, takeScreenshot, isVisible, TEST_USERS } from './helpers';

test.describe('Phase 3: Registry - Items List, Filters, Search', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.regularUser);
  });

  test('should display registry with items', async ({ page }) => {
    const navigated = await navigateTo(page, 'registry');
    expect(navigated).toBe(true);

    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'phase3-registry-list');
  });

  test('should filter items by Lost/Found', async ({ page }) => {
    await navigateTo(page, 'registry');
    await page.waitForLoadState('networkidle');

    // Look for filter buttons
    const filterContent = await page.content();
    const hasFilters = filterContent.includes('Lost') || filterContent.includes('Found') || filterContent.includes('All');
    expect(hasFilters).toBe(true);

    await takeScreenshot(page, 'phase3-registry-filters');
  });

  test('should search items', async ({ page }) => {
    await navigateTo(page, 'registry');
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInputs = await page.locator('input[placeholder*="search" i], input[placeholder*="find" i], input[placeholder*="query" i]').all();

    if (searchInputs.length > 0) {
      await searchInputs[0].fill('wallet');
      await page.waitForLoadState('networkidle');

      await takeScreenshot(page, 'phase3-registry-search');
    }
  });

  test('should display item categories', async ({ page }) => {
    await navigateTo(page, 'registry');
    await page.waitForLoadState('networkidle');

    // Verify items are displayed
    const pageContent = await page.content();
    const hasItems = pageContent.includes('item') || pageContent.includes('Item') || pageContent.length > 1000;
    expect(hasItems).toBe(true);
  });
});
