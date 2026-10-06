import type { LatLng } from '../lib/geo';

export interface MapPinData { key: string; lat: number; lng: number }

/** The visible part of the map, in degrees. */
export interface MapBounds { south: number; west: number; north: number; east: number }

export interface ItemsMapProps {
  pins: MapPinData[];
  selectedKey: string | null;
  /** Pin colour: lost and found use different ones. */
  color: string;
  /** Flies the camera here whenever it changes (a searched place, "my location"). Null keeps the user's own view. */
  center: LatLng | null;
  onSelect: (key: string | null) => void;
  /** Fired once the map is ready and after every pan/zoom, so the app can load the pins in view. */
  onBoundsChange: (b: MapBounds) => void;
  /** Re-centre on the device location. */
  onLocate: () => void;
  locating?: boolean;
}

export const MAP_ITEM_ZOOM = 14;
