export interface LatLng { lat: number; lng: number }

/** "40.7128, -73.9960" -> {lat, lng}; null for anything that isn't a valid pair. */
export function parseCoords(text: string | null | undefined): LatLng | null {
  if (!text) return null;
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(text);
  if (!m) return null;
  const lat = Number(m[1]); const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

/** Five decimals is about a metre -- plenty for "where did I leave it". */
export function coord(n: number): string {
  return n.toFixed(5);
}

/** Wide world view when nothing is pinned yet. */
export const WORLD_VIEW = { center: { lat: 20, lng: 0 }, zoom: 1.4 };
export const PIN_ZOOM = 15;
/** OpenFreeMap: free vector tiles built on OpenStreetMap data, no key or account. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
