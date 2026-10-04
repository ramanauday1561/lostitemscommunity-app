import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Camera, Map, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { C } from '../theme/tokens';
import { MAP_STYLE_URL, PIN_ZOOM, WORLD_VIEW, type LatLng } from '../lib/geo';

export interface MapPickerProps {
  pin: LatLng | null;
  /** Omit for a read-only map (the item sheet). */
  onPick?: (at: LatLng) => void;
  height?: number;
}

/** iOS/Android map: MapLibre Native on the same free OpenFreeMap style as the web map. The credit sits behind the
 *  map's (i) button. The web build has its own version (MapPicker.web.tsx). */
export function MapPicker({ pin, onPick, height = 190 }: MapPickerProps) {
  const camera = useRef<CameraRef>(null);
  const interactive = !!onPick;

  // Follow the pin when it is moved from outside the map (search result, "Use my location").
  useEffect(() => {
    if (pin) camera.current?.easeTo({ center: [pin.lng, pin.lat], zoom: PIN_ZOOM, duration: 400 });
  }, [pin?.lat, pin?.lng]);

  return (
    <View style={{ height, borderRadius: 20, overflow: 'hidden', backgroundColor: '#E4E9EF' }}>
      <Map
        style={{ flex: 1 }}
        mapStyle={MAP_STYLE_URL}
        logo={false}
        compass={false}
        dragPan={interactive}
        touchZoom={interactive}
        doubleTapZoom={interactive}
        touchPitch={false}
        touchRotate={false}
        onPress={(e) => {
          const [lng, lat] = e.nativeEvent.lngLat;
          onPick?.({ lat, lng });
        }}
      >
        <Camera
          ref={camera}
          initialViewState={pin
            ? { center: [pin.lng, pin.lat], zoom: PIN_ZOOM }
            : { center: [WORLD_VIEW.center.lng, WORLD_VIEW.center.lat], zoom: WORLD_VIEW.zoom }}
        />
        {pin && (
          <Marker lngLat={[pin.lng, pin.lat]}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.danger, borderWidth: 4, borderColor: C.white }} />
          </Marker>
        )}
      </Map>
    </View>
  );
}
