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

  test('the login values offer no demo or social sign-in', () => {
    const v = buildVals(new Store()) as Record<string, unknown>;
    for (const k of ['quickLogins', 'socials', 'authModeOptions', 'isDemoAuth', 'quick']) {
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
