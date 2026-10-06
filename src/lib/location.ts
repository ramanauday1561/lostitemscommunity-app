import * as Location from 'expo-location';
import type { LatLng } from './geo';

/** iOS/Android: ask for permission, then read the current position. Rejects with a readable message. */
export async function getDeviceLocation(): Promise<LatLng> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) {
    throw new Error(perm.canAskAgain
      ? 'Location permission was denied — search for the place instead.'
      : 'Location is turned off for this app. Enable it in your phone Settings, or search for the place instead.');
  }
  try {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    // A fresh fix can fail indoors or with services toggled off; a recent one is still good enough to centre a search.
    const last = await Location.getLastKnownPositionAsync().catch(() => null);
    if (last) return { lat: last.coords.latitude, lng: last.coords.longitude };
    throw new Error("Couldn't find your location. Check that location services are on, or search for the place instead.");
  }
}
