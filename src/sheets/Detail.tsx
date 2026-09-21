import { Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { C, FONTS, MONO } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Chip, Cta } from '../ui/bits';
import { Sheet } from './SheetHost';

export function DetailSheet() {
  const v = useVals();
  const d = v.detail;
  return (
    <Sheet
      footer={
        <>
          {v.canClaim && <Cta label={v.claimLabel} on onPress={v.claim} />}
          {v.isOwner && (
            <>
              <Text style={{ fontFamily: FONTS[400], fontSize: 11.5, lineHeight: 17, color: C.subtle }}>{v.ownerHint}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {v.ownerStatuses.map((s) => (
                  <Press key={s.name} style={{
                    flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: s.on ? C.ink : C.fillSoft,
                  }} scale={0.97} onPress={s.pick}>
                    <Text style={{ fontFamily: FONTS[700], fontSize: 12, color: s.on ? C.white : C.muted }}>{s.name}</Text>
                  </Press>
                ))}
              </View>
              <Cta label={v.handoverLabel} on onPress={v.toggleHandover} />
              <Press style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }} scale={0.98} onPress={v.withdrawPost}>
                <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.danger }}>Withdraw this post</Text>
              </Press>
            </>
          )}
          {v.isAdmin && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Press style={{ flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: C.fillSoft, alignItems: 'center', justifyContent: 'center' }}
                scale={0.97} onPress={v.flagRecord}>
                <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.ink }}>Send to queue</Text>
              </Press>
              <Press style={{ flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: 'rgba(180,35,24,.1)', alignItems: 'center', justifyContent: 'center' }}
                scale={0.97} onPress={v.deleteRecord}>
                <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.danger }}>Delete record</Text>
              </Press>
            </View>
          )}
        </>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={d.icon} size={28} color={C.ink} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONTS[800], fontSize: 19, letterSpacing: -0.4, color: C.ink }}>{d.title}</Text>
          <Text style={{ fontFamily: MONO[500], fontSize: 10.5, color: C.lighter, marginTop: 3 }}>{d.id}</Text>
        </View>
        <Chip status={d.status} />
      </View>

      <Text style={{ fontFamily: FONTS[400], fontSize: 13.5, lineHeight: 21, color: C.muted, marginTop: 16 }}>{d.desc}</Text>

      <View style={{ gap: 1, marginTop: 18, borderRadius: 18, backgroundColor: C.fillSoft, overflow: 'hidden' }}>
        {v.detailRows.map((r) => (
          <View key={r.k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
            <Text style={{ fontFamily: FONTS[500], fontSize: 12.5, color: C.subtle }}>{r.k}</Text>
            <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, color: C.ink, maxWidth: '62%', textAlign: 'right' }}>{r.v}</Text>
          </View>
        ))}
      </View>
    </Sheet>
  );
}
