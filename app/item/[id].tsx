import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ErrorState, Loading, Pill } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import type { ItemWithCategory } from '../../src/lib/database.types';
import { colors, radius, spacing, text } from '../../src/theme/tokens';

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ItemWithCategory | null>(null);
  const [reporter, setReporter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('items')
      .select(
        'id,short_code,reporter_id,kind,title,description,category_id,location_text,latitude,longitude,date_occurred,status,moderation_status,flagged_count,created_at,updated_at,categories(id,name,icon)',
      )
      .eq('id', id)
      .maybeSingle();

    if (err) {
      setError(err.message);
    } else if (!data) {
      setError('That item is no longer in the registry.');
    } else {
      const row = data as unknown as ItemWithCategory;
      setItem(row);

      // profiles carries no contact data, so a plain read is safe here.
      const { data: p } = await supabase
        .from('profiles')
        .select('username,full_name')
        .eq('id', row.reporter_id)
        .maybeSingle();
      setReporter((p?.full_name as string) || (p?.username as string) || null);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (id) void load();
  }, [id]);

  if (loading) return <Loading label="Loading item…" />;
  if (error || !item) return <ErrorState message={error ?? 'Not found'} onRetry={load} />;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={s.content}>
      <View style={s.topRow}>
        <Pill text={item.kind === 'lost' ? 'LOST' : 'FOUND'} tone={item.kind} />
        {item.status === 'resolved' && <Pill text="RESOLVED" tone="resolved" />}
        <Text style={s.code}>{item.short_code}</Text>
      </View>

      <Text style={s.title}>{item.title}</Text>

      {!!item.description && <Text style={s.body}>{item.description}</Text>}

      <View style={s.metaCard}>
        <Row label="Category" value={item.categories?.name ?? '—'} />
        <Row label={item.kind === 'lost' ? 'Lost near' : 'Found near'} value={item.location_text ?? '—'} />
        <Row label="Reported by" value={reporter ?? '—'} />
        <Row label="Reported on" value={new Date(item.created_at).toLocaleDateString()} />
      </View>

      <Text style={s.note}>
        Messaging and match proposals arrive in Phase 3. Until then, note the code above and follow up in the
        community forum.
      </Text>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  code: { ...text.meta, marginLeft: 'auto' },
  title: { ...text.h1 },
  body: { ...text.body, marginTop: spacing.md },
  metaCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  rowLabel: { ...text.small },
  rowValue: { ...text.bodyStrong, fontSize: 13.5, flexShrink: 1, textAlign: 'right' },
  note: { marginTop: spacing.xl, fontSize: 12, color: colors.mutedLight, lineHeight: 18, textAlign: 'center' },
});
