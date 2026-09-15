import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View, Pressable, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui';
import { colors, radius, spacing, type } from '../../src/theme/tokens';

const SLIDES = [
  {
    title: 'Lost something?',
    body: 'Report it once and the whole community starts looking. Every report gets a short code you can share anywhere.',
  },
  {
    title: 'Found something?',
    body: 'Hand it back to the right person. Post what you found, keep one detail private, and verify the real owner.',
  },
  {
    title: 'Reunited, safely',
    body: 'Chat inside the app. Your phone number is never shared automatically — you decide when, or after a confirmed match.',
  },
];

export default function Welcome() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const width = Dimensions.get('window').width;
  const scrollRef = useRef<ScrollView>(null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  }

  function advance() {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
      setIndex(index + 1);
    } else {
      router.push('/(auth)/login');
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.topRow}>
        <Text style={s.brand}>Lost Items Community</Text>
        <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={12}>
          <Text style={s.skip}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flexGrow: 0 }}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[s.slide, { width }]}>
            <View style={s.art} />
            <Text style={s.title}>{slide.title}</Text>
            <Text style={s.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={s.dots}>
        {SLIDES.map((slide, i) => (
          <View key={slide.title} style={[s.dot, i === index && s.dotActive]} />
        ))}
      </View>

      <View style={s.footer}>
        <Button label={index === SLIDES.length - 1 ? 'Get started' : 'Next'} onPress={advance} />
        <Pressable onPress={() => router.push('/(auth)/login')} style={{ marginTop: spacing.lg }}>
          <Text style={s.signin}>
            Already a member? <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  brand: { fontSize: type.small.fontSize, fontWeight: '800', color: colors.ink },
  skip: { fontSize: type.small.fontSize, color: colors.muted, fontWeight: '600' },
  slide: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  art: {
    width: 200,
    height: 200,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.xxl,
  },
  title: { fontSize: type.h1.fontSize, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  body: {
    fontSize: type.body.fontSize,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.borderStrong },
  dotActive: { backgroundColor: colors.primary, width: 22 },
  footer: { marginTop: 'auto', paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, alignItems: 'center' },
  signin: { fontSize: type.small.fontSize, color: colors.muted },
});
