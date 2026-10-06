import { distanceM, type LatLng } from '../lib/geo';

/** A region (country, state, city) rather than a spot: `bounds` is [west, south, east, north] and `radiusM` reaches
 *  from its centre to a corner, so a search can cover the whole area instead of a 2 km circle in its middle. */
export interface PlaceArea { bounds: [number, number, number, number]; radiusM: number }
export interface Place extends LatLng { label: string; area?: PlaceArea }

interface NominatimHit { display_name?: string; lat?: string; lon?: string; boundingbox?: string[] }

/** Anything wider than the biggest distance chip (10 km) is searched as an area. */
const AREA_MIN_RADIUS_M = 10_000;

function areaOf(h: NominatimHit, centre: LatLng): PlaceArea | undefined {
  const [south, north, west, east] = (h.boundingbox ?? []).map(Number);
  if (![south, north, west, east].every(Number.isFinite)) return undefined;
  const radiusM = Math.round(distanceM(centre, { lat: north, lng: east }));
  return radiusM > AREA_MIN_RADIUS_M ? { bounds: [west, south, east, north], radiusM } : undefined;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

/** Shortens "Central Station, Platform 3, Some Road, City, 12345, Country" to its first three parts. */
export function shortLabel(displayName: string): string {
  return displayName.split(',').map((p) => p.trim()).filter(Boolean).slice(0, 3).join(', ');
}

export function toPlaces(hits: NominatimHit[]): Place[] {
  const out: Place[] = [];
  for (const h of hits) {
    const lat = Number(h.lat); const lng = Number(h.lon);
    if (!h.display_name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const area = areaOf(h, { lat, lng });
    out.push({ label: shortLabel(h.display_name), lat, lng, ...(area ? { area } : null) });
  }
  return out;
}

/** Free-text place search on OpenStreetMap's Nominatim. Its usage policy allows ~1 request a
 *  second and no search-as-you-type, so callers search on submit only. */
export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const res = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Place search is unavailable right now.');
  return toPlaces((await res.json()) as NominatimHit[]);
}

/** A readable name for a spot ("Union Square, Manhattan, New York"), or null if none is found. */
export async function describePlace(at: LatLng): Promise<string | null> {
  const res = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=17&lat=${at.lat}&lon=${at.lng}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const hit = (await res.json()) as NominatimHit;
  return hit.display_name ? shortLabel(hit.display_name) : null;
}
