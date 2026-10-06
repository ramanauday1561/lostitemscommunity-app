import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Camera, Map, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { MAP_STYLE_URL, WORLD_VIEW } from '../lib/geo';
import { MAP_ITEM_ZOOM, type ItemsMapProps } from './ItemsMap.types';
import { MapControls, MapLoadingOverlay } from './MapControls';

/** Registry map (iOS/Android): MapLibre Native with one marker per item. Pinch and drag move it; the +/- buttons
 *  step the zoom. The web build has its own version (ItemsMap.web.tsx). */
export function ItemsMap({ pins, selectedKey, color, center, onSelect, onBoundsChange, onLocate, locating }: ItemsMapProps) {
  const camera = useRef<CameraRef>(null);
  const zoom = useRef(center ? MAP_ITEM_ZOOM : WORLD_VIEW.zoom);
  const fitted = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!center) return;
    // A region (a country, a city) is framed whole; a spot is flown to at street zoom.
    if (center.bounds) camera.current?.fitBounds(center.bounds, { padding: { top: 30, right: 30, bottom: 30, left: 30 }, duration: 800 });
    else camera.current?.flyTo({ center: [center.lng, center.lat], zoom: Math.max(zoom.current, MAP_ITEM_ZOOM), duration: 800 });
  }, [center?.lat, center?.lng]);

  // First time pins arrive with no place chosen: frame them, instead of leaving the camera on an empty world view.
  useEffect(() => {
    if (fitted.current || center || pins.length === 0) return;
    fitted.current = true;
    const span = (a: number[]) => Math.max(...a) - Math.min(...a);
    if (pins.length === 1 || (span(pins.map((p) => p.lat)) < 0.004 && span(pins.map((p) => p.lng)) < 0.004)) { camera.current?.flyTo({ center: [pins[0].lng, pins[0].lat], zoom: MAP_ITEM_ZOOM, duration: 600 }); return; }
    const lats = pins.map((p) => p.lat); const lngs = pins.map((p) => p.lng);
    camera.current?.fitBounds([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], { padding: { top: 70, right: 70, bottom: 70, left: 70 }, duration: 600 });
  }, [pins]);

  const step = (d: number) => camera.current?.zoomTo(Math.min(20, Math.max(1, zoom.current + d)), { duration: 250 });

  return (
    <View style={{ flex: 1, minHeight: 360, backgroundColor: '#E4E9EF' }}>
      <Map
        style={{ flex: 1 }}
        mapStyle={MAP_STYLE_URL}
        logo={false}
        compass={false}
        touchPitch={false}
        touchRotate={false}
        onDidFinishLoadingMap={() => setReady(true)}
        onPress={() => onSelect(null)}
        onRegionDidChange={(e) => {
          const { bounds, zoom: z } = e.nativeEvent;
          zoom.current = z;
          onBoundsChange({ west: bounds[0], south: bounds[1], east: bounds[2], north: bounds[3] });
        }}
      >
        <Camera
          ref={camera}
          initialViewState={center
            ? { center: [center.lng, center.lat], zoom: MAP_ITEM_ZOOM }
            : { center: [WORLD_VIEW.center.lng, WORLD_VIEW.center.lat], zoom: WORLD_VIEW.zoom }}
        />
        {pins.map((p) => {
          const on = p.key === selectedKey;
          const size = on ? 30 : 22;
          return (
            <Marker key={p.key} lngLat={[p.lng, p.lat]} onPress={() => onSelect(p.key)}>
              <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: on ? 5 : 4, borderColor: '#fff' }} />
            </Marker>
          );
        })}
      </Map>
      {!ready && <MapLoadingOverlay />}
      <MapControls onZoomIn={() => step(1)} onZoomOut={() => step(-1)} onLocate={onLocate} locating={locating} />
    </View>
  );
}
