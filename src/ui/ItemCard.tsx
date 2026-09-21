import { Text, View } from 'react-native';
import { C, FONTS, MONO, SHADOW } from '../theme/tokens';
import { Icon } from './Icon';
import { Press } from './Press';
import { Chip } from './bits';

export function ItemCard({ item, onPress }: {
  item: { id: string; title: string; location: string; date: string; status: string; icon: string; by: string };
  onPress: () => void;
}) {
  return (
    <Press style={[{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderRadius: 24, backgroundColor: C.white }, SHADOW.card]}
      scale={0.98} onPress={onPress}>
      <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={item.icon} size={24} color={C.ink} />
      </View>
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
