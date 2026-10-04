import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { C } from '../theme/tokens';
import { MAP_STYLE_URL, PIN_ZOOM, WORLD_VIEW, type LatLng } from '../lib/geo';

export interface MapPickerProps {
  pin: LatLng | null;
  /** Omit for a read-only map (the item sheet). */
  onPick?: (at: LatLng) => void;
  height?: number;
}

/** MapLibre GL map on OpenFreeMap tiles. Loaded on demand so the map code only
 *  downloads when a sheet that needs it opens. */
export function MapPicker({ pin, onPick, height = 190 }: MapPickerProps) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const lib = useRef<typeof import('maplibre-gl') | null>(null);
  const latest = useRef({ pin, onPick });
  latest.current = { pin, onPick };

  const show = (at: LatLng | null, animate: boolean) => {
    const m = map.current; const l = lib.current;
    if (!m || !l) return;
    if (!at) { marker.current?.remove(); marker.current = null; return; }
    if (!marker.current) marker.current = new l.Marker({ color: C.danger }).setLngLat([at.lng, at.lat]).addTo(m);
    else marker.current.setLngLat([at.lng, at.lat]);
    const view = { center: [at.lng, at.lat] as [number, number], zoom: Math.max(m.getZoom(), PIN_ZOOM) };
    if (animate) m.easeTo(view); else m.jumpTo(view);
  };

  useEffect(() => {
    let gone = false;
    (async () => {
      const l = await import('maplibre-gl');
      if (gone || !box.current) return;
      lib.current = l;
      // The tile-decoding worker is served from /maplibre/ (see scripts/copy-maplibre-worker.mjs); the bundler
      // doesn't ship it, and without it the map draws its background but never any streets.
      l.setWorkerUrl(new URL('/maplibre/maplibre-gl-worker.js', window.location.origin).href);
      const start = latest.current.pin;
      const m = new l.Map({
        container: box.current,
        style: MAP_STYLE_URL,
        center: start ? [start.lng, start.lat] : [WORLD_VIEW.center.lng, WORLD_VIEW.center.lat],
        zoom: start ? PIN_ZOOM : WORLD_VIEW.zoom,
        interactive: !!latest.current.onPick,
        // Two-finger pan on touch screens, so the map never traps the sheet's own scrolling.
        cooperativeGestures: true,
        attributionControl: { compact: true },
      });
      map.current = m;
      m.on('click', (e) => latest.current.onPick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
      // Markers don't need the style: place the pin straight away instead of waiting for tiles.
      show(latest.current.pin, false);
      // The credits ("OpenFreeMap © OpenMapTiles, data from OpenStreetMap") are required by the data licences, so they
      // stay -- but folded behind the (i) button instead of open over the map. Hidden until that fold has happened.
      const foldCredits = () => {
        const el = box.current; if (!el) return;
        const credits = el.querySelector('.maplibregl-ctrl-attrib');
        if (credits?.classList.contains('maplibregl-compact-show')) credits.querySelector<HTMLElement>('.maplibregl-ctrl-attrib-button')?.click();
        el.removeAttribute('data-credits-init');
      };
      box.current.setAttribute('data-credits-init', '1');
      const foldTimer = setTimeout(foldCredits, 4000);
      m.once('idle', () => { clearTimeout(foldTimer); foldCredits(); });
      m.on('idle', () => box.current?.setAttribute('data-map-ready', '1'));
      m.on('error', (e) => console.warn('map error:', e.error?.message ?? e));
    })();
    return () => { gone = true; map.current?.remove(); map.current = null; marker.current = null; };
  }, []);

  useEffect(() => { show(pin, true); }, [pin?.lat, pin?.lng]);

  return (
    <>
      <style>{'[data-credits-init] .maplibregl-ctrl-attrib-inner{display:none!important}'}</style>
      <div ref={box} style={{ height, borderRadius: 20, overflow: 'hidden', background: '#E4E9EF', cursor: onPick ? 'crosshair' : 'default' }} />
    </>
  );
}
