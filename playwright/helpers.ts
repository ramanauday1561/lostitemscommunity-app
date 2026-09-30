import { Page, test } from '@playwright/test';

export interface TestUser {
  username: string;
  password: string;
  role: 'user' | 'superadmin';
}

/**
 * Credentials come from the environment so no password lives in the repo.
 * Tests that need a login are skipped when the matching password is unset.
 *   E2E_SUPERADMIN_USERNAME (default: superadmin)   E2E_SUPERADMIN_PASSWORD
 *   E2E_USER_USERNAME       (default: testuser2)    E2E_USER_PASSWORD
 */
export const TEST_USERS = {
  superadmin: {
    username: process.env.E2E_SUPERADMIN_USERNAME || 'superadmin',
    password: process.env.E2E_SUPERADMIN_PASSWORD || '',
    role: 'superadmin',
  } as TestUser,
  regularUser: {
    username: process.env.E2E_USER_USERNAME || 'testuser2',
    password: process.env.E2E_USER_PASSWORD || '',
    role: 'user',
  } as TestUser,
};

/** Login form is visible (Password field present). */
async function onLoginForm(page: Page) {
  return (await page.getByPlaceholder('Password').count()) > 0;
}

/**
 * Login through the real Supabase path: Welcome -> Sign in -> "Supabase account"
 * segment -> username/email + password -> submit. Throws if the app shows an error.
 */
export async function loginAs(page: Page, user: TestUser) {
  test.skip(!user.password, `Set E2E_${user.role === 'superadmin' ? 'SUPERADMIN' : 'USER'}_PASSWORD to run authenticated tests`);

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  if (!(await onLoginForm(page))) {
    await page.getByText('Sign in', { exact: true }).first().click();
  }
  await page.getByText('Supabase account', { exact: true }).click();
  await page.getByPlaceholder('Username or email').fill(user.username);
  await page.getByPlaceholder('Password').fill(user.password);
  await page.keyboard.press('Enter');

  // Success = the login form goes away; failure = the app renders an error banner.
  const failed = page.getByText(/invalid|incorrect|failed|suspended/i).first();
  await Promise.race([
    page.getByPlaceholder('Password').waitFor({ state: 'detached', timeout: 20000 }),
    failed.waitFor({ state: 'visible', timeout: 20000 }).then(async () => {
      throw new Error(`Login failed for ${user.username}: ${await failed.innerText()}`);
    }),
  ]);
  await page.waitForLoadState('networkidle').catch(() => {});
}

/**
 * Logout from the app (profile avatar -> Sign out)
 */
export async function logout(page: Page) {
  const out = page.getByText(/sign out|log out|logout/i).first();
  if (!(await out.isVisible().catch(() => false))) {
    // Header avatar shows the user's initials; it is the last header button.
    await page.locator('[role="button"], [tabindex="0"]').filter({ hasText: /^[A-Z]{1,2}$/ }).last().click().catch(() => {});
  }
  await out.click({ timeout: 5000 }).catch(() => {});
}

/**
 * Check if user is logged in (past the auth screens)
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  await page.waitForLoadState('networkidle').catch(() => {});
  if (await onLoginForm(page)) return false;
  return page.getByText(/^(Home|Registry|Lost|Found|Forum)$/).first().isVisible().catch(() => false);
}

/**
 * Navigate to a screen by name. Each screen lists every label that can reach it
 * (bottom tabs, dashboard cards, header icons), tried in order. Exact matches.
 */
const NAV: Record<string, string[]> = {
  dashboard: ['Home'],
  registry: ['Registry', 'Lost', 'Found'],
  forum: ['Forum'],
  report: ['Report', 'Report an item'],
  chat: ['chat'],
  messages: ['chat'],
  profile: [],
  admin: ['Home'],
  moderation: ['Review'],
  members: ['Members'],
  analysis: ['Analysis hub', 'Open hub'],
  ads: ['Ad placements & revenue'],
  support: ['Help and support'],
};

export async function navigateTo(page: Page, screenName: string) {
  const key = screenName.toLowerCase();
  const labels = NAV[key] || [screenName];

  // Support lives inside the profile sheet: open it via the avatar first.
  if (key === 'support') {
    await page.locator('[role="button"], [tabindex="0"]').filter({ hasText: /^[A-Z]{1,2}$/ }).last().click().catch(() => {});
  }

  for (const label of labels) {
    const btn = page.getByText(label, { exact: true }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(500);
      return true;
    }
  }
  return false;
}

/**
 * Wait for text to appear on page
 */
export async function waitForText(page: Page, text: string, timeout = 5000) {
  await page.getByText(text).first().waitFor({ timeout });
}

/**
 * Check if element is visible
 */
export async function isVisible(page: Page, text: string): Promise<boolean> {
  return await page.getByText(text, { exact: true }).first().isVisible().catch(() => false);
}

/**
 * Take a screenshot with a label
 */
export async function takeScreenshot(page: Page, label: string) {
  const filename = `${label.replace(/\s+/g, '-').toLowerCase()}.png`;
  await page.screenshot({ path: `test-results/screenshots/${filename}`, fullPage: true });
  return filename;
}
