import { Image, ScrollView, Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { img } from '../data/assets';
import { C, FONTS } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Field } from '../ui/Field';
import { Cta } from '../ui/bits';
import { SocialButtons } from '../ui/SocialButtons';

function CheckBox({ on }: { on: boolean }) {
  return (
    <View style={{
      width: 20, height: 20, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
      backgroundColor: on ? C.primary : C.white,
      ...(on ? null : { boxShadow: 'inset 0 0 0 1.5px #D6D5D0' }),
    }}>
      {on ? <Icon name="check" size={15} color={C.white} /> : null}
    </View>
  );
}

export function Login() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: 32, backgroundColor: C.bg, flexGrow: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Image source={img('logo.png')} style={{ width: 46, height: 46, marginLeft: -4 }} resizeMode="contain" />
        <Text style={{ fontFamily: FONTS[700], fontSize: 15, color: C.ink }}>Lost Items Community</Text>
      </View>
      <Text style={{ fontFamily: FONTS[800], fontSize: 34, lineHeight: 37, letterSpacing: -1.2, color: C.ink, marginTop: 56, marginBottom: 12 }}>
        Welcome{'\n'}back
      </Text>
      <Text style={{ fontFamily: FONTS[400], fontSize: 15, lineHeight: 24, color: C.muted }}>
        Great to see you again. Let's find what you're looking for.
      </Text>

      <View style={{ marginTop: 40 }}>
          <Field icon="person" value={v.username} onChange={v.onUser} placeholder="Username or email" style={{ marginBottom: 8 }} />
          <Field icon="lock" value={v.password} onChange={v.onPass} placeholder="Password" secure onSubmit={v.submit} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <Press style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingRight: 8 }} scale={1} onPress={v.toggleRemember}>
              <CheckBox on={v.remember} />
              <Text style={{ fontFamily: FONTS[500], fontSize: 13.5, color: C.muted }}>Remember me</Text>
            </Press>
            <Press style={{ minHeight: 44, paddingLeft: 8, justifyContent: 'center' }} scale={1} onPress={v.goForgot}>
              <Text style={{ fontFamily: FONTS[600], fontSize: 13.5, color: C.primary }}>Forgot password?</Text>
            </Press>
          </View>

          {!!v.error && (
            <View style={{ marginTop: 8, flexDirection: 'row', gap: 9, padding: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: 'rgba(180,35,24,.08)' }}>
              <Icon name="error" size={19} color={C.danger} />
              <Text style={{ flex: 1, fontFamily: FONTS[500], fontSize: 12.5, lineHeight: 19, color: C.danger }}>{v.error}</Text>
            </View>
          )}

          <Cta label={v.signInLabel} on={v.signInEnabled} onPress={v.submit} loading={v.signInLoading} style={{ marginTop: 16 }} />

          <SocialButtons />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: 20 }}>
        <Text style={{ fontFamily: FONTS[400], fontSize: 13, color: C.muted }}>New here? </Text>
        <Press onPress={v.goSignup}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.primary }}>Join free in 30 seconds</Text>
        </Press>
      </View>
    </ScrollView>
  );
}
