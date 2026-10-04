/// <reference types="node" />
import '../api/setup';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';

function admin(reports: { day: string | null; reports: number | null }[], keywords: unknown[] = []) {
  const store = new Store();
  store.setState({ screen: 'analysis', role: 'admin', suTerms: true,
    profile: { id: 'a', role: 'superadmin' } as any, dbWeeklyReports: reports, dbKeywords: keywords } as any);
  return buildVals(store);
}

describe('analysis chart on real data', () => {
  test('labels are weekday letters, not ISO dates', () => {
    // 2026-09-25 is a Friday, 2026-10-01 a Thursday
    const v = admin([{ day: '2026-09-25', reports: 2 }, { day: '2026-10-01', reports: 1 }]);
    assert.deepEqual(v.bars.map((b) => b.label), ['F', 'T']);
  });

  test('heights scale to the busiest day and that day is highlighted', () => {
    const v = admin([{ day: '2026-09-28', reports: 40 }, { day: '2026-09-29', reports: 10 }, { day: '2026-09-30', reports: 0 }]);
    assert.deepEqual(v.bars.map((b) => b.height), [96, 24, 0]);
    assert.deepEqual(v.bars.map((b) => b.on), [true, false, false]);
  });

  test('a small non-zero day never draws as an invisible sliver', () => {
    const v = admin([{ day: '2026-09-28', reports: 500 }, { day: '2026-09-29', reports: 1 }]);
    assert.ok(v.bars[1].height >= 6);
  });

  test('no data at all is an explicit empty state, and a bad date does not crash', () => {
    const v = admin([]);
    assert.equal(v.barsEmpty, true);
    assert.equal(v.keywordsEmpty, true);
    assert.deepEqual(admin([{ day: null, reports: null }]).bars.map((b) => [b.label, b.value]), [['', 0]]);
    assert.deepEqual(admin([{ day: 'garbage', reports: 1 }]).bars.map((b) => b.label), ['']);
  });

  test('keywords render with hit counts once present', () => {
    const v = admin([], [{ word: 'send deposit', hits: 4 }, { word: 'meet alone', hits: 1 }]);
    assert.deepEqual(v.keywords, [{ word: 'send deposit', hits: '4 hits' }, { word: 'meet alone', hits: '1 hit' }]);
    assert.equal(v.keywordsEmpty, false);
  });
});
