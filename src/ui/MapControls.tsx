import { Text, View } from 'react-native';
import { C, FONTS, GLASS, SHADOW } from '../theme/tokens';
import { Loader } from './Loader';
import { Icon } from './Icon';
import { Press } from './Press';

/** Zoom in / zoom out / my-location buttons floated over the registry map (web and native share them). */
export function MapControls({ onZoomIn, onZoomOut, onLocate, locating }: {
  onZoomIn: () => void; onZoomOut: () => void; onLocate: () => void; locating?: boolean;
}) {
  const btn = { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } as const;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 12, top: 12, gap: 10 }}>
      <View style={[{ borderRadius: 22, overflow: 'hidden', ...GLASS }, SHADOW.card]}>
        <Press style={btn} scale={0.92} onPress={onZoomIn} accessibilityLabel="Zoom in">
          <Icon name="add" size={22} color={C.ink} />
        </Press>
        <View style={{ height: 1, backgroundColor: C.fill }} />
        <Press style={btn} scale={0.92} onPress={onZoomOut} accessibilityLabel="Zoom out">
          <Icon name="remove" size={22} color={C.ink} />
        </Press>
      </View>
      <View style={[{ borderRadius: 22, overflow: 'hidden', ...GLASS }, SHADOW.card]}>
        <Press style={btn} scale={0.92} onPress={onLocate} accessibilityLabel="Centre on my location">
          <Icon name={locating ? 'hourglass_top' : 'my_location'} size={21} color={C.primary} />
        </Press>
      </View>
    </View>
  );
}

/** Covers the map until its first frame is drawn, so users see a loader instead of a blank box. */
export function MapLoadingOverlay() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9EEF3' } as object}>
      <Loader />
      <Text style={{ fontFamily: FONTS[500], fontSize: 13, color: C.muted }}>Loading map…</Text>
    </View>
  );
}
