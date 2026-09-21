import { Text, View, useWindowDimensions } from 'react-native';
import { C, FONTS } from '../theme/tokens';

/**
 * The prototype is a 390x844 phone mock. On a phone browser we want full bleed;
 * on a wide screen we keep the mock so the design reads as intended.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const framed = width > 520;

  if (!framed) return <View style={{ flex: 1, backgroundColor: C.bg }}>{children}</View>;

  return (
    <View style={{ flex: 1, backgroundColor: C.shell, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{
        width: 390, height: Math.min(844, height - 48), borderRadius: 46, backgroundColor: C.bg,
        overflow: 'hidden', boxShadow: '0 40px 80px -20px rgba(22,24,31,.35), 0 0 0 1px rgba(22,24,31,.1)',
      }}>
        {children}
      </View>
    </View>
  );
}

/** The mock status bar at the top of the frame. */
export function StatusChrome() {
  return (
    <View style={{
      height: 52, flexShrink: 0, flexDirection: 'row', alignItems: 'flex-end',
      justifyContent: 'space-between', paddingHorizontal: 30, paddingBottom: 8,
      backgroundColor: C.bg, zIndex: 8,
    }}>
      <Text style={{ fontFamily: FONTS[600], fontSize: 13, color: C.ink }}>9:41</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <View style={{ width: 16, height: 9, borderRadius: 2, backgroundColor: C.ink }} />
        <View style={{ width: 12, height: 9, borderRadius: 2, backgroundColor: C.ink }} />
        <View style={{ width: 22, height: 10, borderRadius: 3, borderWidth: 1.5, borderColor: C.ink }} />
      </View>
    </View>
  );
}
