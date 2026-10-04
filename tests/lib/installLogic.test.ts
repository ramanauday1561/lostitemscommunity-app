import test from 'node:test';
import assert from 'node:assert/strict';
import { installMode, isIos, isSnoozed, SNOOZE_DAYS } from '../../src/lib/installLogic';

test('isIos spots iPhones and iPads, including iPadOS posing as a Mac', () => {
  assert.equal(isIos('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'iPhone', 5), true);
  assert.equal(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5), true);
  assert.equal(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0), false);
  assert.equal(isIos('Mozilla/5.0 (Linux; Android 14; Pixel 8)', 'Linux armv8l', 5), false);
});

test('a dismissal snoozes the banner for a week, then it comes back', () => {
  const day = 24 * 60 * 60 * 1000;
  assert.equal(isSnoozed(null, 1_000_000), false);
  assert.equal(isSnoozed(0, 1_000_000), false);
  const at = 5_000_000_000;
  assert.equal(isSnoozed(at, at + (SNOOZE_DAYS - 1) * day), true);
  assert.equal(isSnoozed(at, at + (SNOOZE_DAYS + 1) * day), false);
});

test('installMode: nothing inside the installed app or while snoozed; prompt beats the iOS steps', () => {
  const base = { standalone: false, snoozed: false, ios: false, canPrompt: false };
  assert.equal(installMode({ ...base, standalone: true, canPrompt: true }), null);
  assert.equal(installMode({ ...base, snoozed: true, ios: true }), null);
  assert.equal(installMode({ ...base, canPrompt: true }), 'prompt');
  assert.equal(installMode({ ...base, ios: true }), 'ios');
  assert.equal(installMode(base), null, 'a browser that cannot install shows nothing');
});
