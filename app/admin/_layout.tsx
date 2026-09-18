import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Loading } from '@/components/ui';
import { TabBar, type TabItem } from '@/components/TabBar';
import { useAuth } from '@/lib/auth';

/**
 * Home · Registry · Review · Members · Forum, in the prototype's order.
 * There is no centre action: the prototype sets `showFab: !admin`, so only
 * members get the report button.
 *
 * Ad placements is a screen, not a tab. The prototype's activeKey map
 * gives the ads screen no tab at all and reaches it from the dashboard's
 * revenue card, which is how this app reaches it too.
 */
const TABS: TabItem[] = [
  { name: 'index', icon: 'grid-outline', label: 'Home' },
  { name: 'registry', icon: 'earth-outline', label: 'Registry' },
  { name: 'moderation', icon: 'flag-outline', label: 'Review' },
  { name: 'members', icon: 'people-outline', label: 'Members' },
  { name: 'forum', icon: 'chatbubbles-outline', label: 'Forum' },
];

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
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} items={TABS} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="registry" />
      <Tabs.Screen name="moderation" />
      <Tabs.Screen name="members" />
      <Tabs.Screen name="forum" />
      <Tabs.Screen name="ads" options={{ href: null }} />
    </Tabs>
  );
}
