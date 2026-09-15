import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, ErrorState, Loading, Pill } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { supabase } from '../../src/lib/supabase';
import type { ItemKind, ItemWithCategory } from '../../src/lib/database.types';
import { colors, radius, spacing, type } from '../../src/theme/tokens';

type Filter = 'all' | ItemKind;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'lost', label: 'Lost' },
  { key: 'found', label: 'Found' },
];

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
      .select(
        'id,short_code,reporter_id,kind,title,description,category_id,location_text,latitude,longitude,date_occurred,status,moderation_status,flagged_count,created_at,updated_at,categories(id,name,icon)',
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (filter !== 'all') query = query.eq('kind', filter);

    const term = search.trim();
    if (term) {
      // Escape PostgREST's or() delimiters before interpolating user input.
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
    // Debounce so typing in the search box doesn't fire a request per keystroke.
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

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.username ?? 'there';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.greeting}>Hello, {firstName}</Text>
        <Text style={s.h1}>Recently handed in</Text>
      </View>

      <View style={s.searchRow}>
        <Ionicons name="search" size={18} color={colors.mutedLight} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search titles, descriptions or a code"
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
            style={[s.filterChip, filter === f.key && s.filterChipActive]}
          >
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
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
            items.length === 0 ? { flexGrow: 1 } : { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md }
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
              <View style={s.cardTop}>
                <Pill text={item.kind === 'lost' ? 'LOST' : 'FOUND'} tone={item.kind} />
                <Text style={s.code}>{item.short_code}</Text>
              </View>

              <Text style={s.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>

              {!!item.description && (
                <Text style={s.cardBody} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              <View style={s.cardMeta}>
                {!!item.categories?.name && <Text style={s.metaText}>{item.categories.name}</Text>}
                {!!item.location_text && (
                  <>
                    <Text style={s.metaDot}>·</Text>
                    <Text style={s.metaText} numberOfLines={1}>
                      {item.location_text}
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  greeting: { fontSize: type.small.fontSize, color: colors.muted, fontWeight: '600' },
  h1: { fontSize: type.h1.fontSize, fontWeight: '800', color: colors.ink, marginTop: 2 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  searchInput: { flex: 1, fontSize: type.small.fontSize, color: colors.ink },

  filters: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  filterTextActive: { color: colors.white },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  code: { fontSize: type.tiny.fontSize, fontWeight: '700', color: colors.mutedLight, letterSpacing: 0.5 },
  cardTitle: { fontSize: type.h3.fontSize, fontWeight: '700', color: colors.ink },
  cardBody: { fontSize: type.small.fontSize, color: colors.muted, marginTop: spacing.xs, lineHeight: 19 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  metaText: { fontSize: 12, color: colors.mutedLight, flexShrink: 1 },
  metaDot: { fontSize: 12, color: colors.mutedFaint },
});
