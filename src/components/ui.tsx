import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, radius, shadow, spacing, type } from '../theme/tokens';

/* ---------------- Button ---------------- */

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.btn,
        variant === 'primary' && s.btnPrimary,
        variant === 'secondary' && s.btnSecondary,
        variant === 'ghost' && s.btnGhost,
        variant === 'danger' && s.btnDanger,
        pressed && !isDisabled && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.white : colors.ink} />
      ) : (
        <Text
          style={[
            s.btnLabel,
            (variant === 'primary' || variant === 'danger') && { color: colors.white },
            variant === 'ghost' && { color: colors.primary },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/* ---------------- Field ---------------- */

type FieldProps = TextInputProps & { label: string; error?: string | null };

export function Field({ label, error, style, ...rest }: FieldProps) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.mutedFaint}
        style={[s.input, !!error && { borderColor: colors.danger }, style]}
        {...rest}
      />
      {!!error && <Text style={s.fieldError}>{error}</Text>}
    </View>
  );
}

/* ---------------- Card ---------------- */

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

/* ---------------- Pill / badge ---------------- */

export function Pill({ text, tone = 'neutral' }: { text: string; tone?: 'lost' | 'found' | 'neutral' | 'resolved' }) {
  const toneStyle =
    tone === 'lost'
      ? { bg: colors.dangerSoft, fg: colors.danger }
      : tone === 'found'
        ? { bg: colors.successSoft, fg: colors.success }
        : tone === 'resolved'
          ? { bg: colors.primarySoft, fg: colors.primary }
          : { bg: colors.bgAlt, fg: colors.muted };

  return (
    <View style={[s.pill, { backgroundColor: toneStyle.bg }]}>
      <Text style={[s.pillText, { color: toneStyle.fg }]}>{text}</Text>
    </View>
  );
}

/* ---------------- States ---------------- */

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={s.centre}>
      <ActivityIndicator color={colors.primary} />
      <Text style={s.centreText}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={s.centre}>
      <Text style={s.centreTitle}>Something went wrong</Text>
      <Text style={s.centreText}>{message}</Text>
      {!!onRetry && <Button label="Try again" variant="secondary" onPress={onRetry} style={{ marginTop: spacing.lg }} />}
    </View>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={s.centre}>
      <Text style={s.centreTitle}>{title}</Text>
      {!!body && <Text style={s.centreText}>{body}</Text>}
      {!!action && (
        <Button label={action.label} variant="secondary" onPress={action.onPress} style={{ marginTop: spacing.lg }} />
      )}
    </View>
  );
}

/* ---------------- Placeholder for unbuilt screens ---------------- */

export function ScreenPlaceholder({ name, phase }: { name: string; phase: string }) {
  return (
    <View style={[s.centre, { backgroundColor: colors.bg }]}>
      <Text style={s.centreTitle}>{name}</Text>
      <Text style={s.centreText}>
        Not built yet — {phase}.{'\n'}Open the Screen Implementation tab in the management hub and press ▶ on this
        screen to generate its build prompt.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  btn: {
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong },
  btnGhost: { backgroundColor: 'transparent' },
  btnDanger: { backgroundColor: colors.danger },
  btnLabel: { fontSize: type.bodyStrong.fontSize, fontWeight: '700', color: colors.ink },

  fieldLabel: {
    fontSize: type.small.fontSize,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: type.body.fontSize,
    color: colors.ink,
  },
  fieldError: { color: colors.danger, fontSize: type.small.fontSize, marginTop: spacing.xs },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    ...shadow.card,
  },

  pill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: type.tiny.fontSize, fontWeight: '800', letterSpacing: 0.4 },

  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  centreTitle: { fontSize: type.h3.fontSize, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  centreText: { fontSize: type.small.fontSize, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
