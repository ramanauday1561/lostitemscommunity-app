/// <reference types="node" />
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAuthUrl, LINK_EXPIRED, LINK_INVALID, SIGNUP_LINK_EXPIRED, SIGNUP_LINK_INVALID } from '../../src/lib/authUrl';
import { appUrl, signupRedirectUrl, NATIVE_SCHEME_URL } from '../../src/lib/appUrl';

describe('parseAuthUrl', () => {
  test('a recovery link in the fragment (what Supabase sends)', () => {
    const r = parseAuthUrl('https://app.lostitemscommunity.com/#access_token=AT&expires_in=3600&refresh_token=RT&token_type=bearer&type=recovery');
    assert.deepEqual(r, { kind: 'recovery', accessToken: 'AT', refreshToken: 'RT' });
  });

  test('also works from the query string, with a path, and for a native deep link', () => {
    assert.deepEqual(parseAuthUrl('https://x.test/reset?access_token=A&refresh_token=R&type=recovery'),
      { kind: 'recovery', accessToken: 'A', refreshToken: 'R' });
    assert.deepEqual(parseAuthUrl('lostitems://#access_token=A&refresh_token=R&type=recovery'),
      { kind: 'recovery', accessToken: 'A', refreshToken: 'R' });
  });

  test('an expired or already-used link is an error with an actionable message', () => {
    const r = parseAuthUrl('https://x.test/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    assert.deepEqual(r, { kind: 'error', flow: 'recovery', code: 'otp_expired', message: LINK_EXPIRED });
  });

  test('any other error gets the generic "not valid" message, never the raw description', () => {
    const r = parseAuthUrl('https://x.test/#error=server_error&error_description=something+internal');
    assert.equal(r?.kind, 'error');
    assert.equal((r as { message: string }).message, LINK_INVALID);
    assert.ok(!JSON.stringify(r).includes('internal'));
  });

  test('an error wins over tokens in the same URL', () => {
    assert.equal(parseAuthUrl('https://x.test/#error=access_denied&access_token=A&refresh_token=R&type=recovery')?.kind, 'error');
  });

  test('is NOT a recovery unless type=recovery and BOTH tokens are present', () => {
    assert.equal(parseAuthUrl('https://x.test/#access_token=A&refresh_token=R&type=signup')?.kind, 'signup', 'a signup link is not a reset');
    assert.equal(parseAuthUrl('https://x.test/#access_token=A&refresh_token=R&type=magiclink'), null, 'other link types are ignored');
    assert.equal(parseAuthUrl('https://x.test/#access_token=A&type=recovery'), null);
    assert.equal(parseAuthUrl('https://x.test/#refresh_token=R&type=recovery'), null);
  });

  test('ordinary URLs, empty values and garbage are ignored', () => {
    for (const u of [null, undefined, '', 'https://app.lostitemscommunity.com/', 'https://x.test/?utm=1#section', 'not a url', '#', '?']) {
      assert.equal(parseAuthUrl(u as any), null, String(u));
    }
  });

  test('percent-encoded tokens are decoded', () => {
    const r = parseAuthUrl('https://x.test/#access_token=a%2Bb%3D&refresh_token=r%2Fs&type=recovery');
    assert.deepEqual(r, { kind: 'recovery', accessToken: 'a+b=', refreshToken: 'r/s' });
  });
});

describe('parseAuthUrl: signup confirmation links', () => {
  test('a confirmation link (what Supabase sends after /verify) is a signup with both tokens', () => {
    const r = parseAuthUrl('https://app.lostitemscommunity.com/?auth=signup#access_token=AT&expires_in=3600&refresh_token=RT&token_type=bearer&type=signup');
    assert.deepEqual(r, { kind: 'signup', accessToken: 'AT', refreshToken: 'RT' });
  });

  test('works without the marker too (older emails, native deep links)', () => {
    assert.deepEqual(parseAuthUrl('lostitems://#access_token=A&refresh_token=R&type=signup'), { kind: 'signup', accessToken: 'A', refreshToken: 'R' });
  });

  test('needs both tokens', () => {
    assert.equal(parseAuthUrl('https://x.test/?auth=signup#access_token=A&type=signup'), null);
    assert.equal(parseAuthUrl('https://x.test/?auth=signup'), null, 'the marker alone is not a link result');
  });

  test('an expired confirmation link (exactly what Supabase returns) is a signup error with signup wording', () => {
    const r = parseAuthUrl('https://app.lostitemscommunity.com/?auth=signup#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired&sb=');
    assert.deepEqual(r, { kind: 'error', flow: 'signup', code: 'otp_expired', message: SIGNUP_LINK_EXPIRED });
  });

  test('any other signup error gets the generic signup message, never the raw description', () => {
    const r = parseAuthUrl('https://x.test/?auth=signup#error=server_error&error_description=something+internal');
    assert.deepEqual(r, { kind: 'error', flow: 'signup', code: 'server_error', message: SIGNUP_LINK_INVALID });
  });

  test('an error without the marker is still treated as a password-reset error (unchanged behaviour)', () => {
    assert.equal((parseAuthUrl('https://x.test/#error=access_denied&error_code=otp_expired') as { flow: string }).flow, 'recovery');
  });
});

describe('signupRedirectUrl', () => {
  const env = process.env.EXPO_PUBLIC_APP_URL;
  const restore = () => { if (env === undefined) delete process.env.EXPO_PUBLIC_APP_URL; else process.env.EXPO_PUBLIC_APP_URL = env; };

  test('adds the ?auth=signup marker to the web app URL, with or without a trailing slash', () => {
    for (const base of ['https://app.lostitemscommunity.com', 'https://app.lostitemscommunity.com/']) {
      process.env.EXPO_PUBLIC_APP_URL = base;
      try { assert.equal(signupRedirectUrl(), 'https://app.lostitemscommunity.com/?auth=signup'); } finally { restore(); }
    }
  });

  test('on native the deep-link scheme is left exactly as it is (it must match the allow-list entry)', () => {
    const nav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', { value: { product: 'ReactNative' }, configurable: true });
    process.env.EXPO_PUBLIC_APP_URL = 'https://app.example.com';
    try { assert.equal(signupRedirectUrl(), 'lostitems://'); } finally {
      restore();
      if (nav) Object.defineProperty(globalThis, 'navigator', nav); else delete (globalThis as any).navigator;
    }
  });

  test('round-trips: a link built on it parses back as a signup', () => {
    process.env.EXPO_PUBLIC_APP_URL = 'https://app.example.com';
    try {
      assert.equal(parseAuthUrl(`${signupRedirectUrl()}#error=access_denied&error_code=otp_expired`)?.kind, 'error');
      assert.equal((parseAuthUrl(`${signupRedirectUrl()}#error=access_denied&error_code=otp_expired`) as { flow: string }).flow, 'signup');
    } finally { restore(); }
  });
});

describe('appUrl', () => {
  const env = process.env.EXPO_PUBLIC_APP_URL;
  const restore = () => { if (env === undefined) delete process.env.EXPO_PUBLIC_APP_URL; else process.env.EXPO_PUBLIC_APP_URL = env; };

  test('the configured URL wins', () => {
    process.env.EXPO_PUBLIC_APP_URL = 'https://app.example.com';
    try { assert.equal(appUrl(), 'https://app.example.com'); } finally { restore(); }
  });

  test('with nothing configured and no browser, falls back to the native deep-link scheme', () => {
    delete process.env.EXPO_PUBLIC_APP_URL;
    try { assert.equal(appUrl(), NATIVE_SCHEME_URL); assert.equal(NATIVE_SCHEME_URL, 'lostitems://'); } finally { restore(); }
  });

  test('on native the deep-link scheme wins even when EXPO_PUBLIC_APP_URL is baked in', () => {
    const nav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', { value: { product: 'ReactNative' }, configurable: true });
    process.env.EXPO_PUBLIC_APP_URL = 'https://app.example.com';
    try { assert.equal(appUrl(), 'lostitems://'); } finally {
      restore();
      if (nav) Object.defineProperty(globalThis, 'navigator', nav); else delete (globalThis as any).navigator;
    }
  });
});
