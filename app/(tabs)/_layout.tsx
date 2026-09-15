import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../../src/theme/tokens';

/** The centre action is a raised blue square that sits above the bar. */
function ReportFab({ focused }: { focused: boolean }) {
  return (
    <View style={[s.fab, focused && { backgroundColor: colors.inkSoft }]}>
      <Ionicons name="add" size={28} color={colors.white} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedLight,
        // The prototype's bar floats clear of the screen edge as a rounded
        // white slab rather than sitting flush against the bottom.
        tabBarStyle: s.bar,
        tabBarItemStyle: { paddingTop: spacing.sm },
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 10.5, marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="grid-outline" color={color} size={21} />,
        }}
      />
      <Tabs.Screen
        name="forum"
        options={{
          title: 'Forum',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" color={color} size={21} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <ReportFab focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <Ionicons name="mail-outline" color={color} size={21} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" color={color} size={21} />,
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: Platform.OS === 'ios' ? 28 : 16,
    height: 68,
    borderRadius: radius.cardLarge,
    backgroundColor: colors.card,
    borderTopWidth: 0,
    paddingBottom: 0,
    ...shadow.floating,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    ...shadow.floating,
  },
});
