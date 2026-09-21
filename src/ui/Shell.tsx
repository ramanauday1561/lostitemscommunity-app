import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme/tokens';

/** Breathing room above the header, so content never sits flush against the
 *  top edge now that the prototype's mock status bar is gone. On a phone this
 *  also clears the notch / system status bar. */
const MIN_TOP = 14;

/**
 * The prototype is a 390x844 phone mock. On a phone browser we want full bleed;
 * on a wide screen we keep the mock so the design reads as intended.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const framed = width > 520;
  const top = Math.max(insets.top, MIN_TOP);

  if (!framed) {
    return <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: top }}>{children}</View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.shell, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{
        width: 390, height: Math.min(844, height - 48), borderRadius: 46, backgroundColor: C.bg,
        overflow: 'hidden', paddingTop: MIN_TOP,
        boxShadow: '0 40px 80px -20px rgba(22,24,31,.35), 0 0 0 1px rgba(22,24,31,.1)',
      }}>
        {children}
      </View>
    </View>
  );
}
