import { Text, View } from 'react-native';
import { C, FONTS } from '../theme/tokens';
import { coord, type LatLng } from '../lib/geo';

export interface MapPickerProps {
  pin: LatLng | null;
  onPick?: (at: LatLng) => void;
  height?: number;
}

/** Native fallback: the interactive map is web-only for now, so show the pinned
 *  coordinates (the search box and "Use my location" still set them). */
export function MapPicker({ pin, height = 80 }: MapPickerProps) {
  return (
    <View style={{ height, borderRadius: 20, backgroundColor: C.fillSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, color: C.muted }}>
        {pin ? `Pinned at ${coord(pin.lat)}, ${coord(pin.lng)}` : 'No pin yet'}
      </Text>
    </View>
  );
}
