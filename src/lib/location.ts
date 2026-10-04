import * as Location from 'expo-location';
import type { LatLng } from './geo';

/** iOS/Android: ask for permission, then read the current position. Rejects with a readable message. */
export async function getDeviceLocation(): Promise<LatLng> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) throw new Error('Location permission was denied — search for the place instead.');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}
