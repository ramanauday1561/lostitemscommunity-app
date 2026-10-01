/// <reference types="node" />
import { fake } from './setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as auth from '../../src/api/auth';

const GENERIC = 'Invalid username/email or password.';

describe('auth api', () => {
  beforeEach(() => fake.reset());

  describe('signIn', () => {
    test('resolves a bare username through email_for_username, then signs in with the email', async () => {
      fake.queue({ data: 'ann@example.com' }, { data: { session: {} } });
      await auth.signIn('  ann  ', 'pw');
      assert.equal(fake.calls[0].kind, 'rpc');
      assert.equal(fake.calls[0].name, 'email_for_username');
      assert.deepEqual(fake.args('args', 0), [{ p_username: 'ann' }]);
      assert.equal(fake.calls[1].name, 'signInWithPassword');
      assert.deepEqual(fake.args('args', 1), [{ email: 'ann@example.com', password: 'pw' }]);
    });

    test('an email skips the username lookup', async () => {
      fake.queue({ data: { session: {} } });
      await auth.signIn('ann@example.com', 'pw');
      assert.equal(fake.calls.length, 1);
      assert.equal(fake.calls[0].name, 'signInWithPassword');
    });

    test('unknown username fails with the generic message and never calls Auth (no enumeration)', async () => {
      fake.queue({ data: null });
      await assert.rejects(auth.signIn('ghost', 'pw'), { message: GENERIC });
      assert.equal(fake.calls.length, 1);
    });

    test('a failed lookup (e.g. network error) fails closed with the same generic message', async () => {
      fake.queue({ error: { message: 'fetch failed' } });
      await assert.rejects(auth.signIn('ann', 'pw'), { message: GENERIC });
    });

    for (const [raw, expected] of [
      ['Invalid login credentials', GENERIC],
      ['Email not confirmed', 'Confirm your email address before signing in.'],
      ['Request rate limit reached', 'Too many attempts. Wait a moment and try again.'],
      ['TypeError: Failed to fetch', "Can't reach the server. Check your connection and try again."],
      ['some internal postgres detail', 'Something went wrong. Please try again.'],
    ] as const) {
      test(`maps Auth error "${raw}" without leaking raw text`, async () => {
        fake.queue({ error: { message: raw } });
        await assert.rejects(auth.signIn('ann@example.com', 'pw'), { message: expected });
      });
    }
  });

  describe('signUp', () => {
    test('rejects a taken username before calling Auth', async () => {
      fake.queue({ data: false });
      await assert.rejects(auth.signUp('ann', 'ann@example.com', 'password1'), /already taken/);
      assert.equal(fake.calls.length, 1);
      assert.equal(fake.calls[0].name, 'username_available');
    });

    test('sends username/handle/display_name metadata and reports a session as signedIn', async () => {
      fake.queue({ data: true }, { data: { session: { access_token: 'x' } } });
      const r = await auth.signUp(' ann ', ' ann@example.com ', 'password1');
      assert.equal(r.signedIn, true);
      const [arg] = fake.args('args', 1) as [any];
      assert.equal(arg.email, 'ann@example.com');
      assert.deepEqual(arg.options.data, { username: 'ann', handle: 'ann', display_name: 'ann' });
    });

    test('no session (email confirmation pending) is reported as not signed in', async () => {
      fake.queue({ data: true }, { data: { session: null } });
      assert.equal((await auth.signUp('ann', 'a@b.co', 'password1')).signedIn, false);
    });

    test('still proceeds if the availability check itself errors (DB constraint is the backstop)', async () => {
      fake.queue({ error: { message: 'rpc down' } }, { data: { session: {} } });
      assert.equal((await auth.signUp('ann', 'a@b.co', 'password1')).signedIn, true);
    });

    test('maps "user already registered"', async () => {
      fake.queue({ data: true }, { error: { message: 'User already registered' } });
      await assert.rejects(auth.signUp('ann', 'a@b.co', 'password1'), /already registered/);
    });
  });

  test('requestPasswordReset trims the email and never throws (same UI whether or not it exists)', async () => {
    fake.queue({ error: { message: 'User not found' } });
    await auth.requestPasswordReset('  a@b.co ');
    assert.deepEqual(fake.args('args', 0), ['a@b.co']);
  });

  test('updatePassword maps errors', async () => {
    fake.queue({ error: { message: 'Password should be at least 8 characters' } });
    await assert.rejects(auth.updatePassword('x'), { message: 'Use at least 8 characters for your password.' });
  });

  test('getMyProfile returns null with no user, otherwise the row for that user', async () => {
    fake.queue({ data: { user: null } });
    assert.equal(await auth.getMyProfile(), null);

    fake.reset();
    fake.queue({ data: { user: { id: 'u1' } } }, { data: { id: 'u1', username: 'ann' } });
    assert.deepEqual(await auth.getMyProfile(), { id: 'u1', username: 'ann' });
    assert.ok(fake.has('eq', 'id', 'u1'));
    assert.equal(fake.calls[1].name, 'profiles');
  });

  test('getMyProfile returns null if the profile read fails', async () => {
    fake.queue({ data: { user: { id: 'u1' } } }, { error: { message: 'boom' } });
    assert.equal(await auth.getMyProfile(), null);
  });

  test('getMyEmail reads the email from the auth user', async () => {
    fake.queue({ data: { user: { email: 'ann@example.com' } } });
    assert.equal(await auth.getMyEmail(), 'ann@example.com');
    fake.queue({ data: { user: null } });
    assert.equal(await auth.getMyEmail(), null);
  });

  describe('acceptGuidelines', () => {
    test('stamps guidelines_accepted_at on the caller\'s own profile', async () => {
      fake.queue({ data: { id: 'u1', guidelines_accepted_at: 'now' } });
      const p = await auth.acceptGuidelines('u1');
      assert.equal(p.id, 'u1');
      assert.equal(fake.calls[0].name, 'profiles');
      const [patch] = fake.args('update') as [{ guidelines_accepted_at: string }];
      assert.ok(!Number.isNaN(Date.parse(patch.guidelines_accepted_at)));
      assert.deepEqual(Object.keys(patch), ['guidelines_accepted_at']); // touches nothing else
      assert.ok(fake.has('eq', 'id', 'u1'));
    });

    test('a failed write surfaces a friendly error, not the raw one', async () => {
      fake.queue({ error: { message: 'permission denied for table profiles' } });
      await assert.rejects(auth.acceptGuidelines('u1'), { message: "Couldn't save that. Please try again." });
    });
  });
});
