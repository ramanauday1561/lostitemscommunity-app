import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout';
import { DEMO_THREADS, type DemoThread } from '@/lib/demo';
import { colors, font, radius, shadow, spacing, text } from '@/theme/tokens';

const TAGS = ['All', 'Sighting', 'Reunited', 'Question'] as const;

const TAG_TONE: Record<DemoThread['tag'], string> = {
  Sighting: colors.primary,
  Reunited: colors.success,
  Question: colors.muted,
};

export default function Forum() {
  const router = useRouter();
  const [tag, setTag] = useState<(typeof TAGS)[number]>('All');

  const threads = tag === 'All' ? DEMO_THREADS : DEMO_THREADS.filter((t) => t.tag === tag);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <ScreenHeader kicker="Community" title="Forum" />

        <View style={s.filters}>
          {TAGS.map((t) => {
            const on = t === tag;
            return (
              <Pressable key={t} onPress={() => setTag(t)} style={[s.chip, on && s.chipOn]}>
                <Text style={[s.chipText, on && s.chipTextOn]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.list}>
          {threads.map((t) => (
            <Pressable key={t.id} style={s.card} onPress={() => router.push(`/forum/${t.id}`)}>
              <View style={s.row}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{t.ini}</Text>
                </View>
                <View style={s.rowText}>
                  <Text style={s.author}>{t.user}</Text>
                  <Text style={s.meta}>{t.meta}</Text>
                </View>
                <Text style={[s.tag, { color: TAG_TONE[t.tag], backgroundColor: `${TAG_TONE[t.tag]}1A` }]}>
                  {t.tag}
                </Text>
              </View>

              <Text style={s.title}>{t.title}</Text>
              <Text style={s.body} numberOfLines={2}>
                {t.text}
              </Text>

              <View style={s.footer}>
                <Ionicons name="chatbubble-outline" size={15} color={colors.mutedLight} />
                <Text style={s.footerText}>
                  {t.replies.length} {t.replies.length === 1 ? 'reply' : 'replies'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 130 },
  filters: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...shadow.field,
  },
  chipOn: { backgroundColor: colors.ink },
  chipText: { fontFamily: font.bold, fontSize: 12.5, color: colors.ink },
  chipTextOn: { color: colors.white },
  list: { paddingHorizontal: spacing.xl, marginTop: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.cardLarge, padding: spacing.lg, ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.monoSemibold, fontSize: 11, color: colors.muted },
  rowText: { flex: 1, minWidth: 0 },
  author: { fontFamily: font.bold, fontSize: 13.5, color: colors.ink },
  meta: { marginTop: 2, ...text.meta },
  tag: {
    fontFamily: font.bold,
    fontSize: 10.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  title: { marginTop: spacing.md, fontFamily: font.bold, fontSize: 15.5, lineHeight: 20, letterSpacing: -0.2, color: colors.ink },
  body: { marginTop: spacing.xs, ...text.small },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  footerText: { fontFamily: font.semibold, fontSize: 12, color: colors.mutedLight },
});
