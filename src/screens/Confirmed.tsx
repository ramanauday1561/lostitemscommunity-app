import { Image, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useVals } from '../StoreProvider';
import { img } from '../data/assets';
import { C, FONTS, GLASS, SHADOW } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Loader } from '../ui/Loader';
import { Cta, Kicker } from '../ui/bits';
import { pop, rise } from '../ui/motion';

/** What a brand-new member can do first. Mirrors the new-member dashboard's setup steps. */
const NEXT = [
  { icon: 'add_a_photo', title: 'Post something', desc: 'Lost or found it? Two steps, with a pin on the map.' },
  { icon: 'travel_explore', title: 'Check Nearby', desc: 'See what people have posted around you.' },
  { icon: 'shield', title: 'Read the meetup rules', desc: "You'll accept them before your first handover." },
];

/** Reached from the link in the signup confirmation email. */
export function Confirmed() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 20, paddingBottom: 32, flexGrow: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 44 }}>
        <Image source={img('logo.png')} style={{ width: 36, height: 36, marginLeft: -3 }} resizeMode="contain" />
        <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>Lost Items Community</Text>
      </View>

      {v.cfChecking && (
        <View testID="confirmed-checking" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 48 }}>
          <Loader size={14} />
          <Text style={{ fontFamily: FONTS[600], fontSize: 14, color: C.muted }}>Confirming your email…</Text>
        </View>
      )}

      {v.cfDone && (
        <View testID="confirmed-done" style={{ flex: 1, justifyContent: 'center', paddingTop: 24 }}>
          <Animated.View entering={pop} style={{
            width: 84, height: 84, borderRadius: 28, backgroundColor: 'rgba(15,123,61,.12)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="mark_email_read" size={42} color={C.success} />
          </Animated.View>

          <View style={{ marginTop: 24 }}><Kicker color={C.success}>Email confirmed</Kicker></View>
          <Text style={{ fontFamily: FONTS[800], fontSize: 32, lineHeight: 36, letterSpacing: -1.1, color: C.ink, marginTop: 10 }}>
            {`You're in, ${v.cfName}.`}
          </Text>
          <Text style={{ fontFamily: FONTS[400], fontSize: 15, lineHeight: 24, color: C.muted, marginTop: 10 }}>
            Your account is ready and you're signed in. Here's where most people start.
          </Text>

          <View style={[{ ...GLASS, borderRadius: 26, padding: 8, marginTop: 24 }, SHADOW.card]}>
            {NEXT.map((n, i) => (
              <Animated.View key={n.title} entering={rise(i + 1)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 10, paddingHorizontal: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={n.icon} size={19} color={C.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>{n.title}</Text>
                  <Text style={{ fontFamily: FONTS[400], fontSize: 12.5, lineHeight: 18, color: C.subtle, marginTop: 2 }}>{n.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <Cta label="Go to my dashboard" on onPress={v.cfContinue} style={{ marginTop: 24 }} />
        </View>
      )}

      {v.cfFailed && (
        <View testID="confirmed-error" style={{ flex: 1, justifyContent: 'center', paddingTop: 24 }}>
          <Animated.View entering={pop} style={{
            width: 84, height: 84, borderRadius: 28, backgroundColor: 'rgba(180,35,24,.08)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="link_off" size={40} color={C.danger} />
          </Animated.View>

          <View style={{ marginTop: 24 }}><Kicker color={C.danger}>Link didn't work</Kicker></View>
          <Text style={{ fontFamily: FONTS[800], fontSize: 32, lineHeight: 36, letterSpacing: -1.1, color: C.ink, marginTop: 10 }}>
            We couldn't confirm that link
          </Text>
          <Text style={{ fontFamily: FONTS[400], fontSize: 15, lineHeight: 24, color: C.muted, marginTop: 10 }}>{v.cfError}</Text>

          <Cta label="Sign in" on onPress={v.cfSignIn} style={{ marginTop: 28 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontFamily: FONTS[400], fontSize: 13, color: C.muted }}>Need a new link? </Text>
            <Press onPress={v.cfSignUpAgain}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.primary }}>Sign up again</Text>
            </Press>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
