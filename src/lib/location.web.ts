import type { LatLng } from './geo';

const BLOCKED = "Location is blocked for this site. Allow it in your browser's site settings (the lock or ⓘ icon by the address), then try again — or search for the place instead.";

function once(geo: Geolocation, options: PositionOptions): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    geo.getCurrentPosition((pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }), reject, options);
  });
}

/** Web: the browser's geolocation. Rejects with a readable message.
 *  Tries a quick network/Wi-Fi fix first (works indoors and on desktops), then GPS, because asking for high
 *  accuracy straight away often times out and the browser reports that as a failure. */
export async function getDeviceLocation(): Promise<LatLng> {
  const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
  if (!geo) throw new Error('Location is not available on this device — search for the place instead.');

  // Already blocked: the browser won't show a prompt again, so say how to unblock instead of failing opaquely.
  try {
    const status = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
    if (status?.state === 'denied') throw new Error(BLOCKED);
  } catch (e) {
    if (e instanceof Error && e.message === BLOCKED) throw e;
    /* Permissions API missing (older Safari): just ask. */
  }

  try {
    return await once(geo, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  } catch (first) {
    const code = (first as GeolocationPositionError).code;
    if (code === 1) throw new Error(BLOCKED);
    try {
      return await once(geo, { enableHighAccuracy: true, timeout: 15000 });
    } catch (second) {
      if ((second as GeolocationPositionError).code === 1) throw new Error(BLOCKED);
      throw new Error("Couldn't find your location. Check that location services are on, or search for the place instead.");
    }
  }
}
