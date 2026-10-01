import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import { C } from '../theme/tokens';

/**
 * The app's loader: two dots, each swinging a full turn around a fixed dot at either end.
 * A port of the CSS "l49" loader (4:1 box, one second per cycle, the swing happens in the last 42% of
 * the cycle and the second dot runs half a cycle behind), in the brand colour.
 *
 * `size` is the dot diameter; the loader is 4 dots wide.
 */
export function Loader({ size = 15, color = C.primary }: { size?: number; color?: string }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  // Rest for the first 58% of the cycle, then one full turn. The trailing dot is half a cycle behind, so its
  // turn happens in the first 8% and the 50-100% stretch of the shared clock.
  const lead = t.interpolate({ inputRange: [0, 0.58, 1], outputRange: ['0deg', '0deg', '360deg'] });
  const trail = t.interpolate({ inputRange: [0, 0.08, 0.5, 0.5001, 1], outputRange: ['0deg', '0deg', '-360deg', '0deg', '0deg'] });  // counter-clockwise, like the original's --s:-1
  // Rotate around the neighbouring end dot, 1.5 dot-widths from the moving dot's own centre.
  const pivot = size * 1.5;
  const dot = { position: 'absolute' as const, width: size, height: size, borderRadius: size / 2, backgroundColor: color };
  const w = size * 4;
  // The swinging dots sweep a circle of radius 1.5 dots, so the box leaves that much room above and below.
  const room = pivot;

  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading" style={{ width: w, height: size + room * 2 }}>
      <View style={[dot, { left: 0, top: room }]} />
      <View style={[dot, { right: 0, top: room }]} />
      <Animated.View style={[dot, { left: (w - size) / 2, top: room, transform: [{ translateX: -pivot }, { rotate: lead }, { translateX: pivot }] }]} />
      <Animated.View style={[dot, { left: (w - size) / 2, top: room, transform: [{ translateX: pivot }, { rotate: trail }, { translateX: -pivot }] }]} />
    </View>
  );
}
