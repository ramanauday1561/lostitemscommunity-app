import { Text, TextInput, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { C, FONTS, MONO } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Field } from '../ui/Field';
import { Avatar, Cta, Kicker, Pill } from '../ui/bits';
import { Sheet } from './SheetHost';

export function NewThreadSheet() {
  const v = useVals();
  return (
    <Sheet title="Start a discussion" footer={<Cta label="Publish to the forum" on={v.publishEnabled} onPress={v.publishThread} />}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {v.newTopics.map((t) => <Pill key={t.name} label={t.name} on={t.on} onPress={t.pick} />)}
      </View>
      <Field icon="title" value={v.ntTitle} onChange={v.onNtTitle} placeholder="Give it a clear title" />
      <TextInput
        value={v.ntBody} onChangeText={v.onNtBody}
        placeholder="Share what you saw, where and when."
        placeholderTextColor={C.faint} multiline
        style={{
          minHeight: 120, padding: 16, marginTop: 8, borderRadius: 18, backgroundColor: C.fillSoft,
          fontFamily: FONTS[500], fontSize: 14, lineHeight: 21, color: C.ink,
          textAlignVertical: 'top', outlineStyle: 'none',
        } as object}
      />
    </Sheet>
  );
}

export function GuidelinesSheet() {
  const v = useVals();
  return (
    <Sheet title="Safe meetup rules" footer={<Cta label="I understand" on onPress={v.acceptGuidelines} />}>
      <View style={{ gap: 14 }}>
        {v.guidelineRules.map((g) => (
          <View key={g.title} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={g.icon} size={19} color={C.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.ink }}>{g.title}</Text>
              <Text style={{ fontFamily: FONTS[400], fontSize: 12.5, lineHeight: 19, color: C.muted, marginTop: 4 }}>{g.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

export function ProfileSheet() {
  const v = useVals();
  return (
    <Sheet
      footer={
        <>
          <Press style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.fillSoft }}
            scale={0.98} onPress={v.toastSupport}>
            <Icon name="support_agent" size={20} color={C.primary} />
            <Text style={{ flex: 1, fontFamily: FONTS[600], fontSize: 13.5, color: C.ink }}>Help and support</Text>
            <Icon name="chevron_right" size={18} color={C.lighter} />
          </Press>
          <Press style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.fillSoft }}
            scale={0.98} onPress={v.openGuidelines}>
            <Icon name="shield" size={20} color={C.primary} />
            <Text style={{ flex: 1, fontFamily: FONTS[600], fontSize: 13.5, color: C.ink }}>Safe meetup rules</Text>
            <Icon name="chevron_right" size={18} color={C.lighter} />
          </Press>
          <Press style={{ minHeight: 52, borderRadius: 18, backgroundColor: 'rgba(180,35,24,.08)', alignItems: 'center', justifyContent: 'center' }}
            scale={0.98} onPress={v.logout}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.danger }}>Sign out</Text>
          </Press>
        </>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <Avatar text={v.initials} size={56} bg={C.bg} color={C.primary} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONTS[800], fontSize: 19, letterSpacing: -0.4, color: C.ink }}>{v.meName}</Text>
          <Text numberOfLines={1} style={{ fontFamily: MONO[500], fontSize: 11, color: C.lighter, marginTop: 3 }}>{v.meEmail}</Text>
        </View>
      </View>
      <View style={{ gap: 1, marginTop: 18, borderRadius: 18, backgroundColor: C.fillSoft, overflow: 'hidden' }}>
        {v.settings.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14 }}>
            <Text style={{ fontFamily: FONTS[500], fontSize: 12.5, color: C.subtle }}>{s.label}</Text>
            <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, color: C.ink }}>{s.value}</Text>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

export function AdSheet() {
  const v = useVals();
  const a = v.adEdit;
  return (
    <Sheet title={`Edit ${a.id}`} footer={<Cta label="Save placement" on onPress={v.saveAd} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={a.screenIcon} size={21} color={C.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>{a.screen}</Text>
          <Text style={{ fontFamily: FONTS[400], fontSize: 11.5, color: C.subtle, marginTop: 2 }}>{a.slot} · {a.size}</Text>
        </View>
      </View>

      <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, color: C.muted, marginTop: 18, marginBottom: 10 }}>Campaign</Text>
      <View style={{ gap: 8 }}>
        {v.adCampaigns.map((c) => (
          <Press key={c.key} style={{
            flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 62, paddingHorizontal: 14,
            borderRadius: 18, backgroundColor: c.on ? 'rgba(11,107,203,.08)' : C.fillSoft,
            ...(c.on ? { boxShadow: 'inset 0 0 0 1.5px #0B6BCB' } : null),
          }} scale={0.98} onPress={c.pick}>
            <Icon name={c.mark} size={20} color={c.on ? C.primary : C.radio} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.ink }}>{c.campaign}</Text>
              <Text style={{ fontFamily: FONTS[400], fontSize: 11, color: C.subtle, marginTop: 2 }}>{c.advertiser} · {c.rate}</Text>
            </View>
          </Press>
        ))}
      </View>

      <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, color: C.muted, marginTop: 18, marginBottom: 10 }}>Run for</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {v.adDurations.map((d) => (
          <Press key={d.label} style={{
            flex: 1, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
            backgroundColor: d.on ? C.ink : C.fillSoft,
          }} scale={0.96} onPress={d.pick}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 12.5, color: d.on ? C.white : C.muted }}>{d.label}</Text>
          </Press>
        ))}
      </View>

      <View style={{ marginTop: 18, padding: 16, borderRadius: 20, backgroundColor: C.fillSoft }}>
        <Kicker>Projected revenue</Kicker>
        <Text style={{ fontFamily: FONTS[800], fontSize: 26, color: C.success, marginTop: 6 }}>{a.projected}</Text>
        <Text style={{ fontFamily: FONTS[400], fontSize: 11.5, color: C.subtle, marginTop: 2 }}>{a.projectedNote}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {a.metrics.map((m) => (
            <View key={m.label} style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.ink }}>{m.value}</Text>
              <Text style={{ fontFamily: FONTS[500], fontSize: 10, color: C.subtle, marginTop: 2 }}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Sheet>
  );
}
