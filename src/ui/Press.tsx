import { useState } from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING } from './motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The prototype puts `style-active` on nearly every button -- a scale-down plus
 * a background shift on press. This reproduces that feedback everywhere, with a spring so the release
 * settles back instead of snapping.
 */
export function Press({
  style, scale = 0.96, activeBg, disabled, children, onPressIn, onPressOut, ...rest
}: PressableProps & {
  style?: StyleProp<ViewStyle>; scale?: number; activeBg?: string; disabled?: boolean;
  /** Reanimated entering animation, e.g. `rise(2)`. */
  entering?: React.ComponentProps<typeof AnimatedPressable>['entering'];
}) {
  const p = useSharedValue(1);
  const [down, setDown] = useState(false);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: p.value }] }));
  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={(e: GestureResponderEvent) => {
        if (!disabled) { p.value = withSpring(scale, SPRING); if (activeBg) setDown(true); }
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        p.value = withSpring(1, SPRING);
        if (activeBg) setDown(false);
        onPressOut?.(e);
      }}
      style={[style, down && activeBg ? { backgroundColor: activeBg } : null, anim]}
      {...rest}
    >
      {children as React.ReactNode}
    </AnimatedPressable>
  );
}
