import { ScrollView, Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { C, FONTS } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Field } from '../ui/Field';
import { Cta, Kicker, StrengthBars } from '../ui/bits';

export function Forgot() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 20, paddingBottom: 32, backgroundColor: C.bg, flexGrow: 1 }}>
      <Press style={{ width: 44, height: 44, marginLeft: -10, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
        scale={0.92} activeBg="rgba(22,24,31,.06)" onPress={v.fpBack}>
        <Icon name="arrow_back" size={24} color={C.ink} />
      </Press>

      <View style={{ flexDirection: 'row', gap: 6, marginTop: 20 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: i <= Math.min(v.fpIdx, 2) ? C.primary : C.line }} />
        ))}
      </View>

      <View style={{ marginTop: 16 }}><Kicker color={C.primary}>{v.fpKicker}</Kicker></View>
      <Text style={{ fontFamily: FONTS[800], fontSize: 32, lineHeight: 35, letterSpacing: -1.1, color: C.ink, marginTop: 10 }}>{v.fpTitle}</Text>
      <Text style={{ fontFamily: FONTS[400], fontSize: 15, lineHeight: 24, color: C.muted, marginTop: 10 }}>{v.fpBody}</Text>

      <View style={{ marginTop: 26 }}>
        {v.fpIsEmail && (
          <Field icon="mail" value={v.fpEmail} onChange={v.onFpEmail} placeholder="Email on your account" keyboardType="email-address" />
        )}

        {v.fpIsCode && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingHorizontal: 16, borderRadius: 18, backgroundColor: 'rgba(11,107,203,.07)', marginBottom: 12 }}>
              <Icon name="mark_email_read" size={20} color={C.primary} />
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONTS[500], fontSize: 12.5, color: C.primary }}>Code sent to {v.fpEmail}</Text>
            </View>
            <Field icon="pin" value={v.fpCode} onChange={v.onFpCode} placeholder="6-digit code" keyboardType="number-pad" maxLength={6} />
            <Press style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: 4 }} scale={1} onPress={v.fpResend}>
              <Text style={{ fontFamily: FONTS[600], fontSize: 13, color: C.primary }}>Resend code</Text>
            </Press>
          </>
        )}

        {v.fpIsReset && (
          <>
            <Field icon="lock" value={v.fpPass} onChange={v.onFpPass} placeholder="New password" secure />
            <StrengthBars strength={v.fpStrength} color={v.fpStrengthColor} />
            <Text style={{ fontFamily: FONTS[500], fontSize: 11.5, color: v.fpStrengthColor, marginTop: 6, marginBottom: 8 }}>{v.fpStrengthLabel}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Field icon="lock_reset" value={v.fpConfirm} onChange={v.onFpConfirm} placeholder="Confirm new password" secure />
              </View>
              {!!v.fpMatchGlyph && <Icon name={v.fpMatchGlyph} size={22} color={v.fpMatchColor} />}
            </View>
          </>
        )}

        {v.fpIsDone && (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(15,123,61,.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check_circle" size={38} color={C.success} />
            </View>
          </View>
        )}

        {!!v.fpError && (
          <View style={{ marginTop: 8, flexDirection: 'row', gap: 9, padding: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: 'rgba(180,35,24,.08)' }}>
            <Icon name="error" size={19} color={C.danger} />
            <Text style={{ flex: 1, fontFamily: FONTS[500], fontSize: 12.5, lineHeight: 19, color: C.danger }}>{v.fpError}</Text>
          </View>
        )}

        <Cta label={v.fpPrimaryLabel} on={v.fpPrimaryEnabled} onPress={v.fpPrimary} style={{ marginTop: 16 }} />

        {v.fpShowSignInLink && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontFamily: FONTS[400], fontSize: 13, color: C.muted }}>Remembered it? </Text>
            <Press onPress={() => v.fpBack()}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.primary }}>Back to sign in</Text>
            </Press>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
