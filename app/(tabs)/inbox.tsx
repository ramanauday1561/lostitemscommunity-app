import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { DEMO_CONVOS } from '@/lib/demo';
import { colors, font, radius, shadow, spacing, text } from '@/theme/tokens';

export default function Inbox() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <ScreenHeader kicker="Inbox" title="Messages" />

        {DEMO_CONVOS.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            body="When someone matches one of your reports, the conversation starts here."
          />
        ) : (
          <View style={s.list}>
            {DEMO_CONVOS.map((c) => {
              const last = c.msgs[c.msgs.length - 1];
              return (
                <Pressable key={c.id} style={s.row} onPress={() => router.push(`/messages/${c.id}`)}>
                  <View style={s.icon}>
                    <Ionicons name={c.icon as never} size={20} color={colors.primary} />
                  </View>
                  <View style={s.rowText}>
                    <View style={s.rowTop}>
                      <Text style={s.item} numberOfLines={1}>
                        {c.item}
                      </Text>
                      <Text style={s.time}>{c.time}</Text>
                    </View>
                    <Text style={s.handle}>@{c.with} · {c.itemId}</Text>
                    <Text style={s.preview} numberOfLines={1}>
                      {last.from === 'me' ? 'You: ' : ''}
                      {last.text}
                    </Text>
                  </View>
                  {c.unread > 0 && (
                    <View style={s.badge}>
                      <Text style={s.badgeText}>{c.unread}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 130 },
  list: { paddingHorizontal: spacing.xl, marginTop: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.cardLarge,
    padding: spacing.lg,
    ...shadow.card,
  },
  icon: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  item: { flex: 1, fontFamily: font.bold, fontSize: 15, letterSpacing: -0.2, color: colors.ink },
  time: { ...text.meta },
  handle: { marginTop: 2, ...text.meta },
  preview: { marginTop: 4, ...text.small },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: font.bold, fontSize: 11, color: colors.white },
});
