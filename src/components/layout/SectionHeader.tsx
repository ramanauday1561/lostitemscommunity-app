import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text } from '@/components/primitives';

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
      <Text variant="h3">{title}</Text>
      {!!actionLabel && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text variant="link">{actionLabel}</Text>
        </Pressable>
      )}
    </Box>
  );
}
