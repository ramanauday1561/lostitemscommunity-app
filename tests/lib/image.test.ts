import test from 'node:test';
import assert from 'node:assert/strict';
import { fitWithin, photoProblem, MAX_EDGE, MAX_PICK_BYTES } from '../../src/lib/image';

test('fitWithin scales the longer edge down and keeps the ratio', () => {
  assert.deepEqual(fitWithin(4000, 3000), { w: MAX_EDGE, h: 960 });
  assert.deepEqual(fitWithin(3000, 4000), { w: 960, h: MAX_EDGE });
});

test('fitWithin never scales up', () => {
  assert.deepEqual(fitWithin(800, 600), { w: 800, h: 600 });
});

test('photoProblem rejects odd types and oversized files', () => {
  assert.equal(photoProblem('image/jpeg', 1000), null);
  assert.equal(photoProblem('', 1000), null);
  assert.match(photoProblem('application/pdf', 1000)!, /JPEG, PNG or WebP/);
  assert.match(photoProblem('image/png', MAX_PICK_BYTES + 1)!, /10 MB/);
});
