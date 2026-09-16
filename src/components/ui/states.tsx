import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, text } from '@/theme/tokens';
import { Button } from './Button';
import { Kicker } from './Surfaces';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={s.centre}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[text.small, { marginTop: spacing.md }]}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={s.centre}>
      <Text style={text.h3}>Something went wrong</Text>
      <Text style={[text.small, s.centred]}>{message}</Text>
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
      <Text style={[text.h3, { textAlign: 'center' }]}>{title}</Text>
      {!!body && <Text style={[text.small, s.centred]}>{body}</Text>}
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
      <Text style={[text.h2, { textAlign: 'center' }]}>{name}</Text>
      <Text style={[text.small, s.centred]}>
        Not built yet. Open the Screen Implementation tab in the management hub and press ▶ on this screen to generate
        its build prompt.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  centred: { textAlign: 'center', marginTop: spacing.sm },
});
