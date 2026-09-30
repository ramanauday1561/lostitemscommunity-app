import { test, expect } from '@playwright/test';

test('Diagnostic: Check app is accessible', async ({ page }) => {
  console.log('🔍 Navigating to app...');
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  console.log('📄 Page title:', page.title());
  console.log('🔗 Current URL:', page.url());

  const content = await page.content();
  console.log('📊 Page content length:', content.length);
  console.log('✅ App is accessible');
});

test('Diagnostic: Check login form exists', async ({ page }) => {
  console.log('🔍 Navigating to home...');
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const emailInputs = await page.locator(
    'input[type="text"], input[type="email"], input[placeholder*="username" i]'
  ).count();

  const passwordInputs = await page.locator('input[type="password"]').count();
  const loginButtons = await page.locator('button').filter({ hasText: /Sign In|Log In|Login/ }).count();

  console.log(`📝 Email inputs found: ${emailInputs}`);
  console.log(`🔐 Password inputs found: ${passwordInputs}`);
  console.log(`🔘 Login buttons found: ${loginButtons}`);

  expect(emailInputs).toBeGreaterThan(0);
  expect(passwordInputs).toBeGreaterThan(0);
});

test('Diagnostic: Attempt login', async ({ page }) => {
  console.log('🔍 Starting login...');
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const emailInputs = await page.locator(
    'input[type="text"], input[type="email"], input[placeholder*="username" i]'
  ).all();

  if (emailInputs.length > 0) {
    console.log('✍️ Filling username...');
    await emailInputs[0].fill('superadmin');

    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length > 0) {
      console.log('🔐 Filling password...');
      await passwordInputs[0].fill('Admin@12345');

      console.log('🔘 Clicking login button...');
      await page.click('button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login")');

      console.log('⏳ Waiting for navigation...');
      await page.waitForTimeout(5000);

      console.log('🔗 Current URL after login:', page.url());
      console.log('📄 Page title after login:', page.title());
    }
  } else {
    console.log('❌ Could not find login form');
  }
});
