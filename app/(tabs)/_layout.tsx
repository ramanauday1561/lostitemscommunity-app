import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * The prototype highlights the active tab with a filled pill behind the
 * icon and label, rather than tinting the icon alone. Labels are drawn
 * inside the pill, so the built-in label is switched off.
 */
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

/** Centre action: a raised blue square that breaks the bar's top edge. */
function ReportFab() {
  return (
    <View style={s.fab}>
      <Ionicons name="add" size={30} color={colors.white} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: s.bar,
        // No explicit item height: an item shorter than the bar is drawn
        // against its top edge rather than centred in it.
        tabBarItemStyle: { height: '100%', paddingHorizontal: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabItem icon="grid-outline" label="Home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="forum"
        options={{ tabBarIcon: ({ focused }) => <TabItem icon="people-outline" label="Forum" focused={focused} /> }}
      />
      <Tabs.Screen name="report" options={{ tabBarIcon: () => <ReportFab /> }} />
      <Tabs.Screen
        name="inbox"
        options={{ tabBarIcon: ({ focused }) => <TabItem icon="mail-outline" label="Messages" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabItem icon="person-outline" label="Profile" focused={focused} /> }}
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
  // Five tabs share (screenWidth - 2 * spacing.lg), so each gets about
  // 62px on a 340pt phone. A minWidth of 62 plus 12pt of padding either
  // side demanded 86 and overflowed the slot, which is what pushed the
  // row out of alignment - worse the narrower the screen. The item now
  // fills whatever width it is given instead of asking for its own.
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginHorizontal: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.field,
  },
  itemActive: { backgroundColor: colors.bgAlt },
  label: { fontFamily: font.semibold, fontSize: 10.5, color: colors.mutedLight, flexShrink: 0 },
  // 58 tall plus 18 of bottom margin came to 76 inside a 72 bar, so the
  // raised centre action overflowed and dragged the other items down with
  // it. translateY lifts it above the bar's edge without taking part in
  // layout, so the row's height is unaffected.
  fab: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -12 }],
    ...shadow.floating,
  },
});
