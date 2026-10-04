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
 *   E2E_USER2_USERNAME      (default: e2e_member2)  E2E_USER2_PASSWORD   (second member, for two-person specs)
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
  /** A second member, for specs where two people interact (claims, chat). E2E_USER2_USERNAME / E2E_USER2_PASSWORD. */
  secondUser: {
    username: process.env.E2E_USER2_USERNAME || 'e2e_member2',
    password: process.env.E2E_USER2_PASSWORD || '',
    role: 'user',
  } as TestUser,
};

/** Login form is visible (Password field present). */
async function onLoginForm(page: Page) {
  return (await page.getByPlaceholder('Password').count()) > 0;
}

/**
 * Signed-in browser storage per username, captured the first time that user logs in during a run.
 *
 * Why: the `login` Edge Function throttles sign-ins (8 per username and 30 per IP per 10 minutes) and a CI
 * runner is one IP, so ~120 tests each typing the password would be locked out after the first few. Every
 * later `loginAs` for the same user restores that session instead of signing in again. If a test signs the
 * user out (which revokes the session server-side), the restore fails and we fall back to a real login.
 */
const savedSessions = new Map<string, [string, string][]>();

const SIGNED_IN = /My dashboard|System control|Set up your account|Welcome back/;

async function signedInNow(page: Page, timeout: number) {
  try {
    await page.getByText(SIGNED_IN).first().waitFor({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function loginWithForm(page: Page, user: TestUser) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  if (!(await onLoginForm(page))) {
    await page.getByText('Sign in', { exact: true }).first().click();
  }
  await page.getByPlaceholder('Username or email').fill(user.username);
  await page.getByPlaceholder('Password').fill(user.password);
  await page.keyboard.press('Enter');

  // Success = the login form goes away; failure = the app renders an error banner (including the
  // "too many attempts" message from the sign-in throttle).
  const failed = page.getByText(/invalid|incorrect|failed|suspended|too many/i).first();
  await Promise.race([
    page.getByPlaceholder('Password').waitFor({ state: 'detached', timeout: 20000 }),
    failed.waitFor({ state: 'visible', timeout: 20000 }).then(async () => {
      throw new Error(`Login failed for ${user.username}: ${await failed.innerText()}`);
    }),
  ]);
  await page.waitForLoadState('networkidle').catch(() => {});
}

/**
 * Login through the real Supabase path: Welcome -> Sign in -> username/email + password -> submit. Throws if the app shows an error.
 * The first call per user signs in with the form; later calls reuse the saved session (see above).
 */
export async function loginAs(page: Page, user: TestUser) {
  test.skip(!user.password, `No password set for ${user.username} (see the E2E_* variables in playwright/helpers.ts)`);

  const saved = savedSessions.get(user.username);
  if (saved) {
    // Seed this user's session before the app starts. The marker (per tab, per user) makes the seed run once,
    // so a later switch to another user in the same page is not undone by this script on reload.
    await page.addInitScript(({ entries, marker }) => {
      if (window.sessionStorage.getItem(marker)) return;
      window.sessionStorage.setItem(marker, '1');
      for (const [k, v] of entries) window.localStorage.setItem(k, v);
    }, { entries: saved, marker: `__e2e_seeded_${user.username}` });
    await page.goto('/');
    if (await signedInNow(page, 15000)) return;
    // Revoked (e.g. an earlier test signed out): forget it and sign in properly.
    savedSessions.delete(user.username);
  }

  // Real sign-in. If this page is already signed in as someone else, sign that session out of the browser first.
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear()).catch(() => {});
  await page.reload();
  await loginWithForm(page, user);
  const entries = await page.evaluate(() =>
    Object.entries(window.localStorage).filter(([k]) => k.startsWith('sb-')) as [string, string][]);
  if (entries.length) savedSessions.set(user.username, entries);
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
