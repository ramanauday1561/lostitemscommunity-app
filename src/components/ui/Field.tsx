import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, radius, shadow, size, spacing, text } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type FieldProps = TextInputProps & {
  label?: string;
  icon?: IconName;
  error?: string | null;
  /** Adds a show/hide toggle and starts masked. */
  secure?: boolean;
  containerStyle?: ViewStyle;
};

export function Field({ label, icon, error, secure, style, containerStyle, multiline, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const accent = error ? colors.danger : focused ? colors.primary : colors.mutedFaint;

  return (
    <View style={[{ marginBottom: spacing.lg }, containerStyle]}>
      {!!label && <Text style={s.label}>{label}</Text>}

      <View
        style={[
          s.shell,
          multiline && { height: 120, alignItems: 'flex-start', paddingTop: spacing.lg },
          // A visible focus ring is the difference between a form that feels
          // responsive and one that feels dead.
          { borderColor: error ? colors.danger : focused ? colors.primary : 'transparent' },
        ]}
      >
        {!!icon && <Ionicons name={icon} size={19} color={accent} style={{ marginRight: spacing.md }} />}

        <TextInput
          placeholderTextColor={colors.mutedFaint}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secure && !revealed}
          multiline={multiline}
          style={[s.input, multiline && { height: '100%', textAlignVertical: 'top' }, style]}
          {...rest}
        />

        {secure && (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.mutedLight} />
          </Pressable>
        )}
      </View>

      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  label: { ...text.smallStrong, marginBottom: spacing.sm, marginLeft: spacing.xs },
  shell: {
    minHeight: size.field,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.field,
    borderWidth: 1.5,
    paddingHorizontal: spacing.xl,
    ...shadow.field,
  },
  input: {
    flex: 1,
    ...text.input,
    paddingVertical: 0,
    // react-native-web renders a real <input>, which draws the browser's
    // focus outline on top of our own focus ring. Native ignores this.
    // `outlineStyle` is web-only and absent from React Native's TextStyle.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null),
  },
  error: { ...text.small, color: colors.danger, marginTop: spacing.xs, marginLeft: spacing.xs },
});
