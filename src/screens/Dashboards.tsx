import { Image, ScrollView, Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { C, FONTS, MONO, SHADOW } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Avatar, Card, Chip, Kicker } from '../ui/bits';
import { AdSlot } from '../ui/AdSlot';
import { img } from '../data/assets';

const pad = { paddingHorizontal: 20, paddingBottom: 28, gap: 14 };

function StatRow({ stats }: { stats: { value: string; label: string; color: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {stats.map((s) => (
        <Card key={s.label} style={{ flex: 1, padding: 14, borderRadius: 22 }}>
          <Text style={{ fontFamily: FONTS[800], fontSize: 22, color: s.color }}>{s.value}</Text>
          <Text style={{ fontFamily: FONTS[500], fontSize: 10.5, color: C.subtle, marginTop: 3 }}>{s.label}</Text>
        </Card>
      ))}
    </View>
  );
}

function HandedInStrip() {
  const v = useVals();
  return (
    <View>
      <Text style={{ fontFamily: FONTS[700], fontSize: 15, color: C.ink, marginBottom: 10 }}>Recently handed in</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 8 }}>
        {v.handedIn.map((it) => (
          <Press key={it.id} style={[{ width: 148, borderRadius: 22, backgroundColor: C.white, overflow: 'hidden' }, SHADOW.card]}
            scale={0.97} onPress={it.open}>
            <View style={{ height: 92, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={it.icon} size={34} color={C.ink} />
              <View style={{ position: 'absolute', top: 10, left: 10 }}><Chip status={it.status} /></View>
            </View>
            <View style={{ padding: 11 }}>
              <Text numberOfLines={1} style={{ fontFamily: FONTS[700], fontSize: 12.5, color: C.ink }}>{it.title}</Text>
              <Text numberOfLines={1} style={{ fontFamily: FONTS[400], fontSize: 10.5, color: C.subtle, marginTop: 2 }}>{it.location}</Text>
            </View>
          </Press>
        ))}
      </ScrollView>
    </View>
  );
}

export function UserDash() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={pad}>
      <StatRow stats={v.myStats} />
      {v.shortcuts.map((s) => (
        <Press key={s.title} style={[{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, borderRadius: 24, backgroundColor: C.white }, SHADOW.card]}
          scale={0.98} onPress={s.go}>
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={s.icon} size={21} color={C.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>{s.title}</Text>
            <Text style={{ fontFamily: FONTS[400], fontSize: 11.5, lineHeight: 17, color: C.subtle, marginTop: 2 }}>{s.desc}</Text>
          </View>
          <Icon name="chevron_right" size={20} color={C.lighter} />
        </Press>
      ))}
      <HandedInStrip />
      <AdSlot ad={v.adHome} />
      <View>
        <Text style={{ fontFamily: FONTS[700], fontSize: 15, color: C.ink, marginBottom: 10 }}>Community activity</Text>
        <View style={{ gap: 10 }}>
          {v.comments.map((c) => (
            <Card key={c.user}>
              <View style={{ flexDirection: 'row', gap: 11 }}>
                <Avatar text={c.ini} size={38} bg={C.bg} color={C.ink} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.ink }}>{c.user}</Text>
                    <Text style={{ fontFamily: MONO[500], fontSize: 10, color: C.lighter }}>{c.time}</Text>
                  </View>
                  <Text style={{ fontFamily: FONTS[600], fontSize: 11.5, color: C.primary, marginTop: 2 }}>on {c.onItem}</Text>
                  <Text style={{ fontFamily: FONTS[400], fontSize: 12.5, lineHeight: 19, color: C.muted, marginTop: 5 }}>{c.text}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

export function FreshDash() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={pad}>
      <Card style={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image source={img('hero-boy-with-dog.webp')} style={{ width: 54, height: 54, borderRadius: 16 }} resizeMode="cover" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS[800], fontSize: 17, color: C.ink }}>Welcome aboard</Text>
            <Text style={{ fontFamily: FONTS[400], fontSize: 12, color: C.muted, marginTop: 2 }}>{v.setupProgress}</Text>
          </View>
        </View>
        <View style={{ gap: 8, marginTop: 14 }}>
          {v.setupSteps.map((s) => (
            <Press key={s.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, borderRadius: 18, backgroundColor: C.fillSoft }}
              scale={0.98} onPress={s.go}>
              <View style={{
                width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                backgroundColor: s.done ? 'rgba(15,123,61,.12)' : C.bg,
              }}>
                <Icon name={s.mark} size={19} color={s.done ? C.success : C.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: s.done ? C.subtle : C.ink }}>{s.title}</Text>
                <Text style={{ fontFamily: FONTS[400], fontSize: 11, color: C.subtle, marginTop: 2 }}>{s.desc}</Text>
              </View>
              <Icon name="chevron_right" size={18} color={C.lighter} />
            </Press>
          ))}
        </View>
      </Card>
      <StatRow stats={v.myStats} />
      <HandedInStrip />
      <AdSlot ad={v.adHome} />
    </ScrollView>
  );
}

export function AdminDash() {
  const v = useVals();
  const tiles = [
    { icon: 'flag', label: 'Moderation', sub: `${v.flaggedCount} pending`, go: v.goModeration, color: C.danger },
    { icon: 'insights', label: 'Analysis', sub: 'Trends and keywords', go: v.goAnalysis, color: C.primary },
    { icon: 'group', label: 'Members', sub: 'Suspend or remove', go: v.goMembers, color: C.ink },
    { icon: 'campaign', label: 'Ad placements', sub: v.adLiveCount, go: v.goAds, color: C.success },
  ];
  return (
    <ScrollView contentContainerStyle={pad}>
      <View style={{ gap: 10 }}>
        {v.adminMetrics.map((m) => (
          <Card key={m.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16 }}>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={m.icon} size={21} color={m.iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS[500], fontSize: 11.5, color: C.subtle }}>{m.label}</Text>
              <Text style={{ fontFamily: FONTS[800], fontSize: 22, color: m.color, marginTop: 1 }}>{m.value}</Text>
            </View>
            <Text style={{ fontFamily: FONTS[600], fontSize: 10.5, color: m.deltaColor }}>{m.delta}</Text>
          </Card>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {tiles.map((t) => (
          <Press key={t.label} style={[{ width: '48%', flexGrow: 1, padding: 16, borderRadius: 24, backgroundColor: C.white, gap: 8 }, SHADOW.card]}
            scale={0.97} onPress={t.go}>
            <Icon name={t.icon} size={22} color={t.color} />
            <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>{t.label}</Text>
            <Text style={{ fontFamily: FONTS[400], fontSize: 11, color: C.subtle }}>{t.sub}</Text>
          </Press>
        ))}
      </View>

      <Card>
        <Kicker>Community sentiment</Kicker>
        <View style={{ gap: 12, marginTop: 12 }}>
          {v.sentimentRows.map((r) => (
            <View key={r.k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONTS[500], fontSize: 12.5, color: C.muted }}>{r.k}</Text>
              <Text style={{ fontFamily: FONTS[700], fontSize: 12.5, color: r.color }}>{r.v}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: -8, marginTop: 16 }}>
          {v.scouts.map((s, i) => (
            <View key={s.ini} style={{ marginLeft: i ? -8 : 0 }}>
              <Avatar text={s.ini} size={32} bg={C.bg} color={C.ink} />
            </View>
          ))}
          <Text style={{ fontFamily: FONTS[500], fontSize: 11.5, color: C.subtle, marginLeft: 12 }}>857 scouts online</Text>
        </View>
      </Card>
    </ScrollView>
  );
}
