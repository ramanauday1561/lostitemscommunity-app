import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE_URL, WORLD_VIEW } from '../lib/geo';
import { MAP_ITEM_ZOOM, type ItemsMapProps, type MapBounds } from './ItemsMap.types';
import { MapControls } from './MapControls';

function boundsOf(m: MapLibreMap): MapBounds {
  const b = m.getBounds();
  return { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
}

/** Registry map (web): one MapLibre GL marker per item. Pan, scroll-zoom and the +/- buttons all work; tapping a
 *  pin selects it, tapping the map clears the selection. */
export function ItemsMap(props: ItemsMapProps) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const lib = useRef<typeof import('maplibre-gl') | null>(null);
  const markers = useRef(new globalThis.Map<string, { marker: Marker; el: HTMLDivElement }>());
  const latest = useRef(props);
  latest.current = props;

  const styleDot = (el: HTMLDivElement, selected: boolean) => {
    const size = selected ? 30 : 22;
    Object.assign(el.style, {
      width: `${size}px`, height: `${size}px`, borderRadius: '50%', cursor: 'pointer', boxSizing: 'border-box',
      background: latest.current.color, border: `${selected ? 5 : 4}px solid #fff`,
      boxShadow: selected ? '0 3px 10px rgba(0,0,0,.4)' : '0 1px 5px rgba(0,0,0,.35)',
      zIndex: selected ? '2' : '1',
    });
  };

  const sync = () => {
    const m = map.current; const l = lib.current;
    if (!m || !l) return;
    const { pins, selectedKey } = latest.current;
    const wanted = new Set(pins.map((p) => p.key));
    for (const [key, entry] of markers.current) {
      if (!wanted.has(key)) { entry.marker.remove(); markers.current.delete(key); }
    }
    for (const p of pins) {
      let entry = markers.current.get(p.key);
      if (!entry) {
        const el = document.createElement('div');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', 'Show item details');
        el.addEventListener('click', (e) => { e.stopPropagation(); latest.current.onSelect(p.key); });
        entry = { marker: new l.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(m), el };
        markers.current.set(p.key, entry);
      }
      styleDot(entry.el, p.key === selectedKey);
    }
  };

  useEffect(() => {
    let gone = false;
    (async () => {
      const l = await import('maplibre-gl');
      if (gone || !box.current) return;
      lib.current = l;
      l.setWorkerUrl(new URL('/maplibre/maplibre-gl-worker.js', window.location.origin).href);
      const start = latest.current.center;
      const m = new l.Map({
        container: box.current,
        style: MAP_STYLE_URL,
        center: start ? [start.lng, start.lat] : [WORLD_VIEW.center.lng, WORLD_VIEW.center.lat],
        zoom: start ? MAP_ITEM_ZOOM : WORLD_VIEW.zoom,
        attributionControl: { compact: true },
      });
      map.current = m;
      m.on('click', () => latest.current.onSelect(null));
      m.on('moveend', () => latest.current.onBoundsChange(boundsOf(m)));
      m.on('error', (e) => console.warn('map error:', e.error?.message ?? e));
      latest.current.onBoundsChange(boundsOf(m));
      sync();
    })();
    return () => {
      gone = true;
      for (const { marker } of markers.current.values()) marker.remove();
      markers.current.clear();
      map.current?.remove(); map.current = null;
    };
  }, []);

  useEffect(sync, [props.pins, props.selectedKey, props.color]);

  useEffect(() => {
    if (props.center) map.current?.flyTo({ center: [props.center.lng, props.center.lat], zoom: Math.max(map.current.getZoom(), MAP_ITEM_ZOOM) });
  }, [props.center?.lat, props.center?.lng]);

  return (
    <View style={{ flex: 1, minHeight: 360 }}>
      <div ref={box} style={{ position: 'absolute', inset: 0, background: '#E4E9EF' }} />
      <MapControls onZoomIn={() => map.current?.zoomIn()} onZoomOut={() => map.current?.zoomOut()}
        onLocate={props.onLocate} locating={props.locating} />
    </View>
  );
}
