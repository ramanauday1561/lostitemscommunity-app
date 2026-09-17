import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Box, Card, Text } from '@/components/primitives';
import { colors, radius, shadow, spacing } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function StatusChip({ label }: { label: string }) {
  return (
    <View style={s.chip}>
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

const s = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...shadow.card,
  },
  chipOnTile: { position: 'absolute', top: spacing.sm, left: spacing.sm },
});
