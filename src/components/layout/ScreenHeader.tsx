import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Box, Text } from '@/components/primitives';
import { colors, shadow } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function IconButton({ icon, onPress, badge }: { icon: IconName; onPress?: () => void; badge?: number }) {
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
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
});
