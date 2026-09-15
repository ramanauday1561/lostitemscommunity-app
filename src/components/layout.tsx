import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Box, Card, Text } from './primitives';
import { colors, radius, shadow, spacing } from '../theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/* ---------------------------------------------------------------
 * Screen header: mono eyebrow over a big title, with circular
 * actions on the right. The prototype puts an unread badge on the
 * messages button.
 * ------------------------------------------------------------- */

export function IconButton({
  icon,
  onPress,
  badge,
}: {
  icon: IconName;
  onPress?: () => void;
  badge?: number;
}) {
  return (
    <Pressable onPress={onPress} style={s.circle} accessibilityRole="button">
      <Ionicons name={icon} size={20} color={colors.ink} />
      {!!badge && badge > 0 && (
        <View style={s.badge}>
          <Text variant="meta" color="white" style={{ fontSize: 10 }}>
            {badge > 9 ? '9+' : String(badge)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function AvatarButton({ initials, onPress }: { initials: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.circle} accessibilityRole="button">
      <Text variant="smallStrong" color="brand">
        {initials}
      </Text>
    </Pressable>
  );
}

export function ScreenHeader({
  kicker,
  title,
  right,
}: {
  kicker: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <Box flexDirection="row" alignItems="flex-start" paddingHorizontal="xl" paddingTop="sm" gap="md">
      <Box flex={1}>
        <Text variant="kickerMuted" marginBottom="xs">
          {kicker.toUpperCase()}
        </Text>
        <Text variant="h1">{title}</Text>
      </Box>
      {!!right && (
        <Box flexDirection="row" gap="sm" marginTop="md">
          {right}
        </Box>
      )}
    </Box>
  );
}

/* ---------------------------------------------------------------
 * Section heading with an optional trailing link.
 * ------------------------------------------------------------- */

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="xl"
      marginTop="xxl"
      marginBottom="md"
    >
      <Text variant="section">{title}</Text>
      {!!actionLabel && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text variant="link">{actionLabel}</Text>
        </Pressable>
      )}
    </Box>
  );
}

/* ---------------------------------------------------------------
 * Item card, as used in the horizontal "Recently handed in" rail.
 * ------------------------------------------------------------- */

export function StatusChip({ label }: { label: string }) {
  return (
    <View style={s.statusChip}>
      <Text variant="smallStrong">{label}</Text>
    </View>
  );
}

export function ItemCard({
  title,
  location,
  meta,
  status,
  icon = 'pricetag-outline',
  width,
  onPress,
}: {
  title: string;
  location?: string | null;
  meta: string;
  status: string;
  icon?: IconName;
  width?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={width ? { width } : undefined}>
      <Card variant="item">
        <Box
          height={132}
          borderRadius="field"
          backgroundColor="tile"
          alignItems="center"
          justifyContent="center"
          marginBottom="md"
        >
          <Ionicons name={icon} size={34} color={colors.mutedFaint} />
          <View style={s.chipOnTile}>
            <StatusChip label={status} />
          </View>
        </Box>

        <Text variant="cardTitle" numberOfLines={1}>
          {title}
        </Text>

        {!!location && (
          <Box flexDirection="row" alignItems="center" gap="xs" marginTop="xs">
            <Ionicons name="location-outline" size={13} color={colors.mutedLight} />
            <Text variant="small" numberOfLines={1} style={{ flexShrink: 1 }}>
              {location}
            </Text>
          </Box>
        )}

        <Text variant="meta" marginTop="sm">
          {meta}
        </Text>
      </Card>
    </Pressable>
  );
}

/** Horizontal rail that bleeds to the screen edges. */
export function CardRail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
    >
      {children}
    </ScrollView>
  );
}

/* ---------------------------------------------------------------
 * Quick-action row: tinted icon tile, title + body, chevron.
 * ------------------------------------------------------------- */

export function IconTile({ icon, tone = 'brand' }: { icon: IconName; tone?: 'brand' | 'ok' | 'danger' }) {
  const bg = tone === 'ok' ? colors.successSoft : tone === 'danger' ? colors.dangerSoft : colors.primarySoft;
  const fg = tone === 'ok' ? colors.success : tone === 'danger' ? colors.danger : colors.primary;
  return (
    <View style={[s.tile, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={22} color={fg} />
    </View>
  );
}

export function ActionRow({
  icon,
  title,
  body,
  tone,
  onPress,
}: {
  icon: IconName;
  title: string;
  body: string;
  tone?: 'brand' | 'ok' | 'danger';
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ marginHorizontal: spacing.xl, marginBottom: spacing.md }}>
      <Card variant="row" flexDirection="row" alignItems="center" gap="lg">
        <IconTile icon={icon} tone={tone} />
        <Box flex={1}>
          <Text variant="cardTitle">{title}</Text>
          <Text variant="small" marginTop="xs">
            {body}
          </Text>
        </Box>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedFaint} />
      </Card>
    </Pressable>
  );
}

const s = StyleSheet.create({
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: '#B42318',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...shadow.card,
  },
  chipOnTile: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  tile: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
