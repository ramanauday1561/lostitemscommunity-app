import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, font, radius, shadow, spacing } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabItem({ icon, label, focused }: { icon: IconName; label: string; focused: boolean }) {
  return (
    <View style={[s.item, focused && s.itemActive]}>
      <Ionicons name={icon} size={20} color={focused ? colors.primary : colors.mutedLight} />
      <Text style={[s.label, focused && { color: colors.primary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function AdminLayout() {
  const { profile, initialising } = useAuth();

  if (initialising) return <Loading label="Checking permissions…" />;

  // RLS is the real boundary; this only stops a non-admin from seeing
  // screens that would render nothing but errors.
  if (!profile || profile.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: s.bar,
        tabBarItemStyle: { height: '100%', paddingHorizontal: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabItem icon="grid-outline" label="Home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="registry"
        options={{ tabBarIcon: ({ focused }) => <TabItem icon="albums-outline" label="Registry" focused={focused} /> }}
      />
      <Tabs.Screen
        name="moderation"
        options={{ tabBarIcon: ({ focused }) => <TabItem icon="flag-outline" label="Review" focused={focused} /> }}
      />
      <Tabs.Screen
        name="members"
        options={{ tabBarIcon: ({ focused }) => <TabItem icon="people-outline" label="Members" focused={focused} /> }}
      />
      <Tabs.Screen
        name="ads"
        options={{ tabBarIcon: ({ focused }) => <TabItem icon="megaphone-outline" label="Ads" focused={focused} /> }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: Platform.OS === 'ios' ? 30 : 18,
    height: 72,
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: radius.cardLarge,
    backgroundColor: colors.card,
    borderTopWidth: 0,
    ...shadow.floating,
  },
  // Same fix as the member bar: minWidth 58 plus 8pt either side asked for
  // 74 where only about 62 exists on a narrow phone.
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginHorizontal: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.field,
  },
  itemActive: { backgroundColor: colors.bgAlt },
  label: { fontFamily: font.semibold, fontSize: 10, color: colors.mutedLight, flexShrink: 0 },
});
