import { ScrollView, Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { C, FONTS } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Field } from '../ui/Field';
import { Cta, Divider, StrengthBars } from '../ui/bits';

export function Signup() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 28, paddingBottom: 32, backgroundColor: C.bg, flexGrow: 1 }}>
      <Press style={{ width: 44, height: 44, marginLeft: -10, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
        scale={0.92} activeBg="rgba(22,24,31,.06)" onPress={v.goLogin}>
        <Icon name="arrow_back" size={24} color={C.ink} />
      </Press>
      <Text style={{ fontFamily: FONTS[800], fontSize: 32, lineHeight: 35, letterSpacing: -1.1, color: C.ink, marginTop: 20 }}>
        Create your{'\n'}account
      </Text>
      <Text style={{ fontFamily: FONTS[400], fontSize: 15, lineHeight: 24, color: C.muted, marginTop: 10 }}>
        Free forever. Report what you find, search for what you lost.
      </Text>

      <View style={{ marginTop: 26, gap: 8 }}>
        <Field icon="person" value={v.suUser} onChange={v.onSuUser} placeholder="Choose a username" />
        <Field icon="mail" value={v.suEmail} onChange={v.onSuEmail} placeholder="Email address" keyboardType="email-address" />
        <Field icon="lock" value={v.suPass} onChange={v.onSuPass} placeholder="Password" secure />
        <StrengthBars strength={v.strength} color={v.strengthColor} />
        <Text style={{ fontFamily: FONTS[500], fontSize: 11.5, color: v.strengthColor, marginTop: 2 }}>{v.strengthLabel}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field icon="lock_reset" value={v.suConfirm} onChange={v.onSuConfirm} placeholder="Confirm password" secure />
          </View>
          {!!v.suMatchGlyph && <Icon name={v.suMatchGlyph} size={22} color={v.suMatchColor} />}
        </View>

        <Press style={{ flexDirection: 'row', gap: 10, marginTop: 6, paddingVertical: 8 }} scale={1} onPress={v.toggleTerms}>
          <View style={{
            width: 20, height: 20, marginTop: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
            backgroundColor: v.suTerms ? C.primary : C.white,
            ...(v.suTerms ? null : { boxShadow: 'inset 0 0 0 1.5px #D6D5D0' }),
          }}>
            {v.suTerms ? <Icon name="check" size={15} color={C.white} /> : null}
          </View>
          <Text style={{ flex: 1, fontFamily: FONTS[500], fontSize: 12.5, lineHeight: 19, color: C.muted }}>
            I agree to the community guidelines and safe meetup rules.
          </Text>
        </Press>

        {!!v.suError && (
          <View style={{ flexDirection: 'row', gap: 9, padding: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: 'rgba(180,35,24,.08)' }}>
            <Icon name="error" size={19} color={C.danger} />
            <Text style={{ flex: 1, fontFamily: FONTS[500], fontSize: 12.5, lineHeight: 19, color: C.danger }}>{v.suError}</Text>
          </View>
        )}

        <Cta label="Create account" on={v.signupEnabled} onPress={v.submitSignup} style={{ marginTop: 8 }} />

        <Divider label="Or continue with a social account" />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {v.socials.map((s) => (
            <Press key={s.name} style={{
              flex: 1, minHeight: 64, borderRadius: 20, backgroundColor: C.white,
              alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 1px 2px rgba(22,24,31,.05), 0 12px 26px -20px rgba(22,24,31,.45)',
            }} scale={0.95} onPress={s.go}>
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

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontFamily: FONTS[400], fontSize: 13, color: C.muted }}>Already a member? </Text>
          <Press onPress={v.goLogin}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.primary }}>Sign in</Text>
          </Press>
        </View>
      </View>
    </ScrollView>
  );
}
