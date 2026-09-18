import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { EmptyState } from '@/components/ui';
import { DEMO_CONVOS, type DemoMessage } from '@/lib/demo';
import { colors, font, radius, shadow, spacing, text } from '@/theme/tokens';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const convo = DEMO_CONVOS.find((c) => c.id === id);

  // Local only: replies live for as long as the screen does. Nothing is
  // persisted while the app is on demo data.
  const [msgs, setMsgs] = useState<DemoMessage[]>(convo?.msgs ?? []);
  const [draft, setDraft] = useState('');

  if (!convo) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <EmptyState title="Conversation not found" />
      </SafeAreaView>
    );
  }

  function send() {
    const body = draft.trim();
    if (!body) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMsgs((m) => [...m, { from: 'me', text: body, time }]);
    setDraft('');
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={s.header}>
          <Text style={s.item}>{convo.item}</Text>
          <Text style={s.meta}>@{convo.with} · {convo.itemId}</Text>
        </View>

        <ScrollView contentContainerStyle={s.thread}>
          {msgs.map((m, i) => (
            <View key={i} style={[s.bubbleRow, m.from === 'me' ? s.mine : s.theirs]}>
              <View style={[s.bubble, m.from === 'me' ? s.bubbleMine : s.bubbleTheirs]}>
                <Text style={[s.bubbleText, m.from === 'me' && { color: colors.white }]}>{m.text}</Text>
                <Text style={[s.bubbleTime, m.from === 'me' && { color: 'rgba(255,255,255,0.7)' }]}>
                  {m.time}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={s.composer}>
          <TextInput
            style={s.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message"
            placeholderTextColor={colors.mutedFaint}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <Pressable style={[s.send, !draft.trim() && s.sendOff]} onPress={send} disabled={!draft.trim()}>
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },
  item: { fontFamily: font.extrabold, fontSize: 20, letterSpacing: -0.5, color: colors.ink },
  meta: { marginTop: 2, ...text.meta },
  thread: { padding: spacing.xl, gap: spacing.sm },
  bubbleRow: { flexDirection: 'row' },
  mine: { justifyContent: 'flex-end' },
  theirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: radius.cardLarge, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: colors.card, borderBottomLeftRadius: 6, ...shadow.field },
  bubbleText: { fontFamily: font.regular, fontSize: 14.5, lineHeight: 20, color: colors.ink },
  bubbleTime: { marginTop: 4, fontFamily: font.monoMedium, fontSize: 10, color: colors.mutedLight },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.field,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.ink,
    ...shadow.field,
  },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendOff: { backgroundColor: colors.fieldIdle },
});
