import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, radius, shadow, size, spacing, text } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const off = disabled || loading;
  const solid = variant === 'primary' || variant === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        s.base,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'danger' && { backgroundColor: colors.danger },
        variant === 'secondary' && { backgroundColor: colors.card, ...shadow.field },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        // Disabled solid buttons go flat grey, matching the prototype,
        // rather than a faded blue that still reads as tappable.
        off && solid && { backgroundColor: colors.fieldIdle },
        pressed && !off && solid && { backgroundColor: '#095AAD' },
        pressed && !off && !solid && { opacity: 0.85 },
        off && !solid && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={solid ? colors.mutedLight : colors.ink} />
      ) : (
        <Text
          style={[
            text.button,
            { color: solid ? colors.white : colors.ink },
            variant === 'ghost' && { color: colors.primary },
            off && solid && { color: colors.mutedLight },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    height: size.button,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
});
