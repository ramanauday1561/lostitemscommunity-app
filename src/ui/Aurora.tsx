import { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { C } from '../theme/tokens';

function Orb({ color, size, left, top, dx, dy, ms }: {
  color: string; size: number; left: number | string; top: number | string; dx: number; dy: number; ms: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: ms, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(t);
  }, [t, ms]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: t.value * dx }, { translateY: t.value * dy }] }));
  return (
    <Animated.View pointerEvents="none" style={[{
      position: 'absolute', left, top, width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, boxShadow: `0 0 ${size * 0.6}px ${size * 0.35}px ${color}`,
    } as object, style]} />
  );
}

/**
 * Soft drifting colour behind the sign-in screens, so the glass inputs have something to be glass over.
 * Only transforms animate (no blur), so it stays cheap on every platform.
 */
export function Aurora({ tint = C.primary }: { tint?: string }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' } as object}>
      <LinearGradient colors={['#F7F8FB', C.bg, '#EEF3FA']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ position: 'absolute', inset: 0 } as object} />
      <Orb color={tint + '33'} size={220} left={-70} top={-40} dx={40} dy={30} ms={7000} />
      <Orb color="rgba(0,227,155,.16)" size={180} left="62%" top="38%" dx={-36} dy={44} ms={9000} />
      <Orb color="rgba(255,176,102,.2)" size={200} left="-20%" top="72%" dx={50} dy={-30} ms={8000} />
    </View>
  );
}

/** Full-screen aurora behind a sign-in style screen's content. */
export function Backdrop({ children, tint }: { children: React.ReactNode; tint?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Aurora tint={tint} />
      {children}
    </View>
  );
}
