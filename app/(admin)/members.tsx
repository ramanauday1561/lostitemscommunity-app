import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout';
import { Box, Card, Text } from '@/components/primitives';
import { Button, EmptyState, ErrorState, Loading, Pill } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchMembers, setSuspended, type AdminMember } from '@/lib/admin';
import { colors, radius, shadow, spacing, text } from '@/theme/tokens';

export default function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setMembers(await fetchMembers(search));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load members.');
    }
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      load().finally(() => !cancelled && setLoading(false));
    }, search ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [load, search]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function confirmToggle(m: AdminMember) {
    const suspending = !m.is_suspended;
    Alert.alert(
      suspending ? `Suspend @${m.username}?` : `Restore @${m.username}?`,
      suspending
        ? 'They keep read access but cannot post items, threads, replies or messages.'
        : 'They will be able to post again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: suspending ? 'Suspend' : 'Restore',
          style: suspending ? 'destructive' : 'default',
          onPress: async () => {
            if (!user) return;
            setBusyId(m.id);
            try {
              await setSuspended(m, suspending, user.id);
              await load();
            } catch (e) {
              Alert.alert('Could not update', e instanceof Error ? e.message : 'Please try again.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader kicker="Super admin" title="Members" />

      <View style={s.searchRow}>
        <Ionicons name="search" size={18} color={colors.mutedLight} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or username"
          placeholderTextColor={colors.mutedFaint}
          style={s.searchInput}
          autoCapitalize="none"
        />
        {!!search && (
          <Pressable onPress={() => setSearch('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.mutedLight} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <Loading label="Loading members…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void onRefresh()} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.id}
          contentContainerStyle={
            members.length === 0
              ? { flexGrow: 1 }
              : { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 130, gap: spacing.md }
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              title={search ? 'No one matched' : 'No members yet'}
              body={search ? 'Try a shorter search.' : 'Members appear here as they join.'}
            />
          }
          renderItem={({ item }) => {
            const initials = (item.full_name ?? item.username)
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            const isSelf = item.id === user?.id;

            return (
              <Card variant="row" flexDirection="row" alignItems="center" gap="lg">
                <View style={s.avatar}>
                  <Text variant="smallStrong" color="brand">
                    {initials}
                  </Text>
                </View>

                <Box flex={1}>
                  <Box flexDirection="row" alignItems="center" gap="sm">
                    <Text variant="cardTitle" numberOfLines={1}>
                      {item.full_name ?? item.username}
                    </Text>
                    {item.role === 'admin' && <Pill text="Admin" tone="resolved" />}
                  </Box>
                  <Text variant="meta" marginTop="xs">
                    @{item.username} · joined{' '}
                    {new Date(item.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </Text>
                  <Box marginTop="sm" alignSelf="flex-start">
                    <Pill text={item.is_suspended ? 'Suspended' : 'Active'} tone={item.is_suspended ? 'lost' : 'found'} />
                  </Box>
                </Box>

                {/* Guard against an admin locking themselves out. */}
                {!isSelf && (
                  <Button
                    label={item.is_suspended ? 'Restore' : 'Suspend'}
                    variant={item.is_suspended ? 'secondary' : 'danger'}
                    loading={busyId === item.id}
                    onPress={() => confirmToggle(item)}
                    style={{ paddingHorizontal: spacing.lg, height: 42 }}
                  />
                )}
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    height: 52,
    backgroundColor: colors.card,
    borderRadius: radius.field,
    ...shadow.field,
  },
  searchInput: { flex: 1, ...text.input, paddingVertical: 0 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
