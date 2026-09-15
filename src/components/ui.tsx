import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, font, radius, shadow, size, spacing, text } from '../theme/tokens';

/* ---------------- Text ---------------- */

type Variant = keyof typeof text;

export function Text({
  variant = 'body',
  style,
  children,
  numberOfLines,
}: {
  variant?: Variant;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
  numberOfLines?: number;
}) {
  return (
    <RNText style={[text[variant] as TextStyle, style]} numberOfLines={numberOfLines}>
      {children}
    </RNText>
  );
}

/** Uppercase mono eyebrow above a headline. */
export function Kicker({ children, tone = 'primary' }: { children: string; tone?: 'primary' | 'muted' }) {
  return (
    <RNText style={[(tone === 'primary' ? text.kicker : text.kickerMuted) as TextStyle, { marginBottom: spacing.sm }]}>
      {children.toUpperCase()}
    </RNText>
  );
}

/* ---------------- Button ---------------- */

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const off = disabled || loading;
  const solid = variant === 'primary' || variant === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        s.btn,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'danger' && { backgroundColor: colors.danger },
        variant === 'secondary' && { backgroundColor: colors.card, ...shadow.field },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        // The prototype's disabled primary is a flat grey field, not a faded blue.
        off && solid && { backgroundColor: colors.fieldIdle },
        pressed && !off && { opacity: 0.88 },
        off && !solid && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={solid ? colors.mutedLight : colors.ink} />
      ) : (
        <RNText
          style={[
            text.button as TextStyle,
            { color: solid ? colors.white : colors.ink },
            variant === 'ghost' && { color: colors.primary },
            off && solid && { color: colors.mutedLight },
          ]}
        >
          {label}
        </RNText>
      )}
    </Pressable>
  );
}

/* ---------------- Field ---------------- */

type FieldProps = TextInputProps & {
  /** Optional leading glyph, as in the prototype's login fields. */
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Most prototype fields rely on the placeholder; a label is opt-in. */
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
};

export function Field({ icon, label, error, style, containerStyle, multiline, ...rest }: FieldProps) {
  return (
    <View style={[{ marginBottom: spacing.md }, containerStyle]}>
      {!!label && <RNText style={[text.smallStrong as TextStyle, { marginBottom: spacing.sm }]}>{label}</RNText>}
      <View
        style={[
          s.field,
          multiline && { height: 120, alignItems: 'flex-start', paddingTop: spacing.lg },
          !!error && { borderWidth: 1, borderColor: colors.danger },
        ]}
      >
        {!!icon && <Ionicons name={icon} size={19} color={colors.mutedFaint} style={{ marginRight: spacing.md }} />}
        <TextInput
          placeholderTextColor={colors.mutedFaint}
          multiline={multiline}
          style={[s.input, multiline && { height: '100%', textAlignVertical: 'top' }, style]}
          {...rest}
        />
      </View>
      {!!error && (
        <RNText style={[text.small as TextStyle, { color: colors.danger, marginTop: spacing.xs }]}>{error}</RNText>
      )}
    </View>
  );
}

/* ---------------- Surfaces ---------------- */

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Pill({ text: label, tone = 'neutral' }: { text: string; tone?: 'lost' | 'found' | 'neutral' | 'resolved' }) {
  const t =
    tone === 'lost'
      ? { bg: colors.dangerSoft, fg: colors.danger }
      : tone === 'found'
        ? { bg: colors.successSoft, fg: colors.success }
        : tone === 'resolved'
          ? { bg: colors.primarySoft, fg: colors.primary }
          : { bg: colors.card, fg: colors.ink };

  return (
    <View style={[s.pill, { backgroundColor: t.bg }]}>
      <RNText style={{ fontFamily: font.bold, fontSize: 11.5, color: t.fg }}>{label}</RNText>
    </View>
  );
}

/** Divider with a centred mono caption, as used between login sections. */
export function DividerLabel({ children }: { children: string }) {
  return (
    <View style={s.dividerRow}>
      <View style={s.rule} />
      <RNText style={[text.kickerMuted as TextStyle, { marginHorizontal: spacing.md }]}>{children.toUpperCase()}</RNText>
      <View style={s.rule} />
    </View>
  );
}

/* ---------------- States ---------------- */

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={s.centre}>
      <ActivityIndicator color={colors.primary} />
      <RNText style={[text.small as TextStyle, { marginTop: spacing.md }]}>{label}</RNText>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={s.centre}>
      <RNText style={text.h3 as TextStyle}>Something went wrong</RNText>
      <RNText style={[text.small as TextStyle, { textAlign: 'center', marginTop: spacing.sm }]}>{message}</RNText>
      {!!onRetry && <Button label="Try again" variant="secondary" onPress={onRetry} style={{ marginTop: spacing.xl }} />}
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
      <RNText style={[text.h3 as TextStyle, { textAlign: 'center' }]}>{title}</RNText>
      {!!body && <RNText style={[text.small as TextStyle, { textAlign: 'center', marginTop: spacing.sm }]}>{body}</RNText>}
      {!!action && (
        <Button label={action.label} variant="secondary" onPress={action.onPress} style={{ marginTop: spacing.xl }} />
      )}
    </View>
  );
}

export function ScreenPlaceholder({ name, phase }: { name: string; phase: string }) {
  return (
    <View style={[s.centre, { backgroundColor: colors.bg }]}>
      <Kicker tone="muted">{phase}</Kicker>
      <RNText style={[text.h2 as TextStyle, { textAlign: 'center' }]}>{name}</RNText>
      <RNText style={[text.small as TextStyle, { textAlign: 'center', marginTop: spacing.sm }]}>
        Not built yet. Open the Screen Implementation tab in the management hub and press ▶ on this screen to generate
        its build prompt.
      </RNText>
    </View>
  );
}

const s = StyleSheet.create({
  btn: {
    height: size.button,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  field: {
    minHeight: size.field,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.field,
    paddingHorizontal: spacing.xl,
    ...shadow.field,
  },
  input: { flex: 1, ...text.input, paddingVertical: 0 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadow.card,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    ...shadow.field,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  rule: { flex: 1, height: 1, backgroundColor: colors.borderStrong },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
});
