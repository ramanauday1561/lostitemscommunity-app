import { expect, Page, test } from '@playwright/test';

/**
 * Opening the app from the signup confirmation email.
 *
 * Supabase itself is faked at the network layer (page.route), so no account is created and no email is
 * sent: a real signup would spend the project's hourly email quota. The URLs are exactly what Supabase's
 * /auth/v1/verify redirects to (captured from the live project): tokens in the fragment on success, an
 * otp_expired error on an expired or reused link, both after the app's `?auth=signup` marker.
 */

const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
/** A JWT-shaped access token. supabase-js only decodes it to read `exp`; the signature is never checked client-side. */
const ACCESS_TOKEN = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: 'u-confirm', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;

const USER = { id: 'u-confirm', aud: 'authenticated', role: 'authenticated', email: 'ann@example.com', email_confirmed_at: new Date().toISOString(), app_metadata: {}, user_metadata: {} };
const PROFILE = {
  id: 'u-confirm', role: 'user', username: 'ann', handle: 'ann', display_name: 'Ann', avatar_url: null, is_suspended: false,
  suspended_at: null, suspended_by: null, guidelines_accepted_at: null, post_count: 0, created_at: USER.email_confirmed_at, updated_at: USER.email_confirmed_at,
};

async function fakeSupabase(page: Page) {
  await page.route(/\/auth\/v1\/user/, (r) => r.fulfill({ json: USER }));
  await page.route(/\/rest\/v1\//, (r) => {
    const url = r.request().url();
    const single = (r.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
    if (url.includes('/rest/v1/profiles') && single) return r.fulfill({ json: PROFILE });
    if (url.includes('/rest/v1/rpc/')) return r.fulfill({ json: null });
    return r.fulfill({ json: single ? null : [], headers: { 'content-range': '0-0/0' } });
  });
  await page.route(/\/functions\/v1\//, (r) => r.fulfill({ json: {} }));
}

test.describe('signup confirmation link', () => {
  // The CI workflow runs every spec against the deployed app. On a pull request that is the code from
  // BEFORE the change, so this spec can only pass locally (npm run dev) and on main once it is deployed.
  test.skip(({ baseURL }) => !!process.env.GITHUB_BASE_REF && !!baseURL?.includes('app.lostitemscommunity.com'),
    'Pull-request runs test the live app, which does not have this change until it is merged and deployed');

  test('a valid link signs the member in and shows "email confirmed", then the dashboard', async ({ page }) => {
    await fakeSupabase(page);
    await page.goto(`/?auth=signup#access_token=${ACCESS_TOKEN}&expires_at=9999999999&expires_in=3600&refresh_token=rt-1&token_type=bearer&type=signup`);

    await expect(page.getByText('Email confirmed')).toBeVisible();
    await expect(page.getByText("You're in, Ann.")).toBeVisible();
    await expect(page.getByText('Post something')).toBeVisible();
    // The one-time tokens (and the marker) are gone from the address bar.
    await expect.poll(() => page.url()).not.toContain('access_token');
    expect(page.url()).not.toContain('auth=signup');

    await page.getByText('Go to my dashboard').click();
    await expect(page.getByText('Welcome to Lost Items Community, Ann.')).toBeVisible();
  });

  test('an expired or already-used link explains what to do, with a way to sign in', async ({ page }) => {
    await page.goto('/?auth=signup#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired&sb=');

    await expect(page.getByText("We couldn't confirm that link")).toBeVisible();
    await expect(page.getByText(/If you already confirmed your email, just sign in/)).toBeVisible();
    await expect.poll(() => page.url()).not.toContain('error=');

    await page.getByText('Sign in', { exact: true }).click();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });
});
