import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, ErrorState, Loading } from '../../src/components/ui';
import {
  ActionRow,
  AvatarButton,
  CardRail,
  IconButton,
  ItemCard,
  ScreenHeader,
  SectionHeader,
} from '../../src/components/layout';
import { Box, Text } from '../../src/components/primitives';
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

const CARD_WIDTH = 262;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const router = useRouter();
  const { profile } = useAuth();

  const [items, setItems] = useState<ItemWithCategory[]>([]);
  const [recent, setRecent] = useState<ItemWithCategory[]>([]);
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

    const [listRes, recentRes] = await Promise.all([
      query,
      // The rail always shows the newest handed-in items, independent of
      // whatever filter or search the list below is using.
      supabase
        .from('items')
        .select(SELECT)
        .eq('status', 'active')
        .eq('kind', 'found')
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    if (listRes.error) {
      setError(listRes.error.message);
      setItems([]);
    } else {
      setItems((listRes.data ?? []) as unknown as ItemWithCategory[]);
    }
    if (!recentRes.error) setRecent((recentRes.data ?? []) as unknown as ItemWithCategory[]);
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

  const header = (
    <>
      <ScreenHeader
        kicker="Community member"
        title="My dashboard"
        right={
          <>
            <IconButton icon="chatbubble-outline" onPress={() => router.push('/(tabs)/inbox')} />
            <AvatarButton initials={initials} onPress={() => router.push('/(tabs)/profile')} />
          </>
        }
      />

      {recent.length > 0 && (
        <>
          <SectionHeader title="Recently handed in" actionLabel="See all" onAction={() => setFilter('found')} />
          <CardRail>
            {recent.map((it) => (
              <ItemCard
                key={it.id}
                width={CARD_WIDTH}
                title={it.title}
                location={it.location_text}
                meta={`${it.short_code} · ${formatDate(it.created_at)}`}
                status={it.status === 'resolved' ? 'Resolved' : 'Active'}
                onPress={() => router.push(`/item/${it.id}`)}
              />
            ))}
          </CardRail>
        </>
      )}

      <Box marginTop="xxl" />
      <ActionRow
        icon="search-outline"
        title="Search lost items registry"
        body="Browse recent lost reports from members in your city."
        onPress={() => setFilter('lost')}
      />
      <ActionRow
        icon="storefront-outline"
        title="Search found items registry"
        body="Check if someone handed in what you are missing."
        tone="ok"
        onPress={() => setFilter('found')}
      />
      <ActionRow
        icon="chatbubbles-outline"
        title="Messages"
        body="Conversations with people returning your items."
        onPress={() => router.push('/(tabs)/inbox')}
      />

      <SectionHeader title="The registry" />

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

      <Box flexDirection="row" gap="sm" paddingHorizontal="xl" paddingTop="md" paddingBottom="lg">
        {FILTERS.map((f) => (
          <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[s.chip, filter === f.key && s.chipActive]}>
            <Text variant="smallStrong" color={filter === f.key ? 'white' : 'muted'}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </Box>
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Loading label="Fetching the registry…" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {error ? (
        <ErrorState message={error} onRetry={() => void onRefresh()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: 130 }}
          columnWrapperStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
          numColumns={2}
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
          ItemSeparatorComponent={() => <Box height={spacing.md} />}
          renderItem={({ item }) => (
            <Box flex={1}>
              <ItemCard
                title={item.title}
                location={item.location_text}
                meta={`${item.short_code} · ${formatDate(item.created_at)}`}
                status={item.kind === 'lost' ? 'Lost' : 'Found'}
                onPress={() => router.push(`/item/${item.id}`)}
              />
            </Box>
          )}
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
    paddingHorizontal: spacing.xl,
    height: 52,
    backgroundColor: colors.card,
    borderRadius: radius.field,
    ...shadow.field,
  },
  searchInput: { flex: 1, ...text.input, paddingVertical: 0 },
  chip: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...shadow.field,
  },
  chipActive: { backgroundColor: colors.ink },
});
