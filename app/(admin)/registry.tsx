import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout';
import { Box, Card, Text } from '@/components/primitives';
import { EmptyState, ErrorState, Loading, Pill } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { ItemKind, ItemWithCategory } from '@/lib/database.types';
import { shortDate } from '@/lib/format';
import { colors, radius, shadow, spacing } from '@/theme/tokens';

type StatusFilter = 'all' | 'active' | 'resolved' | 'flagged' | 'removed';

const KINDS: { key: ItemKind; label: string }[] = [
  { key: 'lost', label: 'Lost items' },
  { key: 'found', label: 'Found items' },
];
const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'removed', label: 'Removed' },
];

const SELECT =
  'id,short_code,reporter_id,kind,title,description,category_id,location_text,latitude,longitude,date_occurred,status,moderation_status,flagged_count,created_at,updated_at,categories(id,name,icon)';

export default function AdminRegistry() {
  const [kind, setKind] = useState<ItemKind>('lost');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [items, setItems] = useState<ItemWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    let q = supabase.from('items').select(SELECT).eq('kind', kind).order('created_at', { ascending: false }).limit(100);

    // Admins see removed content too — that is the point of this screen.
    if (filter === 'active') q = q.eq('status', 'active');
    else if (filter === 'resolved') q = q.eq('status', 'resolved');
    else if (filter === 'removed') q = q.eq('status', 'removed');
    else if (filter === 'flagged') q = q.gt('flagged_count', 0);

    const { data, error: err } = await q;
    if (err) setError(err.message);
    else setItems((data ?? []) as unknown as ItemWithCategory[]);
  }, [kind, filter]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader kicker="Registry" title={kind === 'lost' ? 'Lost items' : 'Found items'} />

      <Box flexDirection="row" gap="sm" paddingHorizontal="xl" marginTop="xl">
        {KINDS.map((k) => (
          <Pressable key={k.key} onPress={() => setKind(k.key)} style={[s.seg, kind === k.key && s.segActive]}>
            <Text variant="smallStrong" color={kind === k.key ? 'white' : 'muted'}>
              {k.label}
            </Text>
          </Pressable>
        ))}
      </Box>

      <Box flexDirection="row" flexWrap="wrap" gap="sm" paddingHorizontal="xl" paddingTop="md">
        {FILTERS.map((f) => (
          <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[s.chip, filter === f.key && s.chipActive]}>
            <Text variant="small" color={filter === f.key ? 'white' : 'muted'} style={{ fontSize: 12.5 }}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </Box>

      {loading ? (
        <Loading label="Loading registry…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void onRefresh()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={
            items.length === 0
              ? { flexGrow: 1 }
              : { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 130, gap: spacing.md }
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState title="Nothing here" body="No items match this filter." />}
          renderItem={({ item }) => (
            <Card variant="row">
              <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                <Text variant="meta">{item.short_code}</Text>
                <Box flexDirection="row" gap="sm">
                  {item.flagged_count > 0 && <Pill text={`${item.flagged_count} flag`} tone="lost" />}
                  <Pill
                    text={item.status === 'removed' ? 'Removed' : item.status === 'resolved' ? 'Resolved' : 'Active'}
                    tone={item.status === 'removed' ? 'lost' : item.status === 'resolved' ? 'resolved' : 'found'}
                  />
                </Box>
              </Box>
              <Text variant="cardTitle" marginTop="sm" numberOfLines={1}>
                {item.title}
              </Text>
              {!!item.location_text && (
                <Text variant="small" marginTop="xs" numberOfLines={1}>
                  {item.location_text}
                </Text>
              )}
              <Text variant="meta" marginTop="sm">
                {item.categories?.name ?? 'Uncategorised'} ·{' '}
                {shortDate(item.created_at)}
              </Text>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  seg: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.field,
    backgroundColor: colors.card,
    ...shadow.field,
  },
  segActive: { backgroundColor: colors.ink },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...shadow.field,
  },
  chipActive: { backgroundColor: colors.primary },
});
