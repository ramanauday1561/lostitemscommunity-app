/// <reference types="node" />
import { fake } from '../api/setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';
import { SIGNUP_LINK_EXPIRED } from '../../src/lib/authUrl';
import { waitFor } from './waitFor';

const SIGNUP_URL = 'https://app.example.com/?auth=signup#access_token=AT&expires_in=3600&refresh_token=RT&token_type=bearer&type=signup';
const EXPIRED_URL = 'https://app.example.com/?auth=signup#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired&sb=';
const profile = { id: 'u1', role: 'user', display_name: 'Ann', handle: 'ann', username: 'ann', post_count: 0, is_suspended: false, created_at: '2026-01-01T00:00:00Z', guidelines_accepted_at: null };
const tables = () => new Set(fake.calls.filter((c) => c.kind === 'from').map((c) => c.name));
const quiet = async (fn: () => Promise<void>) => { const o = console.error; console.error = () => {}; try { await fn(); } finally { console.error = o; } };

describe('signup confirmation link', () => {
  beforeEach(() => fake.reset());

  test('a valid link adopts the new session and shows "email confirmed" with the member\'s name', async () => {
    const store = new Store();
    // setSession -> ok, getUser -> the user, profiles.single -> the profile
    fake.queue({ data: {} }, { data: { user: { id: 'u1', email: 'ann@example.com' } } }, { data: profile });
    const handled = await store.handleAuthUrl(SIGNUP_URL);
    assert.equal(handled, true);
    assert.deepEqual(fake.args('args', 0), [{ access_token: 'AT', refresh_token: 'RT' }]);
    assert.equal(fake.calls[0].name, 'setSession');
    assert.equal(store.state.screen, 'confirmed');
    assert.equal(store.state.cfStage, 'done');
    const v = buildVals(store);
    assert.equal(v.isConfirmed, true);
    assert.equal(v.cfDone, true);
    assert.equal(v.cfName, 'Ann');
    assert.equal(v.showHeader, false, 'no app header on the confirmation screen');
    assert.equal(v.showNav, false, 'no bottom nav on the confirmation screen');
    assert.equal(store.state.role, 'new', 'a brand-new member gets the new-member dashboard');
  });

  test('"Go to my dashboard" opens the dashboard and loads what a fresh sign-in loads', async () => {
    const store = new Store();
    fake.queue({ data: {} }, { data: { user: { id: 'u1' } } }, { data: profile });
    await store.handleAuthUrl(SIGNUP_URL);
    fake.reset();
    await quiet(async () => {
      buildVals(store).cfContinue();
      await waitFor(() => tables().has('faq_entries'));
    });
    assert.equal(store.state.screen, 'dash');
    assert.equal(buildVals(store).isFreshDash, true);
    for (const t of ['conversations', 'notifications', 'forum_threads', 'faq_entries']) assert.ok(tables().has(t), `${t} should load`);
  });

  test('the confirmed session is not handed to restoreSession (it would skip the confirmation screen)', async () => {
    const store = new Store();
    fake.queue({ data: {} }, { data: { user: { id: 'u1' } } }, { data: profile });
    assert.equal(await store.handleAuthUrl(SIGNUP_URL), true, 'StoreProvider only restores when the URL was NOT handled');
  });

  test('an expired or already-used link shows the confirmation screen\'s error state, not the reset form', async () => {
    const store = new Store();
    const handled = await store.handleAuthUrl(EXPIRED_URL);
    assert.equal(handled, true);
    assert.equal(fake.calls.length, 0, 'nothing is sent to Supabase for a failed link');
    assert.equal(store.state.screen, 'confirmed');
    const v = buildVals(store);
    assert.equal(v.cfFailed, true);
    assert.equal(v.cfError, SIGNUP_LINK_EXPIRED);
    assert.notEqual(store.state.screen, 'forgot');
  });

  test('from the error state: "Sign in" and "Sign up again" go to the right screens', async () => {
    const store = new Store();
    await store.handleAuthUrl(EXPIRED_URL);
    buildVals(store).cfSignIn();
    assert.equal(store.state.screen, 'login');
    await store.handleAuthUrl(EXPIRED_URL);
    buildVals(store).cfSignUpAgain();
    assert.equal(store.state.screen, 'signup');
  });

  test('if Supabase rejects the tokens, the error state explains instead of hanging on "checking"', async () => {
    const store = new Store();
    fake.queue({ error: { message: 'Invalid Refresh Token' } });
    await store.handleAuthUrl(SIGNUP_URL);
    assert.equal(store.state.screen, 'confirmed');
    assert.equal(store.state.cfStage, 'error');
    assert.equal(store.state.cfError, SIGNUP_LINK_EXPIRED);
  });

  test('if the profile is missing, the error state asks the member to sign in', async () => {
    const store = new Store();
    fake.queue({ data: {} }, { data: { user: { id: 'u1' } } }, { data: null, error: { message: 'no rows' } });
    await store.handleAuthUrl(SIGNUP_URL);
    assert.equal(store.state.cfStage, 'error');
    assert.match(store.state.cfError, /Sign in to continue/);
  });

  test('a password-reset link still goes to the reset form (unchanged)', async () => {
    const store = new Store();
    await store.handleAuthUrl('https://app.example.com/#access_token=AT&refresh_token=RT&type=recovery');
    assert.equal(store.state.screen, 'forgot');
    assert.equal(store.state.fpStage, 'reset');
  });
});

describe('signing up sends the confirmation link back to the app with the signup marker', () => {
  beforeEach(() => fake.reset());

  test('emailRedirectTo is the app URL plus ?auth=signup, and the copy says to tap the link', async () => {
    const env = process.env.EXPO_PUBLIC_APP_URL;
    process.env.EXPO_PUBLIC_APP_URL = 'https://app.lostitemscommunity.com';
    try {
      const store = new Store();
      store.setState({ suUser: 'ann', suEmail: 'ann@example.com', suPass: 'longpassword1!', suConfirm: 'longpassword1!', suTerms: true });
      // username_available -> true, signUp -> no session (confirmation required)
      fake.queue({ data: true }, { data: { session: null, user: { id: 'u1' } } });
      await store.signUpSupabase();
      const signUp = fake.calls.find((c) => c.kind === 'auth' && c.name === 'signUp')!;
      const opts = (signUp.ops[0][1][0] as { options: { emailRedirectTo: string } }).options;
      assert.equal(opts.emailRedirectTo, 'https://app.lostitemscommunity.com/?auth=signup');
      assert.match(store.state.suInfo, /ann@example\.com/);
      assert.match(store.state.suInfo, /Tap it to finish setting up your account/);
    } finally {
      if (env === undefined) delete process.env.EXPO_PUBLIC_APP_URL; else process.env.EXPO_PUBLIC_APP_URL = env;
    }
  });
});

describe('expired link while already signed in on this device', () => {
  beforeEach(() => fake.reset());

  test('"Sign in" goes straight to the dashboard instead of asking for the password again', async () => {
    const store = new Store();
    await store.handleAuthUrl(EXPIRED_URL);
    // getSession -> a session, getUser -> the user, profiles.single -> the (now confirmed) profile, then lists.
    fake.queue({ data: { session: { user: { id: 'u1' } } } }, { data: { user: { id: 'u1' } } }, { data: { ...profile, guidelines_accepted_at: '2026-01-02T00:00:00Z' } });
    await quiet(async () => {
      buildVals(store).cfSignIn();
      assert.equal(store.state.screen, 'login', 'shows the sign-in form straight away');
      await waitFor(() => store.state.screen === 'dash');
    });
    assert.equal(store.state.screen, 'dash');
  });
});
