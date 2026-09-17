import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarButton, IconButton, ScreenHeader, SectionHeader } from '@/components/layout';
import { Box, Card, Text } from '@/components/primitives';
import { Button, ErrorState, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { broadcast, fetchFlags, fetchStats, resolveFlag, type AdminStats, type ModerationFlag } from '@/lib/admin';
import { colors, radius, shadow, spacing } from '@/theme/tokens';

function StatTile({
  icon,
  label,
  value,
  tone = 'brand',
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  tone?: 'brand' | 'ok' | 'danger';
}) {
  const fg = tone === 'ok' ? colors.success : tone === 'danger' ? colors.danger : colors.primary;
  const bg = tone === 'ok' ? colors.successSoft : tone === 'danger' ? colors.dangerSoft : colors.primarySoft;
  return (
    <Card variant="item" flex={1} minWidth={150}>
      <View style={[s.tileIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={fg} />
      </View>
      <Text variant="kickerMuted" marginTop="md">
        {label.toUpperCase()}
      </Text>
      <Text variant="h2" marginTop="xs">
        {value}
      </Text>
    </Card>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { profile, user } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [st, fl] = await Promise.all([fetchStats(), fetchFlags('pending')]);
      setStats(st);
      setFlags(fl.slice(0, 3));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the dashboard.');
    }
  }, []);

  useEffect(() => {
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

  function sendWelcome() {
    Alert.alert(
      'Send a welcome message?',
      'Every active member receives a notification.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              const n = await broadcast(
                'Welcome to Lost Items Community',
                'Say hello in the forum and tell us what you are looking for.',
              );
              Alert.alert('Sent', `Delivered to ${n} member${n === 1 ? '' : 's'}.`);
            } catch (e) {
              Alert.alert('Could not send', e instanceof Error ? e.message : 'Please try again.');
            }
          },
        },
      ],
    );
  }

  if (loading) return <Loading label="Loading control centre…" />;
  if (error || !stats) return <ErrorState message={error ?? 'No data'} onRetry={() => void onRefresh()} />;

  const initials = (profile?.full_name ?? 'SA').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const money = (n: number) => `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <ScreenHeader
          kicker="Super admin"
          title="System control"
          right={
            <>
              <IconButton icon="flag-outline" badge={stats.flags_pending} onPress={() => router.push('/(admin)/moderation')} />
              <AvatarButton initials={initials} onPress={() => router.push('/(tabs)/profile')} />
            </>
          }
        />

        <Pressable onPress={() => router.push('/(admin)/ads')} style={s.revenue}>
          <Card variant="row" flexDirection="row" alignItems="center" gap="lg">
            <View style={[s.tileIcon, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="card-outline" size={18} color={colors.success} />
            </View>
            <Box flex={1}>
              <Text variant="cardTitle">Ad placements &amp; revenue</Text>
              <Text variant="small" marginTop="xs">
                {money(stats.revenue_month)} this month · {stats.campaigns_live} running
              </Text>
            </Box>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedFaint} />
          </Card>
        </Pressable>

        <Box flexDirection="row" flexWrap="wrap" gap="md" paddingHorizontal="xl" marginTop="lg">
          <StatTile icon="search-outline" label="Active lost" value={String(stats.active_lost)} />
          <StatTile icon="cube-outline" label="Recovered" value={String(stats.recovered)} tone="ok" />
          <StatTile icon="people-outline" label="Members" value={String(stats.members)} />
          <StatTile
            icon="flag-outline"
            label="Needs review"
            value={String(stats.flags_pending)}
            tone={stats.flags_pending > 0 ? 'danger' : 'ok'}
          />
        </Box>

        <SectionHeader
          title="Flagged content"
          actionLabel={stats.flags_pending > 3 ? 'See all' : undefined}
          onAction={() => router.push('/(admin)/moderation')}
        />

        {flags.length === 0 ? (
          <Box paddingHorizontal="xl">
            <Card variant="row" alignItems="center">
              <Ionicons name="checkmark-circle-outline" size={26} color={colors.success} />
              <Text variant="cardTitle" marginTop="sm">
                Nothing waiting
              </Text>
              <Text variant="small" marginTop="xs" style={{ textAlign: 'center' }}>
                The moderation queue is clear.
              </Text>
            </Card>
          </Box>
        ) : (
          flags.map((f) => (
            <Box key={f.id} paddingHorizontal="xl" marginBottom="md">
              <Card variant="row">
                <Text variant="meta">
                  {f.items?.short_code ?? (f.thread_id ? 'FORUM' : (f.target_type ?? 'FLAG').toUpperCase())}
                </Text>
                <Text variant="cardTitle" marginTop="xs">
                  {f.items?.title ?? f.forum_threads?.title ?? 'Reported content'}
                </Text>
                <Text variant="small" marginTop="xs">
                  {f.reason}
                </Text>
                <Box flexDirection="row" gap="md" marginTop="lg">
                  <Button
                    label="Approve"
                    variant="secondary"
                    style={{ flex: 1 }}
                    loading={busyId === f.id}
                    onPress={() => decide(f, 'approved')}
                  />
                  <Button
                    label="Remove"
                    variant="danger"
                    style={{ flex: 1 }}
                    loading={busyId === f.id}
                    onPress={() => decide(f, 'removed')}
                  />
                </Box>
              </Card>
            </Box>
          ))
        )}

        <SectionHeader title="Community" />
        <Box paddingHorizontal="xl">
          <Card variant="row">
            <Text variant="cardTitle">{stats.members_today} new members today</Text>
            <Text variant="small" marginTop="xs">
              Send a welcome note to everyone who has joined the recovery network.
            </Text>
            <Button label="Send welcome message" variant="secondary" style={{ marginTop: spacing.lg }} onPress={sendWelcome} />
          </Card>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  revenue: { marginHorizontal: spacing.xl, marginTop: spacing.xl },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
