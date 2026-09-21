import { Text, View } from 'react-native';
import { C, FONTS, MONO } from '../theme/tokens';
import { Icon } from './Icon';
import { Press } from './Press';

/** In-feed sponsored strip. Rendered only when the slot is live for this role. */
export function AdSlot({ ad }: { ad: { live: boolean; campaign?: string; advertiser?: string; icon?: string } }) {
  if (!ad?.live) return null;
  return (
    <Press style={{
      flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 88, padding: 14,
      borderRadius: 22, backgroundColor: C.white, boxShadow: '0 1px 2px rgba(22,24,31,.05)',
    }} scale={0.99}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.fillSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={ad.icon || 'campaign'} size={22} color={C.muted} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: MONO[600], fontSize: 9, letterSpacing: 1.2, color: C.lighter }}>SPONSORED</Text>
        <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.ink, marginTop: 3 }}>{ad.campaign}</Text>
        <Text style={{ fontFamily: FONTS[400], fontSize: 11.5, color: C.subtle, marginTop: 2 }}>{ad.advertiser}</Text>
      </View>
      <Icon name="chevron_right" size={20} color={C.lighter} />
    </Press>
  );
}
