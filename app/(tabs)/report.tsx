import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { supabase } from '../../src/lib/supabase';
import type { Category, ItemKind } from '../../src/lib/database.types';
import { colors, radius, spacing, type } from '../../src/theme/tokens';

export default function Report() {
  const router = useRouter();
  const { user } = useAuth();

  const [kind, setKind] = useState<ItemKind>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: string; short_code: string } | null>(null);

  useEffect(() => {
    supabase
      .from('categories')
      .select('id,name,icon,sort_order')
      .order('sort_order')
      .then(({ data, error: err }) => {
        if (err) console.warn('[report] categories failed:', err.message);
        else setCategories((data ?? []) as Category[]);
      });
  }, []);

  function reset() {
    setKind('lost');
    setTitle('');
    setDescription('');
    setLocationText('');
    setCategoryId(null);
    setCreated(null);
    setError(null);
  }

  async function submit() {
    setError(null);

    if (!user) return setError('You need to be signed in to post a report.');
    if (title.trim().length < 3) return setError('Give the item a short title (at least 3 characters).');

    setBusy(true);
    try {
      // short_code is intentionally omitted — a BEFORE INSERT trigger assigns
      // LOST-#### / FOUND-#### so codes stay unique and sequential.
      const { data, error: err } = await supabase
        .from('items')
        .insert({
          reporter_id: user.id,
          kind,
          title: title.trim(),
          description: description.trim() || null,
          location_text: locationText.trim() || null,
          category_id: categoryId,
        } as never)
        .select('id,short_code')
        .single();

      if (err) throw err;
      setCreated(data as { id: string; short_code: string });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your report.');
    } finally {
      setBusy(false);
    }
  }

  /* ---------- success state (Phase 2 "Report Success" screen) ---------- */
  if (created) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.successWrap}>
          <View style={s.successBadge}>
            <Text style={s.successTick}>✓</Text>
          </View>
          <Text style={s.successTitle}>Added to the registry</Text>
          <Text style={s.successBody}>
            Your report is live. Share this code with anyone who might have seen it.
          </Text>
          <View style={s.codeBox}>
            <Text style={s.codeText}>{created.short_code}</Text>
          </View>

          <Button
            label="View in registry"
            onPress={() => {
              const id = created.id;
              reset();
              router.push(`/item/${id}`);
            }}
            style={{ alignSelf: 'stretch' }}
          />
          <Button
            label="Report another item"
            variant="secondary"
            onPress={reset}
            style={{ alignSelf: 'stretch', marginTop: spacing.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  /* ---------- form ---------- */
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.h1}>Report an item</Text>
          <Text style={s.sub}>Two minutes now can reunite someone with their things.</Text>

          <View style={s.kindRow}>
            {(['lost', 'found'] as ItemKind[]).map((k) => (
              <Pressable
                key={k}
                onPress={() => setKind(k)}
                style={[s.kindChip, kind === k && s.kindChipActive]}
              >
                <Text style={[s.kindText, kind === k && s.kindTextActive]}>
                  {k === 'lost' ? 'I lost something' : 'I found something'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field
            label="What is it?"
            value={title}
            onChangeText={setTitle}
            placeholder="Black leather wallet"
            maxLength={140}
          />

          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder={
              kind === 'found'
                ? 'Describe it, but hold one detail back so you can verify the owner.'
                : 'Any detail that helps someone recognise it.'
            }
            multiline
            numberOfLines={4}
            style={{ height: 110, paddingTop: spacing.md, textAlignVertical: 'top' }}
          />

          <Field
            label={kind === 'lost' ? 'Where did you lose it?' : 'Where did you find it?'}
            value={locationText}
            onChangeText={setLocationText}
            placeholder="Near the station entrance"
          />

          <Text style={s.fieldLabel}>Category</Text>
          <View style={s.catWrap}>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
                style={[s.catChip, categoryId === c.id && s.catChipActive]}
              >
                <Text style={[s.catText, categoryId === c.id && s.catTextActive]}>{c.name}</Text>
              </Pressable>
            ))}
          </View>

          {!!error && <Text style={s.error}>{error}</Text>}

          <Button label="Post to the registry" onPress={submit} loading={busy} />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.md },
  h1: { fontSize: type.h1.fontSize, fontWeight: '800', color: colors.ink },
  sub: { fontSize: type.small.fontSize, color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.xl },

  kindRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  kindChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  kindChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  kindText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  kindTextActive: { color: colors.white },

  fieldLabel: { fontSize: type.small.fontSize, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  catChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  catText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  catTextActive: { color: colors.primary },

  error: { color: colors.danger, fontSize: type.small.fontSize, marginBottom: spacing.lg },

  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  successBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  successTick: { fontSize: 32, color: colors.success, fontWeight: '800' },
  successTitle: { fontSize: type.h1.fontSize, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  successBody: {
    fontSize: type.body.fontSize,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  codeBox: {
    marginVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
  },
  codeText: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: 1.5 },
});
