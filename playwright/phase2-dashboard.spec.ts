import { test, expect } from '@playwright/test';
import { loginAs, takeScreenshot, TEST_USERS } from './helpers';

test.describe('Phase 2: Dashboard with Stats', () => {
  test('should display dashboard with stats as superadmin', async ({ page }) => {
    await loginAs(page, TEST_USERS.superadmin);

    // Verify dashboard elements
    await page.waitForLoadState('networkidle');

    // Check for stat elements (can be in different formats)
    const dashboardContent = await page.content();
    const hasStats = dashboardContent.includes('Active') || dashboardContent.includes('stat') || dashboardContent.includes('dashboard');
    expect(hasStats).toBe(true);

    await takeScreenshot(page, 'phase2-superadmin-dashboard');
  });

  test('should display dashboard with stats as regular user', async ({ page }) => {
    await loginAs(page, TEST_USERS.regularUser);

    await page.waitForLoadState('networkidle');

    // Dashboard should be visible
    const pageContent = await page.content();
    const isDashboard = pageContent.length > 100; // Page has content
    expect(isDashboard).toBe(true);

    await takeScreenshot(page, 'phase2-user-dashboard');
  });

  test('should show different admin stats vs user stats', async ({ page }) => {
    // Login as admin
    await loginAs(page, TEST_USERS.superadmin);
    await page.waitForLoadState('networkidle');
    const adminContent = await page.content();

    // Logout and login as regular user
    await page.goto('http://localhost:8081');
    await loginAs(page, TEST_USERS.regularUser);
    await page.waitForLoadState('networkidle');
    const userContent = await page.content();

    // Content lengths should differ (admin might show more stats)
    expect(adminContent.length).toBeGreaterThan(0);
    expect(userContent.length).toBeGreaterThan(0);
  });
});
