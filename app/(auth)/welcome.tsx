import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Kicker, Text } from '@/components/ui';
import { colors, radius, spacing, text } from '@/theme/tokens';

const SLIDES = [
  {
    art: require('../../assets/illustrations/hero-boy-with-dog.webp'),
    kicker: 'Welcome to Lost Items Community',
    title: "Lost Something? We'll Help You Find It!",
    body: "Join thousands of people reuniting with their lost belongings every day. Report what you've found, search for what you've lost, and be part of a caring community.",
  },
  {
    art: require('../../assets/illustrations/illustration-treasure-chest.webp'),
    kicker: 'Found something?',
    title: 'Hand It Back To The Right Person',
    body: 'Post what you found and keep one identifying detail to yourself. That way you can be sure the person collecting it is the real owner.',
  },
  {
    art: require('../../assets/illustrations/illustration-exchange-item.webp'),
    kicker: 'Reunited, safely',
    title: 'Your Details Stay Yours',
    body: 'Chat inside the app. Your phone number is never shared automatically — you decide when to share it, or it unlocks once a match is confirmed.',
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
      <View style={s.header}>
        <Image source={require('../../assets/illustrations/logo.png')} style={s.logo} />
        <RNText style={text.brand}>Lost Items Community</RNText>
        <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={12} style={{ marginLeft: 'auto' }}>
          <RNText style={s.skip}>Skip</RNText>
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
          <View key={slide.title} style={{ width, paddingHorizontal: spacing.xl }}>
            <View style={s.hero}>
              <Image source={slide.art} style={s.heroArt} resizeMode="contain" />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Active indicator is a wide bar, not a larger dot, and sits left-aligned. */}
      <View style={s.dots}>
        {SLIDES.map((slide, i) => (
          <View key={slide.title} style={[s.dot, i === index && s.dotActive]} />
        ))}
      </View>

      <View style={s.copy}>
        <Kicker>{SLIDES[index].kicker}</Kicker>
        <Text variant="h1">{SLIDES[index].title}</Text>
        <Text variant="body" style={{ marginTop: spacing.md }}>
          {SLIDES[index].body}
        </Text>
      </View>

      <View style={s.footer}>
        <Button label={index === SLIDES.length - 1 ? 'Get started' : 'Next'} onPress={advance} />
        <Pressable onPress={() => router.push('/(auth)/login')} style={{ marginTop: spacing.lg, alignSelf: 'center' }}>
          <RNText style={text.small}>
            Already a member? <RNText style={s.link}>Sign in</RNText>
          </RNText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    height: 56,
  },
  logo: { width: 30, height: 30, borderRadius: 8 },
  skip: { ...text.smallStrong, color: colors.mutedLight },

  hero: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 340,
    borderRadius: radius.hero,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroArt: { width: '78%', height: '78%' },

  dots: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.xl, marginTop: spacing.xl },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.borderStrong },
  dotActive: { width: 26, backgroundColor: colors.primary, borderRadius: 4 },

  copy: { paddingHorizontal: spacing.xl, marginTop: spacing.xl },
  footer: { marginTop: 'auto', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  link: { fontFamily: text.smallStrong.fontFamily, color: colors.primary },
});
