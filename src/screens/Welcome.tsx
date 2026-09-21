import { Image, Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { img } from '../data/assets';
import { C, FONTS, SHADOW } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Cta, Kicker } from '../ui/bits';
import { SLIDES } from '../data/constants';

export function Welcome() {
  const v = useVals();
  return (
    <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 28, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <Image source={img('logo.png')} style={{ width: 36, height: 36, marginLeft: -3 }} resizeMode="contain" />
          <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>Lost Items Community</Text>
        </View>
        <Press style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }} onPress={v.skipWelcome}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.subtle }}>Skip</Text>
        </Press>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
        <View style={[{ width: '100%', aspectRatio: 1, borderRadius: 36, backgroundColor: v.slide.tint, overflow: 'hidden' }, SHADOW.slide]}>
          <Image
            source={img(v.slide.img)}
            style={{ position: 'absolute', left: '9%', top: '9%', width: '82%', height: '82%' }}
            resizeMode="contain"
          />
        </View>
      </View>

      <View>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
          {SLIDES.map((_, i) => (
            <View key={i} style={{
              width: i === v.slideIndex ? 24 : 6, height: 6, borderRadius: 999,
              backgroundColor: i === v.slideIndex ? C.primary : '#D6D5D0',
            }} />
          ))}
        </View>
        <Kicker color={C.primary}>{v.slide.kicker}</Kicker>
        <Text style={{ fontFamily: FONTS[800], fontSize: 30, lineHeight: 34, letterSpacing: -1, color: C.ink, marginTop: 12, minHeight: 69 }}>
          {v.slide.title}
        </Text>
        <Text style={{ fontFamily: FONTS[400], fontSize: 15, lineHeight: 24, color: C.muted, marginTop: 12, minHeight: 96 }}>
          {v.slide.body}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 }}>
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

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
          <Text style={{ fontFamily: FONTS[400], fontSize: 13, color: C.subtle }}>Already a member? </Text>
          <Press onPress={v.skipWelcome}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.primary }}>Sign in</Text>
          </Press>
        </View>
      </View>
    </View>
  );
}
