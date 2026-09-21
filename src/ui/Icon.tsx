import { Text, type TextStyle } from 'react-native';
import { ICON_FONT } from '../theme/tokens';

/** Material Symbols Rounded glyph, addressed by ligature name as in the prototype. */
export function Icon({ name, size = 22, color, style }: {
  name: string; size?: number; color?: string; style?: TextStyle;
}) {
  return (
    <Text
      selectable={false}
      style={[{ fontFamily: ICON_FONT, fontSize: size, lineHeight: size * 1.02, color }, style]}
    >
      {name}
    </Text>
  );
}
