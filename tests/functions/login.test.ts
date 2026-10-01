/// <reference types="node" />
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { handleLogin, DECOY_EMAIL, LIMITS, type LoginDeps } from '../../backend/functions/login/handler';

const SESSION = { access_token: 'a', refresh_token: 'r', expires_in: 3600, token_type: 'bearer' };

/** Scripted dependencies; records what the handler did. */
function makeDeps(over: Partial<{ users: Record<string, string>; passwords: Record<string, string>; unconfirmed: string[]; deny: (key: string) => boolean }> = {}) {
  const users = over.users ?? { ann: 'ann@example.com' };
  const passwords = over.passwords ?? { 'ann@example.com': 'right-password' };
  const log = { throttled: [] as string[], lookups: [] as string[], signIns: [] as string[] };
  const deps: LoginDeps = {
    async throttle(key) { log.throttled.push(key); return !(over.deny?.(key)); },
    async emailForUsername(u) { log.lookups.push(u); return users[u] ?? null; },
    async signIn(email, password) {
      log.signIns.push(email);
      if (over.unconfirmed?.includes(email) && passwords[email] === password) return { session: null, user: null, code: 'Email not confirmed' };
      if (passwords[email] === password) return { session: SESSION, user: { id: 'u1', email }, code: null };
      return { session: null, user: null, code: 'Invalid login credentials' };
    },
  };
  return { deps, log };
}

describe('login function', () => {
  describe('validation', () => {
    test('rejects a missing/empty/oversized identifier or password with 400, before doing any work', async () => {
      for (const body of [null, {}, { identifier: 'ann' }, { password: 'x' }, { identifier: '  ', password: 'x' },
        { identifier: 'a'.repeat(255), password: 'x' }, { identifier: 'ann', password: 'x'.repeat(1025) },
        { identifier: 5, password: 'x' }, 'string', []]) {
        const { deps, log } = makeDeps();
        const r = await handleLogin(body, '1.2.3.4', deps);
        assert.equal(r.status, 400, JSON.stringify(body)?.slice(0, 40));
        assert.deepEqual(log.throttled, []);
        assert.deepEqual(log.signIns, []);
      }
    });
  });

  describe('signing in', () => {
    test('a username is resolved server-side and a session is returned — with no email lookup result leaked', async () => {
      const { deps, log } = makeDeps();
      const r = await handleLogin({ identifier: ' ann ', password: 'right-password' }, '1.2.3.4', deps);
      assert.equal(r.status, 200);
      assert.deepEqual(r.body.session, SESSION);
      assert.deepEqual(log.lookups, ['ann']);
      assert.deepEqual(log.signIns, ['ann@example.com']);
    });

    test('an email skips the username lookup', async () => {
      const { deps, log } = makeDeps();
      const r = await handleLogin({ identifier: 'ann@example.com', password: 'right-password' }, '1.2.3.4', deps);
      assert.equal(r.status, 200);
      assert.deepEqual(log.lookups, []);
    });

    test('wrong password and unknown username are the SAME response (no username enumeration)', async () => {
      const wrong = await handleLogin({ identifier: 'ann', password: 'nope' }, '1.2.3.4', makeDeps().deps);
      const unknown = await handleLogin({ identifier: 'ghost', password: 'nope' }, '1.2.3.4', makeDeps().deps);
      assert.deepEqual(wrong, { status: 401, body: { error: 'invalid_credentials' } });
      assert.deepEqual(unknown, wrong);
    });

    test('an unknown username still runs a sign-in (against a decoy) so timing does not reveal it', async () => {
      const { deps, log } = makeDeps();
      await handleLogin({ identifier: 'ghost', password: 'nope' }, '1.2.3.4', deps);
      assert.deepEqual(log.signIns, [DECOY_EMAIL]);
    });

    test('the response body never contains an email other than the signed-in user\'s own', async () => {
      const ok = await handleLogin({ identifier: 'ann', password: 'right-password' }, '1.2.3.4', makeDeps().deps);
      assert.deepEqual(ok.body.user, { id: 'u1', email: 'ann@example.com' });
      const bad = await handleLogin({ identifier: 'ann', password: 'nope' }, '1.2.3.4', makeDeps().deps);
      assert.ok(!JSON.stringify(bad.body).includes('@'));
    });

    test('"email not confirmed" is only reported for a real account with the right password', async () => {
      const real = await handleLogin({ identifier: 'ann', password: 'right-password' }, '1.2.3.4',
        makeDeps({ unconfirmed: ['ann@example.com'] }).deps);
      assert.deepEqual(real, { status: 403, body: { error: 'email_not_confirmed' } });

      const wrongPw = await handleLogin({ identifier: 'ann', password: 'nope' }, '1.2.3.4',
        makeDeps({ unconfirmed: ['ann@example.com'] }).deps);
      assert.equal(wrongPw.status, 401);
    });
  });

  describe('rate limiting', () => {
    test('counts one attempt against BOTH the caller\'s IP and the identifier (case-insensitive)', async () => {
      const { deps, log } = makeDeps();
      await handleLogin({ identifier: 'Ann', password: 'x' }, '9.9.9.9', deps);
      assert.deepEqual(log.throttled.sort(), ['id:ann', 'ip:9.9.9.9']);
    });

    test('over the per-identifier limit -> 429 with no lookup and no sign-in attempt', async () => {
      const { deps, log } = makeDeps({ deny: (k) => k.startsWith('id:') });
      const r = await handleLogin({ identifier: 'ann', password: 'right-password' }, '1.2.3.4', deps);
      assert.equal(r.status, 429);
      assert.equal(r.body.error, 'rate_limited');
      assert.deepEqual(log.lookups, []);
      assert.deepEqual(log.signIns, [], 'even the CORRECT password is not tried once throttled');
    });

    test('over the per-IP limit -> 429 as well', async () => {
      const { deps, log } = makeDeps({ deny: (k) => k.startsWith('ip:') });
      assert.equal((await handleLogin({ identifier: 'ann', password: 'x' }, '1.2.3.4', deps)).status, 429);
      assert.deepEqual(log.signIns, []);
    });

    test('both keys are always counted, even when the first is already over the limit (no probing one via the other)', async () => {
      const { deps, log } = makeDeps({ deny: (k) => k.startsWith('ip:') });
      await handleLogin({ identifier: 'ann', password: 'x' }, '1.2.3.4', deps);
      assert.equal(log.throttled.length, 2);
    });

    test('a missing client IP falls back to a shared "unknown" bucket instead of skipping the check', async () => {
      const { deps, log } = makeDeps();
      await handleLogin({ identifier: 'ann', password: 'x' }, '', deps);
      assert.ok(log.throttled.includes('ip:unknown'));
    });

    test('limits are strict enough to matter: a handful of guesses per identifier per 10 minutes', () => {
      assert.ok(LIMITS.perIdentifier.limit <= 10);
      assert.ok(LIMITS.perIdentifier.windowSeconds >= 600);
      assert.ok(LIMITS.perIp.limit >= LIMITS.perIdentifier.limit);
    });
  });
});
