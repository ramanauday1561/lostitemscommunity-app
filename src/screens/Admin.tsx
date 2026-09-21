import { ScrollView, Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { C, FONTS, MONO, SHADOW } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Field } from '../ui/Field';
import { Avatar, Card, Chip, Empty, Kicker } from '../ui/bits';

const pad = { padding: 20, paddingTop: 6, paddingBottom: 28, gap: 12 };

export function Moderation() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={pad}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {v.modStats.map((s) => (
          <Card key={s.label} style={{ flex: 1, padding: 14, borderRadius: 22 }}>
            <Text style={{ fontFamily: FONTS[800], fontSize: 22, color: s.color }}>{s.value}</Text>
            <Text style={{ fontFamily: FONTS[500], fontSize: 10.5, color: C.subtle, marginTop: 3 }}>{s.label}</Text>
          </Card>
        ))}
      </View>

      {v.flagged.map((f) => (
        <Card key={f.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(180,35,24,.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="flag" size={19} color={C.danger} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>{f.title}</Text>
              <Text style={{ fontFamily: FONTS[400], fontSize: 11, color: C.subtle, marginTop: 2 }}>{f.sub}</Text>
            </View>
            <Text style={{ fontFamily: MONO[500], fontSize: 10, color: C.lighter }}>{f.id}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: C.fillSoft }}>
            <Icon name="error" size={17} color={C.warnDeep} />
            <Text style={{ flex: 1, fontFamily: FONTS[500], fontSize: 12, color: C.muted }}>{f.reason}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Press style={{ flex: 1, minHeight: 46, borderRadius: 16, backgroundColor: C.fillSoft, alignItems: 'center', justifyContent: 'center' }}
              scale={0.97} onPress={f.approve}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.success }}>Approve</Text>
            </Press>
            <Press style={{ flex: 1, minHeight: 46, borderRadius: 16, backgroundColor: 'rgba(180,35,24,.1)', alignItems: 'center', justifyContent: 'center' }}
              scale={0.97} onPress={f.remove}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.danger }}>Delete</Text>
            </Press>
          </View>
        </Card>
      ))}
      {v.flaggedEmpty && <Empty icon="task_alt" title="Queue is clear" body="Nothing is waiting for review right now." />}
    </ScrollView>
  );
}

