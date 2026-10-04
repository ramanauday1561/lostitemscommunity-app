import type { LatLng } from './geo';

/** Web: the browser's geolocation. Rejects with a readable message. */
export function getDeviceLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
    if (!geo) { reject(new Error('Location is not available on this device — search for the place instead.')); return; }
    geo.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.code === 1 ? 'Location permission was denied — search for the place instead.' : 'Could not get your location.')),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}
