import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * Frosted-glass surface.
 *
 * The cheap part of glass (a translucent fill, a light rim and a soft shadow) is always applied. The expensive
 * part, a live backdrop blur, is opt-in via `blur` and only used on iOS and the web: on Android a live blur is
 * costly and uneven across devices, so there the surface keeps a slightly denser translucent fill instead.
 * Use `blur` only on a few large surfaces that sit over real content (sheets, toasts), never per input.
 */
export function Glass({
  children, style, radius = 24, tint = 'light', blur = false, intensity = 40,
}: {
  children?: React.ReactNode; style?: StyleProp<ViewStyle>; radius?: number;
  tint?: 'light' | 'dark'; blur?: boolean; intensity?: number;
}) {
  const live = blur && Platform.OS !== 'android';
  const dark = tint === 'dark';
  const fill = dark
    ? (live ? 'rgba(22,24,31,.55)' : 'rgba(22,24,31,.9)')
    : (live ? 'rgba(255,255,255,.55)' : Platform.OS === 'android' && blur ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.62)');
  const rim = dark ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.85)';
  return (
    <View style={[{
      borderRadius: radius, overflow: 'hidden', backgroundColor: fill,
      borderWidth: 1, borderColor: rim,
      boxShadow: dark ? '0 18px 40px -18px rgba(16,19,25,.7)' : '0 1px 2px rgba(22,24,31,.04), 0 12px 28px -20px rgba(22,24,31,.35)',
    }, style]}>
      {live ? <BlurView intensity={intensity} tint={dark ? 'dark' : 'light'} style={{ position: 'absolute', inset: 0 } as object} /> : null}
      {children}
    </View>
  );
}
