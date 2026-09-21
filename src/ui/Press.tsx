import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

/**
 * The prototype puts `style-active` on nearly every button -- a scale-down plus
 * a background shift on press. This reproduces that feedback everywhere.
 */
export function Press({
  style, scale = 0.96, activeBg, disabled, children, ...rest
}: PressableProps & {
  style?: StyleProp<ViewStyle>; scale?: number; activeBg?: string; disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        style,
        pressed && !disabled ? { transform: [{ scale }], ...(activeBg ? { backgroundColor: activeBg } : null) } : null,
      ]}
      {...rest}
    >
      {children as React.ReactNode}
    </Pressable>
  );
}
