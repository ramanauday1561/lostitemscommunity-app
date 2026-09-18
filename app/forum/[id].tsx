import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui';
import { DEMO_THREADS } from '@/lib/demo';
import { colors, font, radius, shadow, spacing, text } from '@/theme/tokens';

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const thread = DEMO_THREADS.find((t) => t.id === id);

  if (!thread) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <EmptyState title="Thread not found" body="It may have been removed by a moderator." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{thread.ini}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.author}>{thread.user}</Text>
              <Text style={s.meta}>{thread.meta}</Text>
            </View>
          </View>
          <Text style={s.title}>{thread.title}</Text>
          <Text style={s.body}>{thread.text}</Text>
        </View>

        <Text style={s.sectionTitle}>
          {thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}
        </Text>

        <View style={s.replies}>
          {thread.replies.map((r, i) => (
            <View key={i} style={s.reply}>
              <View style={s.row}>
                <View style={[s.avatar, s.avatarSmall]}>
                  <Text style={s.avatarText}>{r.ini}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.author}>{r.user}</Text>
                  <Text style={s.meta}>{r.time}</Text>
                </View>
              </View>
              <Text style={s.replyText}>{r.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingBottom: 60 },
  card: { backgroundColor: colors.card, borderRadius: radius.cardLarge, padding: spacing.lg, ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgAlt, alignItems: 'center', justifyContent: 'center' },
  avatarSmall: { width: 34, height: 34, borderRadius: 17 },
  avatarText: { fontFamily: font.monoSemibold, fontSize: 11, color: colors.muted },
  author: { fontFamily: font.bold, fontSize: 13.5, color: colors.ink },
  meta: { marginTop: 2, ...text.meta },
  title: { marginTop: spacing.md, fontFamily: font.extrabold, fontSize: 19, lineHeight: 24, letterSpacing: -0.4, color: colors.ink },
  body: { marginTop: spacing.sm, ...text.body },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.md, ...text.h3 },
  replies: { gap: spacing.sm },
  reply: { backgroundColor: colors.card, borderRadius: radius.card, padding: spacing.lg, ...shadow.field },
  replyText: { marginTop: spacing.sm, ...text.small },
});
