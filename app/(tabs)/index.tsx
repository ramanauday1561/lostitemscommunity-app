import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text as RNText, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, ErrorState, Kicker, Loading, Pill, Text } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { supabase } from '../../src/lib/supabase';
import type { ItemKind, ItemWithCategory } from '../../src/lib/database.types';
import { colors, radius, shadow, spacing, text } from '../../src/theme/tokens';

type Filter = 'all' | ItemKind;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'lost', label: 'Lost' },
  { key: 'found', label: 'Found' },
];

const SELECT =
  'id,short_code,reporter_id,kind,title,description,category_id,location_text,latitude,longitude,date_occurred,status,moderation_status,flagged_count,created_at,updated_at,categories(id,name,icon)';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Registry() {
  const router = useRouter();
  const { profile } = useAuth();

  const [items, setItems] = useState<ItemWithCategory[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setError(null);
    let query = supabase
      .from('items')
      .select(SELECT)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (filter !== 'all') query = query.eq('kind', filter);

    const term = search.trim();
    if (term) {
      const safe = term.replace(/[,()*]/g, ' ').trim();
      if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%,short_code.ilike.%${safe}%`);
    }

    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
      setItems([]);
    } else {
      setItems((data ?? []) as unknown as ItemWithCategory[]);
    }
  }, [filter, search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      fetchItems().finally(() => {
        if (!cancelled) setLoading(false);
      });
    }, search ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [fetchItems, search]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }

  const name = profile?.full_name ?? profile?.username ?? 'Member';
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Kicker tone="muted">Community member</Kicker>
          <Text variant="h1">My dashboard</Text>
        </View>
        <View style={s.avatar}>
          <RNText style={s.avatarText}>{initials}</RNText>
        </View>
      </View>

      <View style={s.searchRow}>
        <Ionicons name="search" size={18} color={colors.mutedLight} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search the registry"
          placeholderTextColor={colors.mutedFaint}
          style={s.searchInput}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {!!search && (
          <Pressable onPress={() => setSearch('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.mutedLight} />
          </Pressable>
        )}
      </View>

      <View style={s.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[s.chip, filter === f.key && s.chipActive]}
          >
            <RNText style={[s.chipText, filter === f.key && { color: colors.white }]}>{f.label}</RNText>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <Loading label="Fetching the registry…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void onRefresh()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={
            items.length === 0
              ? { flexGrow: 1 }
              : { paddingHorizontal: spacing.xl, paddingBottom: 120, gap: spacing.md }
          }
          ListHeaderComponent={
            items.length ? (
              <View style={s.sectionRow}>
                <Text variant="h3">Recently handed in</Text>
              </View>
            ) : null
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              title={search ? 'Nothing matched that' : 'The registry is empty'}
              body={
                search
                  ? 'Try a shorter search, or clear it to see everything.'
                  : 'Be the first to post. Anything reported here shows up for the whole community.'
              }
              action={{ label: 'Report an item', onPress: () => router.push('/(tabs)/report') }}
            />
          }
          renderItem={({ item }) => (
            <Pressable style={s.card} onPress={() => router.push(`/item/${item.id}`)}>
              <View style={s.thumb}>
                <Ionicons name="pricetag-outline" size={26} color={colors.mutedFaint} />
                <View style={s.chipOnThumb}>
                  <Pill text={item.kind === 'lost' ? 'Lost' : 'Found'} tone={item.kind} />
                </View>
              </View>

              <Text variant="cardTitle" numberOfLines={1}>
                {item.title}
              </Text>

              {!!item.location_text && (
                <View style={s.locRow}>
                  <Ionicons name="location-outline" size={13} color={colors.mutedLight} />
                  <RNText style={[text.small, { flexShrink: 1 }]} numberOfLines={1}>
                    {item.location_text}
                  </RNText>
                </View>
              )}

              {/* Mono meta line, as in the prototype: FOUND-2018 · 11 Jun 2024 */}
              <RNText style={[text.meta, { marginTop: spacing.sm }]}>
                {item.short_code} · {formatDate(item.created_at)}
              </RNText>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.field,
  },
  avatarText: { fontFamily: text.brand.fontFamily, fontSize: 13, color: colors.primary },

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

  filters: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  chip: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...shadow.field,
  },
  chipActive: { backgroundColor: colors.ink },
  chipText: { ...text.smallStrong, color: colors.muted },

  sectionRow: { paddingVertical: spacing.lg },

  card: { backgroundColor: colors.card, borderRadius: radius.cardLarge, padding: spacing.md, ...shadow.card },
  thumb: {
    height: 128,
    borderRadius: radius.field,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  chipOnThumb: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
});
