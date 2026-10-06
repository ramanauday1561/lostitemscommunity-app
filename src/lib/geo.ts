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

/** Search radii offered on the registry, in metres. */
export const NEAR_RADII = [500, 1000, 2000, 5000, 10000] as const;
export const DEFAULT_NEAR_RADIUS = 2000;

/** 500 -> "500 m", 2000 -> "2 km", 1500 -> "1.5 km". */
export function formatRadius(m: number): string {
  return m < 1000 ? `${m} m` : `${Number((m / 1000).toFixed(1))} km`;
}

/** Distance label for a result card: "320 m away", "1.4 km away". Rounds metres to the nearest 10. */
export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m away`;
  return `${Number((m / 1000).toFixed(1))} km away`;
}
