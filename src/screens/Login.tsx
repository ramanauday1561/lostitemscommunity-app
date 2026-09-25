import { Image, ScrollView, Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { img } from '../data/assets';
import { C, FONTS, MONO, SHADOW } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Field } from '../ui/Field';
import { Cta, Divider, Seg } from '../ui/bits';

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
          <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 24, backgroundColor: C.fill, marginBottom: 16 }}>
            {v.authModeOptions.map((o) => <Seg key={o.key} label={o.label} on={o.on} onPress={o.pick} />)}
          </View>

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

          <Cta label={v.signInLabel} on={v.signInEnabled} onPress={v.submit} style={{ marginTop: 16 }} />

          {v.isDemoAuth && (
            <>
              <Divider label="Or continue with a social account" />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                {v.socials.map((s) => (
                  <Press key={s.name} style={[{
                    flex: 1, minHeight: 64, borderRadius: 20, backgroundColor: C.white,
                    alignItems: 'center', justifyContent: 'center', gap: 7,
                  }, SHADOW.tile]} scale={0.95} activeBg={C.fillSoft} onPress={s.go}>
                    <View style={{
                      width: 24, height: 24, borderRadius: 12, backgroundColor: s.bg,
                      alignItems: 'center', justifyContent: 'center',
                      ...(s.ring ? { boxShadow: s.bg === '#fff' ? 'inset 0 0 0 1px #D6D5D0' : 'inset 0 0 0 1px rgba(255,255,255,.35)' } : null),
                    }}>
                      <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: s.fg }}>{s.mark}</Text>
                    </View>
                    <Text style={{ fontFamily: FONTS[600], fontSize: 11, color: C.muted }}>{s.name}</Text>
                  </Press>
                ))}
              </View>

              <Divider label="Quick test logins" />
              <View style={{ gap: 8, marginTop: 16 }}>
                {v.quickLogins.map((q) => (
                  <Press key={q.handle} style={[{
                    minHeight: 56, paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.white,
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                  }, SHADOW.field]} scale={0.98} activeBg={C.fill} onPress={q.go}>
                    <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: q.tint, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={q.icon} size={19} color={q.color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.ink }}>{q.name}</Text>
                      <Text style={{ fontFamily: FONTS[400], fontSize: 11, color: C.subtle, marginTop: 2 }}>{q.desc}</Text>
                    </View>
                    <Text style={{ fontFamily: MONO[500], fontSize: 10.5, color: C.lighter }}>{q.handle}</Text>
                  </Press>
                ))}
              </View>
            </>
          )}
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
