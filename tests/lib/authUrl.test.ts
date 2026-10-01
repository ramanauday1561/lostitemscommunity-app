/// <reference types="node" />
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAuthUrl, LINK_EXPIRED, LINK_INVALID } from '../../src/lib/authUrl';
import { appUrl, NATIVE_SCHEME_URL } from '../../src/lib/appUrl';

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
    assert.deepEqual(r, { kind: 'error', code: 'otp_expired', message: LINK_EXPIRED });
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
    assert.equal(parseAuthUrl('https://x.test/#access_token=A&refresh_token=R&type=signup'), null, 'a signup/magic link is not a reset');
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
});
