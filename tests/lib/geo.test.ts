import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCoords, coord, formatDistance, formatRadius } from '../../src/lib/geo';
import { shortLabel, toPlaces } from '../../src/api/places';

test('parseCoords reads a "lat, lng" pair and rejects junk', () => {
  assert.deepEqual(parseCoords('40.7128, -73.9960'), { lat: 40.7128, lng: -73.996 });
  assert.equal(parseCoords(null), null);
  assert.equal(parseCoords('not a pin'), null);
  assert.equal(parseCoords('91, 10'), null);
  assert.equal(parseCoords('10, 181'), null);
});

test('coord keeps five decimals', () => {
  assert.equal(coord(51.5007), '51.50070');
});

test('shortLabel keeps the first three parts', () => {
  assert.equal(shortLabel('Union Square, Manhattan, New York, 10003, United States'), 'Union Square, Manhattan, New York');
});

test('toPlaces drops hits without a name or a usable position', () => {
  const places = toPlaces([
    { display_name: 'Central Station, Sydney', lat: '-33.88', lon: '151.2' },
    { display_name: 'No position' },
    { lat: '1', lon: '2' },
  ]);
  assert.deepEqual(places, [{ label: 'Central Station, Sydney', lat: -33.88, lng: 151.2 }]);
});

test('formatRadius and formatDistance read naturally', () => {
  assert.equal(formatRadius(500), '500 m');
  assert.equal(formatRadius(2000), '2 km');
  assert.equal(formatRadius(1500), '1.5 km');
  assert.equal(formatDistance(3), '10 m away');
  assert.equal(formatDistance(324), '320 m away');
  assert.equal(formatDistance(1449), '1.4 km away');
});
