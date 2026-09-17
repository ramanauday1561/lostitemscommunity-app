import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Box, Card, Text } from '@/components/primitives';
import { colors, spacing } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Tone = 'brand' | 'ok' | 'danger';

export function IconTile({ icon, tone = 'brand' }: { icon: IconName; tone?: Tone }) {
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
  tone?: Tone;
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
  tile: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
