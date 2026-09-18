import { Tabs } from 'expo-router';
import React from 'react';
import { TabBar, type TabItem } from '@/components/TabBar';

/**
 * Members get the centre report action, which the prototype places inline
 * between the two halves of the row.
 *
 * The destinations are this app's, not the prototype's: the prototype's
 * member row is Home · Lost · [+] · Found · Forum, reaching Messages from
 * a dashboard action and Profile from the header avatar. Matching that
 * means splitting the registry into separate lost and found routes and
 * moving two screens out of the nav, which is a routing change rather
 * than a tab-bar one.
 */
const TABS: TabItem[] = [
  { name: 'index', icon: 'grid-outline', label: 'Home' },
  { name: 'forum', icon: 'chatbubbles-outline', label: 'Forum' },
  { name: 'inbox', icon: 'mail-outline', label: 'Messages' },
  { name: 'profile', icon: 'person-outline', label: 'Profile' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} items={TABS} fabRoute="report" />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="forum" />
      <Tabs.Screen name="report" options={{ href: null }} />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
