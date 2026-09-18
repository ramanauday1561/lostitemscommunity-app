import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout';
import { Box, Card, Text } from '@/components/primitives';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchFlags, fetchStats, resolveFlag, type FlagStatus, type ModerationFlag } from '@/lib/admin';
import { shortDate } from '@/lib/format';
import { colors, radius, shadow, spacing } from '@/theme/tokens';

const TABS: { key: FlagStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'removed', label: 'Removed' },
];

export default function Moderation() {
  const { user } = useAuth();
  const [tab, setTab] = useState<FlagStatus>('pending');
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, removed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [rows, st] = await Promise.all([fetchFlags(tab), fetchStats()]);
      setFlags(rows);
      setCounts({ pending: st.flags_pending, approved: st.flags_approved, removed: st.flags_removed });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the queue.');
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function decide(flag: ModerationFlag, decision: 'approved' | 'removed') {
    if (!user) return;
    setBusyId(flag.id);
    try {
      await resolveFlag(flag, decision, user.id);
      await load();
    } catch (e) {
      Alert.alert('Could not update', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader kicker="Super admin" title="Moderation" />

      <Box flexDirection="row" gap="sm" paddingHorizontal="xl" marginTop="xl">
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={[s.tab, tab === t.key && s.tabActive]}>
            <Text variant="h2" color={tab === t.key ? 'white' : 'ink'} style={{ fontSize: 18 }}>
              {counts[t.key]}
            </Text>
            <Text variant="small" color={tab === t.key ? 'white' : 'muted'} style={{ fontSize: 11.5 }}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </Box>

      {loading ? (
        <Loading label="Loading queue…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void onRefresh()} />
      ) : (
        <FlatList
          data={flags}
          keyExtractor={(f) => f.id}
          contentContainerStyle={
            flags.length === 0
              ? { flexGrow: 1 }
              : { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 130, gap: spacing.md }
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              title={tab === 'pending' ? 'Queue is clear' : `Nothing ${tab}`}
              body={
                tab === 'pending'
                  ? 'No content is waiting for review right now.'
                  : `No flags have been ${tab} yet.`
              }
            />
          }
          renderItem={({ item }) => (
            <Card variant="row">
              <Box flexDirection="row" alignItems="center" gap="sm">
                <Ionicons
                  name={item.item_id ? 'pricetag-outline' : item.profile_id ? 'person-outline' : 'chatbubbles-outline'}
                  size={14}
                  color={colors.mutedLight}
                />
                <Text variant="meta">
                  {item.items?.short_code ?? (item.target_type ?? 'flag').replace('_', ' ').toUpperCase()}
                  {!!item.forum_threads?.topic && ` · ${item.forum_threads.topic}`}
                </Text>
              </Box>

              <Text variant="cardTitle" marginTop="sm">
                {item.items?.title ?? item.forum_threads?.title ?? 'Reported content'}
              </Text>
              <Text variant="small" marginTop="xs">
                {item.reason}
              </Text>
              <Text variant="meta" marginTop="sm">
                {item.flagged_by ? 'Reported by a member' : 'Flagged automatically'} ·{' '}
                {shortDate(item.created_at)}
              </Text>

              {item.status === 'pending' && (
                <Box flexDirection="row" gap="md" marginTop="lg">
                  <Button
                    label="Approve"
                    variant="secondary"
                    style={{ flex: 1 }}
                    loading={busyId === item.id}
                    onPress={() => decide(item, 'approved')}
                  />
                  <Button
                    label="Remove"
                    variant="danger"
                    style={{ flex: 1 }}
                    loading={busyId === item.id}
                    onPress={() => decide(item, 'removed')}
                  />
                </Box>
              )}
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.field,
    backgroundColor: colors.card,
    ...shadow.field,
  },
  tabActive: { backgroundColor: colors.ink },
});