export function Analysis() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={pad}>
      <Card>
        <Kicker>Reports this week</Kicker>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, marginTop: 16, gap: 6 }}>
          {v.bars.map((b, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
              <View style={{ width: '100%', maxWidth: 24, height: b.height, borderRadius: 8, backgroundColor: b.on ? C.primary : C.chartTrack }} />
              <Text style={{ fontFamily: MONO[500], fontSize: 10, color: C.lighter }}>{b.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Kicker>Flagged keywords</Kicker>
        <View style={{ gap: 10, marginTop: 12 }}>
          {v.keywords.map((k) => (
            <View key={k.word} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <Icon name="warning" size={17} color={C.warnDeep} />
                <Text style={{ fontFamily: FONTS[600], fontSize: 13, color: C.ink }}>{k.word}</Text>
              </View>
              <Text style={{ fontFamily: MONO[500], fontSize: 11, color: C.danger }}>{k.hits}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Kicker>Signals</Kicker>
        <View style={{ gap: 12, marginTop: 12 }}>
          {v.sentimentRows.map((r) => (
            <View key={r.k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: FONTS[500], fontSize: 12.5, color: C.muted }}>{r.k}</Text>
              <Text style={{ fontFamily: FONTS[700], fontSize: 12.5, color: r.color }}>{r.v}</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

export function Members() {
  const v = useVals();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Field icon="search" value={v.uq} onChange={v.onUserQuery} placeholder="Search members" compact />
      </View>
      <ScrollView contentContainerStyle={{ ...pad, paddingTop: 14 }}>
        {v.members.map((m) => (
          <Card key={m.name}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <Avatar text={m.ini} size={40} bg={C.bg} color={C.ink} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>{m.name}</Text>
                <Text numberOfLines={1} style={{ fontFamily: FONTS[400], fontSize: 11, color: C.subtle, marginTop: 2 }}>{m.meta}</Text>
              </View>
              <Chip status={m.chipKey} label={m.status} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Press style={{ flex: 1, minHeight: 44, borderRadius: 16, backgroundColor: C.fillSoft, alignItems: 'center', justifyContent: 'center' }}
                scale={0.97} onPress={m.toggle}>
                <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.ink }}>{m.toggleLabel}</Text>
              </Press>
              <Press style={{ flex: 1, minHeight: 44, borderRadius: 16, backgroundColor: 'rgba(180,35,24,.1)', alignItems: 'center', justifyContent: 'center' }}
                scale={0.97} onPress={m.remove}>
                <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.danger }}>Remove</Text>
              </Press>
            </View>
          </Card>
        ))}
        {v.membersEmpty && <Empty icon="person_off" title="No members match" body="Try a different name or handle." />}
      </ScrollView>
    </View>
  );
}

export function Ads() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={pad}>
      <Card>
        <Kicker>Revenue this month</Kicker>
        <Text style={{ fontFamily: FONTS[800], fontSize: 32, color: C.ink, marginTop: 6 }}>{v.adRevenue}</Text>
        <Text style={{ fontFamily: FONTS[600], fontSize: 11.5, color: C.success, marginTop: 2 }}>{v.adRevenueDelta}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          {v.adTotals.map((s) => (
            <View key={s.label} style={{ flex: 1, padding: 12, borderRadius: 18, backgroundColor: C.fillSoft }}>
              <Text style={{ fontFamily: FONTS[800], fontSize: 16, color: C.ink }}>{s.value}</Text>
              <Text style={{ fontFamily: FONTS[500], fontSize: 10, color: C.subtle, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {v.adSlots.map((a) => (
        <Card key={a.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={a.screenIcon} size={20} color={C.ink} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>{a.screen}</Text>
              <Text numberOfLines={1} style={{ fontFamily: FONTS[400], fontSize: 11, color: C.subtle, marginTop: 2 }}>{a.slot}</Text>
            </View>
            <View style={{
              paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999,
              backgroundColor: a.live ? 'rgba(15,123,61,.1)' : a.ended ? 'rgba(180,35,24,.1)' : C.bg,
            }}>
              <Text style={{ fontFamily: FONTS[600], fontSize: 10.5, color: a.live ? C.success : a.ended ? C.danger : C.subtle }}>
                {a.statusLabel}
              </Text>
            </View>
          </View>

          <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, color: C.ink, marginTop: 12 }}>{a.campaign}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {a.metrics.map((m) => (
              <View key={m.label} style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS[800], fontSize: 15, color: m.color }}>{m.value}</Text>
                <Text style={{ fontFamily: FONTS[500], fontSize: 10, color: C.subtle, marginTop: 2 }}>{m.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 6, borderRadius: 999, backgroundColor: C.fill, marginTop: 14, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${a.pct}%`, borderRadius: 999, backgroundColor: a.ended ? C.danger : a.live ? C.success : C.barIdle }} />
          </View>
          <Text style={{ fontFamily: FONTS[500], fontSize: 11, color: a.runColor, marginTop: 6 }}>{a.runLabel}</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Press style={[{
              flex: 1, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
              backgroundColor: a.live ? C.fillSoft : C.primary,
            }, a.live ? null : SHADOW.send]} scale={0.97} onPress={a.toggle}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: a.live ? C.ink : C.white }}>{a.toggleLabel}</Text>
            </Press>
            <Press style={{ minHeight: 48, paddingHorizontal: 18, borderRadius: 16, backgroundColor: C.fillSoft, alignItems: 'center', justifyContent: 'center' }}
              scale={0.97} onPress={a.edit}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.ink }}>Edit</Text>
            </Press>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

export function Messages() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={pad}>
      {v.conversations.map((c) => (
        <Press key={c.itemId} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 24, backgroundColor: C.white }, SHADOW.card]}
          scale={0.98} onPress={c.open}>
          <Avatar text={c.ini} size={44} bg={C.bg} color={C.ink} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONTS[700], fontSize: 13.5, color: C.ink }}>{c.with}</Text>
              <Text style={{ fontFamily: MONO[500], fontSize: 10, color: C.lighter }}>{c.time}</Text>
            </View>
            <Text style={{ fontFamily: FONTS[600], fontSize: 11.5, color: C.primary, marginTop: 2 }}>{c.item}</Text>
            <Text numberOfLines={1} style={{
              fontFamily: c.hasUnread ? FONTS[600] : FONTS[400], fontSize: 12.5,
              color: c.hasUnread ? C.ink : C.subtle, marginTop: 4,
            }}>{c.preview}</Text>
          </View>
          {c.hasUnread && (
            <View style={{ minWidth: 22, height: 22, paddingHorizontal: 7, borderRadius: 999, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 11, color: C.white }}>{c.unread}</Text>
            </View>
          )}
        </Press>
      ))}
      {v.noConversations && (
        <Empty icon="chat_bubble" title="No conversations yet"
          body="When you claim an item or someone claims yours, the chat appears here." />
      )}
    </ScrollView>
  );
}
