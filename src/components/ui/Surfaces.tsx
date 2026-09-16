import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing, text } from '@/theme/tokens';

export function Pill({
  text: label,
  tone = 'neutral',
}: {
  text: string;
  tone?: 'lost' | 'found' | 'neutral' | 'resolved';
}) {
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
      <Text style={{ fontFamily: font.bold, fontSize: 11.5, color: t.fg }}>{label}</Text>
    </View>
  );
}

/** Uppercase mono eyebrow above a headline. */
export function Kicker({ children, tone = 'primary' }: { children: string; tone?: 'primary' | 'muted' }) {
  return (
    <Text style={[tone === 'primary' ? text.kicker : text.kickerMuted, { marginBottom: spacing.sm }]}>
      {children.toUpperCase()}
    </Text>
  );
}

/** Rule with a centred mono caption, e.g. OR CONTINUE WITH. */
export function DividerLabel({ children }: { children: string }) {
  return (
    <View style={s.divider}>
      <View style={s.rule} />
      <Text style={[text.kickerMuted, { marginHorizontal: spacing.md }]}>{children.toUpperCase()}</Text>
      <View style={s.rule} />
    </View>
  );
}

/** Inline error banner — far more visible than bare red text. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={s.banner}>
      <Text style={s.bannerIcon}>!</Text>
      <Text style={[text.small, { color: colors.danger, flex: 1 }]}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    ...shadow.field,
  },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  rule: { flex: 1, height: 1, backgroundColor: colors.borderStrong },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerSoft,
    marginBottom: spacing.lg,
  },
  bannerIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: colors.danger,
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 13,
    overflow: 'hidden',
  },
});
