/// <reference types="node" />
import { fake } from '../api/setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';
import { LINK_EXPIRED } from '../../src/lib/authUrl';

const RECOVERY_URL = 'https://app.example.com/#access_token=AT&refresh_token=RT&type=recovery';
const callNames = () => fake.calls.map((c) => c.name);

describe('password reset link (14)', () => {
  beforeEach(() => fake.reset());

  describe('opening the app from a reset link', () => {
    test('a valid link adopts the recovery session and shows the "new password" form', async () => {
      const store = new Store();
      const handled = await store.handleAuthUrl(RECOVERY_URL);
      assert.equal(handled, true);
      assert.deepEqual(fake.args('args', 0), [{ access_token: 'AT', refresh_token: 'RT' }]);
      assert.equal(store.state.screen, 'forgot');
      assert.equal(store.state.fpStage, 'reset');
      assert.equal(store.state.fpRecovery, true);
      assert.equal(store.state.authMode, 'supabase');
      const v = buildVals(store);
      assert.equal(v.fpIsReset, true);
      assert.equal(v.fpTitle, 'Set a new password');
      assert.equal(v.fpPrimaryLabel, 'Update password');
    });

    test('the reset session is NOT mistaken for "already signed in" (no dashboard, no stored-session restore)', async () => {
      const store = new Store();
      await store.handleAuthUrl(RECOVERY_URL);
      fake.reset();
      fake.queue({ data: { session: { user: { id: 'u1' } } } });
      await store.restoreSession();
      assert.equal(fake.calls.length, 0, 'restoreSession must not even look at the session');
      assert.equal(store.state.screen, 'forgot');
      assert.equal(store.state.role, null);
    });

    test('an ordinary URL is not handled, so the app restores a normal session', async () => {
      const store = new Store();
      assert.equal(await store.handleAuthUrl('https://app.example.com/'), false);
      assert.equal(await store.handleAuthUrl(null), false);
      assert.equal(fake.calls.length, 0);
      assert.equal(store.state.screen, 'welcome');
    });

    test('an expired link shows the email form with an explanation (and is still "handled")', async () => {
      const store = new Store();
      const handled = await store.handleAuthUrl('https://app.example.com/#error=access_denied&error_code=otp_expired');
      assert.equal(handled, true);
      assert.equal(store.state.screen, 'forgot');
      assert.equal(store.state.fpStage, 'email');
      assert.equal(store.state.fpError, LINK_EXPIRED);
      assert.equal(fake.calls.length, 0, 'no session was created');
    });

    test('a link whose tokens Supabase rejects ends the same way', async () => {
      const store = new Store();
      fake.queue({ error: { message: 'Invalid Refresh Token: Already Used' } });
      await store.handleAuthUrl(RECOVERY_URL);
      assert.equal(store.state.fpStage, 'email');
      assert.equal(store.state.fpRecovery, false);
      assert.equal(store.state.fpError, LINK_EXPIRED);
      // and a failed link no longer blocks restoring a normal session
      fake.reset(); fake.queue({ data: { session: null } });
      await store.restoreSession();
      assert.ok(callNames().includes('getSession'));
    });
  });

  describe('choosing the new password', () => {
    async function resetForm() {
      const store = new Store();
      await store.handleAuthUrl(RECOVERY_URL);
      fake.reset();
      return store;
    }

    test('rejects a short password and a mismatch without calling Supabase', async () => {
      const store = await resetForm();
      store.setState({ fpPass: 'short', fpConfirm: 'short' });
      await store.finishPasswordResetSupabase();
      assert.match(store.state.fpError, /at least 8/);
      store.setState({ fpPass: 'long-enough-1', fpConfirm: 'different-1' });
      await store.finishPasswordResetSupabase();
      assert.match(store.state.fpError, /don't match/);
      assert.equal(fake.calls.length, 0);
    });

    test('saves the password, then signs the recovery session OUT, and shows the success state', async () => {
      const store = await resetForm();
      store.setState({ fpPass: 'a-new-password-1', fpConfirm: 'a-new-password-1' });
      await store.finishPasswordResetSupabase();
      assert.deepEqual(callNames(), ['updateUser', 'signOut']);
      assert.deepEqual(fake.args('args', 0), [{ password: 'a-new-password-1' }]);
      assert.equal(store.state.fpStage, 'changed');
      assert.equal(store.state.fpRecovery, false);
      assert.equal(store.state.fpPass, '', 'the password is not kept in state');
      const v = buildVals(store);
      assert.equal(v.fpTitle, 'Password changed');
      assert.equal(v.fpIsDone, true);
      assert.equal(v.fpShowSignInLink, false);
      assert.equal(v.fpIdx, 3);
    });

    test('after success the session restore works normally again', async () => {
      const store = await resetForm();
      store.setState({ fpPass: 'a-new-password-1', fpConfirm: 'a-new-password-1' });
      await store.finishPasswordResetSupabase();
      fake.reset(); fake.queue({ data: { session: null } });
      await store.restoreSession();
      assert.ok(callNames().includes('getSession'));
    });

    test('a server-side failure keeps the form and shows the message (and does NOT sign out)', async () => {
      const store = await resetForm();
      store.setState({ fpPass: 'same-as-before', fpConfirm: 'same-as-before' });
      fake.queue({ error: { message: 'New password should be different from the old password.' } });
      await store.finishPasswordResetSupabase();
      assert.equal(store.state.fpStage, 'reset');
      assert.equal(store.state.fpError, "Choose a password you haven't used before.");
      assert.equal(store.state.fpBusy, false);
      assert.deepEqual(callNames(), ['updateUser']);
    });

    test('the Update button drives it through the selectors', async () => {
      const store = await resetForm();
      store.setState({ fpPass: 'a-new-password-1', fpConfirm: 'a-new-password-1' });
      assert.equal(buildVals(store).fpPrimaryEnabled, true);
      buildVals(store).fpPrimary();
      await new Promise((r) => setTimeout(r, 30));
      assert.ok(callNames().includes('updateUser'));
    });
  });

  describe('leaving without finishing', () => {
    test('Back ends the recovery session and returns to sign-in (no lingering signed-in state)', async () => {
      const store = new Store();
      await store.handleAuthUrl(RECOVERY_URL);
      fake.reset();
      buildVals(store).fpBack();
      await new Promise((r) => setTimeout(r, 30));
      assert.deepEqual(callNames(), ['signOut']);
      assert.equal(store.state.screen, 'login');
      assert.equal(store.state.fpRecovery, false);
    });

    test('the "Remembered it? Sign in" link is hidden during a reset', async () => {
      const store = new Store();
      await store.handleAuthUrl(RECOVERY_URL);
      assert.equal(buildVals(store).fpShowSignInLink, false);
    });
  });

  test('demo mode and the normal "send me a link" flow are unaffected', () => {
    const v = buildVals(new Store());
    assert.equal(v.fpShowSignInLink, true);
    assert.equal(v.fpIsReset, false);
  });
});
