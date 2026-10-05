import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing, Extrapolation, interpolate, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import { C } from '../theme/tokens';

/**
 * The app's loader: two dots, each swinging a full turn around a fixed dot at either end.
 * A port of the CSS "l49" loader (4:1 box, one second per cycle, the swing happens in the last 42% of
 * the cycle and the second dot runs half a cycle behind), in the brand colour. It runs on the UI thread, so
 * it keeps spinning smoothly even while the JS thread is busy handling the request it stands for.
 *
 * `size` is the dot diameter; the loader is 4 dots wide.
 */
export function Loader({ size = 15, color = C.primary }: { size?: number; color?: string }) {
  const t = useSharedValue(0);
  // Rotate around the neighbouring end dot, 1.5 dot-widths from the moving dot's own centre.
  const pivot = size * 1.5;

  useEffect(() => {
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [t]);

  // Rest for the first 58% of the cycle, then one full turn. The trailing dot is half a cycle behind, so its
  // turn happens in the first 8% and the 50-100% stretch of the shared clock.
  const leadStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -pivot }, { rotate: `${interpolate(t.value, [0, 0.58, 1], [0, 0, 360], Extrapolation.CLAMP)}deg` }, { translateX: pivot },
    ],
  }));
  // counter-clockwise, like the original's --s:-1
  const trailStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pivot }, { rotate: `${interpolate(t.value, [0, 0.08, 0.5, 0.5001, 1], [0, 0, -360, 0, 0], Extrapolation.CLAMP)}deg` }, { translateX: -pivot },
    ],
  }));

  const dot = { position: 'absolute' as const, width: size, height: size, borderRadius: size / 2, backgroundColor: color };
  const w = size * 4;
  // The swinging dots sweep a circle of radius 1.5 dots, so the box leaves that much room above and below.
  const room = pivot;

  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading" style={{ width: w, height: size + room * 2 }}>
      <View style={[dot, { left: 0, top: room }]} />
      <View style={[dot, { right: 0, top: room }]} />
      <Animated.View style={[dot, { left: (w - size) / 2, top: room }, leadStyle]} />
      <Animated.View style={[dot, { left: (w - size) / 2, top: room }, trailStyle]} />
    </View>
  );
}
