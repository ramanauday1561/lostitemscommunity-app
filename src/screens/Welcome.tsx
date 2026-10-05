import { useEffect, useState } from 'react';
import { Image, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing, FadeInDown, ZoomIn, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming,
} from 'react-native-reanimated';
import { useVals } from '../StoreProvider';
import { SPRING } from '../ui/motion';
import { img } from '../data/assets';
import { C, FONTS, SHADOW } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Cta, Kicker } from '../ui/bits';
import { SLIDES } from '../data/constants';

/** Largest the picture card gets on big screens. */
const MAX_CARD = 420;
/** Below this the picture would be a thumbnail that adds nothing, so the card is dropped and the text keeps the room. */
const MIN_CARD = 96;
/** Vertical padding around the card inside its slot. */
const ROOM_PAD = 12;

/** One pagination dot: stretches into a pill when its slide is current. */
function Dot({ on }: { on: boolean }) {
  const w = useSharedValue(on ? 24 : 6);
  useEffect(() => { w.value = withSpring(on ? 24 : 6, SPRING); }, [on, w]);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[{ height: 6, borderRadius: 999, backgroundColor: on ? C.primary : '#D6D5D0' }, style]} />;
}

/** The illustration drifts up and down a few pixels, so the first screen feels alive. */
function Float({ children, style }: { children: React.ReactNode; style: object }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(t);
  }, [t]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: t.value * -8 }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

export function Welcome() {
  const v = useVals();
  // The picture card is a square sized to the SMALLER of the width and height left for it (between the header
  // and the text), so it never grows into the copy on short or landscape screens.
  const [room, setRoom] = useState<{ w: number; h: number } | null>(null);
  const onRoom = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setRoom((r) => (r && r.w === width && r.h === height ? r : { w: width, h: height }));
  };
  // On short screens the copy block tightens (a little smaller type and spacing) so the picture keeps more room.
  const compact = useWindowDimensions().height < 700;
  const card = room ? Math.min(room.w, room.h - ROOM_PAD * 2, MAX_CARD) : 0;
  return (
    <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: compact ? 16 : 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <Image source={img('logo.png')} style={{ width: 36, height: 36, marginLeft: -3 }} resizeMode="contain" />
          <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>Lost Items Community</Text>
        </View>
        <Press style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }} onPress={v.skipWelcome}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.subtle }}>Skip</Text>
        </Press>
      </View>

      <View onLayout={onRoom} style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', paddingVertical: ROOM_PAD }}>
        {card >= MIN_CARD && (
          <Animated.View key={v.slideIndex} entering={ZoomIn.duration(380).springify().damping(18)}
            style={[{ width: card, height: card, borderRadius: Math.min(36, card * 0.14), backgroundColor: v.slide.tint, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.7)' }, SHADOW.slide]}>
            <Float style={{ position: 'absolute', left: '9%', top: '9%', width: '82%', height: '82%' }}>
              <Image source={img(v.slide.img)} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            </Float>
          </Animated.View>
        )}
      </View>

      <View>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: compact ? 12 : 20 }}>
          {SLIDES.map((_, i) => <Dot key={i} on={i === v.slideIndex} />)}
        </View>
        <Animated.View key={v.slideIndex} entering={FadeInDown.duration(300)}>
        <Kicker color={C.primary}>{v.slide.kicker}</Kicker>
        <Text style={{ fontFamily: FONTS[800], fontSize: compact ? 26 : 30, lineHeight: compact ? 30 : 34, letterSpacing: -1, color: C.ink, marginTop: compact ? 8 : 12, minHeight: compact ? 60 : 69 }}>
          {v.slide.title}
        </Text>
        <Text style={{ fontFamily: FONTS[400], fontSize: compact ? 14 : 15, lineHeight: compact ? 21 : 24, color: C.muted, marginTop: compact ? 8 : 12, minHeight: compact ? 84 : 96 }}>
          {v.slide.body}
        </Text>
        </Animated.View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: compact ? 14 : 20 }}>
          {v.showWelcomeBack && (
            <Press
              style={[{ width: 56, height: 56, borderRadius: 20, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, SHADOW.fab]}
              scale={0.94} onPress={v.prevSlide}
            >
              <Icon name="arrow_back" size={23} color={C.ink} />
            </Press>
          )}
          <Cta label={v.nextLabel} on onPress={v.nextSlide} style={{ flex: 1, width: undefined }} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: compact ? 10 : 16 }}>
          <Text style={{ fontFamily: FONTS[400], fontSize: 13, color: C.subtle }}>Already a member? </Text>
          <Press onPress={v.skipWelcome}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.primary }}>Sign in</Text>
          </Press>
        </View>
      </View>
    </View>
  );
}
