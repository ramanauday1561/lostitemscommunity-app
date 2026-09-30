import { test, expect } from '@playwright/test';

test('Diagnostic: app is accessible', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect((await page.content()).length).toBeGreaterThan(0);
  await expect(page.getByText('Lost Items Community').first()).toBeVisible();
});

test('Diagnostic: login form exists', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByText('Sign in', { exact: true }).first().click();

  await expect(page.getByPlaceholder('Username or email')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();
  await expect(page.getByText('Sign in & continue')).toBeVisible();
});
