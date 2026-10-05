import { Text, View } from 'react-native';
import { C, FONTS, MONO, SHADOW } from '../theme/tokens';
import { PhotoFrame } from './PhotoFrame';
import { Press } from './Press';
import { Chip } from './bits';

export function ItemCard({ item, onPress }: {
  item: { id: string; title: string; location: string; date: string; status: string; icon: string; by: string; photo?: string };
  onPress: () => void;
}) {
  return (
    <Press style={[{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderRadius: 24, backgroundColor: C.white }, SHADOW.card]}
      scale={0.98} onPress={onPress}>
      <PhotoFrame width={60} uri={item.photo} icon={item.icon} label={`Photo of ${item.title}`} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: FONTS[700], fontSize: 14.5, color: C.ink }}>{item.title}</Text>
        <Text numberOfLines={1} style={{ fontFamily: FONTS[400], fontSize: 12, color: C.subtle, marginTop: 3 }}>{item.location}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
          <Text style={{ fontFamily: MONO[500], fontSize: 10, color: C.lighter }}>{item.id}</Text>
          <Text style={{ fontFamily: FONTS[400], fontSize: 11, color: C.lighter }}>· {item.date}</Text>
        </View>
      </View>
      <Chip status={item.status} />
    </Press>
  );
}
