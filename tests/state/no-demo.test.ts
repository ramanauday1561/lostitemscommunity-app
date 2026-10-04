/// <reference types="node" />
import '../api/setup';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';

describe('no demo mode', () => {
  test('a fresh store holds no sample data', () => {
    const s = new Store().state;
    assert.deepEqual(s.convos, []);
    assert.equal(s.dbItems, null);
    assert.equal(s.dbThreads, null);
    for (const k of ['lost', 'found', 'threads', 'members', 'flagged', 'ads', 'authMode']) {
      assert.equal(k in s, false, `${k} should be gone`);
    }
  });

  test('the login values offer no demo sign-in', () => {
    const v = buildVals(new Store()) as Record<string, unknown>;
    for (const k of ['quickLogins', 'authModeOptions', 'isDemoAuth', 'quick']) {
      assert.equal(k in v, false, `${k} should be gone`);
    }
    assert.equal(typeof v.submit, 'function');
  });

  test('no registry rows, conversations or threads appear before anything is loaded', () => {
    const v = buildVals(new Store());
    assert.deepEqual(v.registry, []);
    assert.deepEqual(v.conversations, []);
    assert.deepEqual(v.threads, []);
    assert.deepEqual(v.flagged, []);
  });
});

describe('social sign-in buttons', () => {
  test('Google, Facebook and X are listed, and tapping one only says it is coming soon (it never signs anyone in)', () => {
    const store = new Store();
    const v = buildVals(store);
    assert.deepEqual(v.socials.map((x) => x.name), ['Google', 'Facebook', 'X']);
    v.socials[0].go();
    assert.equal(store.state.toast, 'Sign in with Google is coming soon.');
    assert.equal(store.state.screen, 'welcome');
    assert.equal(store.state.profile, null);
  });
});
