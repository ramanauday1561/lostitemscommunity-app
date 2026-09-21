import { ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVals } from '../StoreProvider';
import { C, FONTS, MONO, SHADOW } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Avatar, Card, Chip } from '../ui/bits';
import { AdSlot } from '../ui/AdSlot';

const page = { paddingHorizontal: 20, paddingBottom: 32, gap: 16 };

/** Section heading with an optional action on the right. */
function SectionHead({ title, action, onAction, badge }: {
  title: string; action?: string; onAction?: () => void; badge?: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
      <Text style={{ fontFamily: FONTS[800], fontSize: 18, letterSpacing: -0.45, color: C.ink }}>{title}</Text>
      {badge}
      {action ? (
        <Press style={{ minHeight: 44, paddingLeft: 8, justifyContent: 'center' }} scale={1} onPress={onAction}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 12.5, color: C.primary }}>{action}</Text>
        </Press>
      ) : null}
    </View>
  );
}

/** Horizontal item card used by both the member and new-member dashboards. */
function HandedInCard({ it }: { it: { id: string; title: string; location: string; status: string; icon: string; open: () => void } }) {
  return (
    <Press
      style={[{ width: 184, backgroundColor: C.white, borderRadius: 26, padding: 8 }, SHADOW.card]}
      scale={0.97} onPress={it.open}
    >
      <LinearGradient
        colors={['#F4F4F2', '#E9E9E5']}
        start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
        style={{ height: 112, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name={it.icon} size={40} color="#b7bbc1" />
        <View style={{ position: 'absolute', top: 10, left: 10 }}>
          <Chip status={it.status} style={{ backgroundColor: 'rgba(255,255,255,.94)', boxShadow: '0 2px 8px rgba(22,24,31,.14)' }} />
        </View>
      </LinearGradient>
      <View style={{ paddingHorizontal: 10, paddingTop: 12, paddingBottom: 8 }}>
        <Text numberOfLines={1} style={{ fontFamily: FONTS[700], fontSize: 14.5, letterSpacing: -0.2, color: C.ink }}>{it.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
          <Icon name="location_on" size={15} color={C.subtle} />
          <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONTS[500], fontSize: 11.5, color: C.subtle }}>{it.location}</Text>
        </View>
      </View>
    </Press>
  );
}

function HandedInRow() {
  const v = useVals();
  return (
    <ScrollView
      horizontal showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}
    >
      {v.handedIn.map((it) => <HandedInCard key={it.id} it={it} />)}
    </ScrollView>
  );
}

export function UserDash() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={{ ...page, gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {v.myStats.map((s) => (
          <Card key={s.label} style={{ flex: 1, padding: 14, borderRadius: 22 }}>
            <Text style={{ fontFamily: FONTS[800], fontSize: 22, color: s.color }}>{s.value}</Text>
            <Text style={{ fontFamily: FONTS[500], fontSize: 10.5, color: C.subtle, marginTop: 3 }}>{s.label}</Text>
          </Card>
        ))}
      </View>
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
      <View>
        <SectionHead title="Recently handed in" action="See all" onAction={v.goFound} />
        <HandedInRow />
      </View>
      <AdSlot ad={v.adHome} />
      <View>
        <SectionHead title="Community activity" />
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

/** Sponsored placeholder used on the new-member dashboard. */
function SponsoredSlot() {
  const v = useVals();
  const ad = v.adHome as { live: boolean; id?: string; icon?: string; size?: string; campaign?: string; advertiser?: string };
  if (!ad.live) return null;
  return (
    <View style={[{ backgroundColor: C.white, borderRadius: 26, padding: 8 }, SHADOW.card]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 }}>
        <Text style={{ fontFamily: MONO[600], fontSize: 10, letterSpacing: 1.4, color: C.lighter }}>SPONSORED</Text>
        <Text style={{ fontFamily: MONO[500], fontSize: 10, color: C.barIdle }}>{ad.id}</Text>
      </View>
      <View style={{
        height: 104, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D8D8D3',
        backgroundColor: '#FAFAF8', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <Icon name={ad.icon || 'campaign'} size={26} color={C.lighter} />
        <Text style={{ fontFamily: MONO[600], fontSize: 11, letterSpacing: 0.66, color: C.lighter }}>{ad.size}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingTop: 12, paddingBottom: 6 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>{ad.campaign}</Text>
          <Text style={{ fontFamily: FONTS[500], fontSize: 11.5, color: C.subtle, marginTop: 3 }}>{ad.advertiser}</Text>
        </View>
        <View style={{ minHeight: 36, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.bg, justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 12, color: C.primary }}>Learn more</Text>
        </View>
      </View>
    </View>
  );
}

export function FreshDash() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={{ ...page, gap: 20 }}>
      <View style={{
        paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, borderRadius: 28,
        backgroundColor: '#101319', boxShadow: '0 20px 40px -24px rgba(16,19,25,.8)',
      }}>
        <View style={{
          alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(0,227,155,.14)',
        }}>
          <Icon name="celebration" size={14} color="#00E39B" />
          <Text style={{ fontFamily: MONO[600], fontSize: 10, letterSpacing: 1.2, color: '#00E39B' }}>NEW MEMBER</Text>
        </View>
        <Text style={{ fontFamily: FONTS[800], fontSize: 26, lineHeight: 30, letterSpacing: -0.9, color: C.white, marginTop: 16 }}>
          Welcome to Lost Items Community, Nadia.
        </Text>
        <Text style={{ fontFamily: FONTS[400], fontSize: 13.5, lineHeight: 22, color: 'rgba(255,255,255,.6)', marginTop: 10, marginBottom: 18 }}>
          Your account is empty for now. Report something you lost, or hand in something you found — both take under a minute.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Press style={[{ flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }, SHADOW.send]}
            scale={0.97} onPress={v.openReport}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.white }}>Report an item</Text>
          </Press>
          <Press style={{ minHeight: 48, paddingHorizontal: 18, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}
            scale={0.97} onPress={v.openGuidelines}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.white }}>The rules</Text>
          </Press>
        </View>
      </View>

      <View>
        <SectionHead
          title="Set up your account"
          badge={<Text style={{ fontFamily: MONO[600], fontSize: 11, color: C.subtle }}>{v.setupProgress}</Text>}
        />
        <View style={[{ backgroundColor: C.white, borderRadius: 26, padding: 8 }, SHADOW.card]}>
          {v.setupSteps.map((s) => (
            <Press key={s.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 10, paddingHorizontal: 12 }}
              scale={1} onPress={s.go}>
              <View style={{
                width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                backgroundColor: s.done ? 'rgba(15,123,61,.12)' : C.bg,
              }}>
                <Icon name={s.mark} size={18} color={s.done ? C.success : C.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: s.done ? C.subtle : C.ink }}>{s.title}</Text>
                <Text style={{ fontFamily: FONTS[400], fontSize: 12, lineHeight: 17, color: C.subtle, marginTop: 3 }}>{s.desc}</Text>
              </View>
              <Icon name="chevron_right" size={21} color={C.barIdle} />
            </Press>
          ))}
        </View>
      </View>

      <View>
        <SectionHead title="Happening near you" action="See all" onAction={v.goFound} />
        <HandedInRow />
      </View>

      <SponsoredSlot />

      <View style={[{ flexDirection: 'row', gap: 12, padding: 18, borderRadius: 26, backgroundColor: C.white }, SHADOW.card]}>
        <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(11,107,203,.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="inbox" size={21} color={C.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>No messages yet</Text>
          <Text style={{ fontFamily: FONTS[400], fontSize: 12.5, lineHeight: 19, color: C.subtle, marginTop: 3 }}>
            Claim an item or post a report and conversations land in your inbox.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export function AdminDash() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={page}>
      <Press style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 76, paddingHorizontal: 18, backgroundColor: C.white, borderRadius: 26 }, SHADOW.card]}
        scale={0.985} onPress={v.goAds}>
        <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(15,123,61,.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="payments" size={23} color={C.success} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 15, letterSpacing: -0.22, color: C.ink }}>Ad placements & revenue</Text>
          <Text style={{ fontFamily: FONTS[500], fontSize: 12, color: C.subtle, marginTop: 3 }}>{v.adRevenue} this month · {v.adLiveCount}</Text>
        </View>
        <Icon name="chevron_right" size={21} color={C.barIdle} />
      </Press>

      <View style={{ backgroundColor: '#101319', borderRadius: 28, padding: 20, boxShadow: '0 20px 40px -24px rgba(16,19,25,.8)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="flag" size={16} color="#FF8A80" />
          <Text style={{ fontFamily: MONO[600], fontSize: 10, letterSpacing: 1.4, color: 'rgba(255,255,255,.5)' }}>NEEDS MODERATION</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Text style={{ fontFamily: FONTS[800], fontSize: 46, letterSpacing: -2.3, color: C.white }}>{v.flaggedCount}</Text>
            <Text style={{ fontFamily: FONTS[500], fontSize: 13, color: 'rgba(255,255,255,.55)' }}>flagged posts</Text>
          </View>
          <Press style={[{ minHeight: 44, paddingHorizontal: 20, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }, SHADOW.send]}
            scale={0.96} onPress={v.goModeration}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.white }}>Review</Text>
          </Press>
        </View>
      </View>

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}
      >
        {v.adminMetrics.map((m) => (
          <View key={m.label} style={[{ width: 176, backgroundColor: C.white, borderRadius: 24, padding: 18 }, SHADOW.card]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Icon name={m.icon} size={16} color={m.iconColor} />
              <Text style={{ fontFamily: FONTS[600], fontSize: 11, color: C.subtle }}>{m.label}</Text>
            </View>
            <Text style={{ fontFamily: FONTS[800], fontSize: 28, letterSpacing: -1.1, color: m.color, marginTop: 12 }}>{m.value}</Text>
            <Text style={{ fontFamily: FONTS[600], fontSize: 11, color: m.deltaColor, marginTop: 6 }}>{m.delta}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[{ backgroundColor: C.white, borderRadius: 28, padding: 20 }, SHADOW.card]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text style={{ fontFamily: FONTS[800], fontSize: 16, letterSpacing: -0.32, color: C.ink }}>Conversation & sentiment</Text>
          <Press style={{ minHeight: 44, paddingLeft: 8, justifyContent: 'center' }} scale={1} onPress={v.goAnalysis}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 12.5, color: C.primary }}>Open hub</Text>
          </Press>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <View style={{ flex: 1, padding: 14, borderRadius: 20, backgroundColor: C.fillSoft }}>
            <Text style={{ fontFamily: FONTS[800], fontSize: 24, letterSpacing: -0.96, color: C.ink }}>142</Text>
            <Text style={{ fontFamily: FONTS[600], fontSize: 11, color: C.subtle, marginTop: 3 }}>Active threads</Text>
          </View>
          <View style={{ flex: 1, padding: 14, borderRadius: 20, backgroundColor: C.fillSoft }}>
            <Text style={{ fontFamily: FONTS[800], fontSize: 24, letterSpacing: -0.96, color: C.success }}>94.2%</Text>
            <Text style={{ fontFamily: FONTS[600], fontSize: 11, color: C.subtle, marginTop: 3 }}>Positive</Text>
            <View style={{ height: 5, borderRadius: 999, backgroundColor: '#E3E3DF', marginTop: 10, overflow: 'hidden' }}>
              <View style={{ width: '94.2%', height: '100%', borderRadius: 999, backgroundColor: C.success }} />
            </View>
          </View>
        </View>
        <View style={{ marginTop: 8, gap: 2 }}>
          {v.sentimentRows.map((r) => (
            <View key={r.k} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 48, paddingHorizontal: 4 }}>
              <Text style={{ fontFamily: FONTS[500], fontSize: 13, color: C.muted }}>{r.k}</Text>
              <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: r.color }}>{r.v}</Text>
            </View>
          ))}
        </View>
      </View>

      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8, marginBottom: 12 }}>
          <Text style={{ fontFamily: FONTS[800], fontSize: 18, letterSpacing: -0.45, color: C.ink }}>Flagged content</Text>
          <View style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(180,35,24,.1)' }}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 11, color: C.danger }}>{v.flaggedCount} pending</Text>
          </View>
        </View>
        <View style={{ gap: 8 }}>
          {v.flagged.map((f) => (
            <View key={f.id} style={[{ backgroundColor: C.white, borderRadius: 24, padding: 16 }, SHADOW.card]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ fontFamily: MONO[500], fontSize: 10.5, color: C.subtle }}>{f.id}</Text>
                <View style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(180,35,24,.1)' }}>
                  <Text style={{ fontFamily: FONTS[600], fontSize: 10.5, color: C.danger }}>{f.reason}</Text>
                </View>
              </View>
              <Text style={{ fontFamily: FONTS[700], fontSize: 15, lineHeight: 20, letterSpacing: -0.22, color: C.ink, marginTop: 10 }}>{f.title}</Text>
              <Text style={{ fontFamily: MONO[500], fontSize: 12, color: C.subtle, marginTop: 4 }}>{f.sub}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                <Press style={{ flex: 1, minHeight: 44, borderRadius: 16, backgroundColor: 'rgba(15,123,61,.1)', alignItems: 'center', justifyContent: 'center' }}
                  scale={0.97} activeBg="rgba(15,123,61,.2)" onPress={f.approve}>
                  <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.success }}>Approve</Text>
                </Press>
                <Press style={{ flex: 1, minHeight: 44, borderRadius: 16, backgroundColor: 'rgba(180,35,24,.1)', alignItems: 'center', justifyContent: 'center' }}
                  scale={0.97} activeBg="rgba(180,35,24,.2)" onPress={f.remove}>
                  <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.danger }}>Remove</Text>
                </Press>
              </View>
            </View>
          ))}
          {v.flaggedEmpty && (
            <View style={{ backgroundColor: C.white, borderRadius: 24, paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center', boxShadow: '0 1px 2px rgba(22,24,31,.05)' }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(15,123,61,.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="task_alt" size={26} color={C.success} />
              </View>
              <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink, marginTop: 14 }}>Queue clear</Text>
              <Text style={{ fontFamily: FONTS[400], fontSize: 12.5, color: C.subtle, marginTop: 4 }}>No flagged content pending review.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[{ backgroundColor: C.white, borderRadius: 28, padding: 20 }, SHADOW.card]}>
        <Text style={{ fontFamily: FONTS[800], fontSize: 16, letterSpacing: -0.32, color: C.ink }}>857 new scouts today</Text>
        <Text style={{ fontFamily: FONTS[400], fontSize: 12.5, lineHeight: 19, color: C.subtle, marginTop: 6, marginBottom: 16 }}>
          Send a welcome message to everyone joining the recovery network.
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {v.scouts.map((s) => (
            <LinearGradient key={s.ini} colors={['#F4F4F2', '#E7E7E3']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
              style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: MONO[600], fontSize: 11, color: C.muted }}>{s.ini}</Text>
            </LinearGradient>
          ))}
          <Press style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(11,107,203,.1)', alignItems: 'center', justifyContent: 'center' }}
            scale={0.92} onPress={v.goMembers}>
            <Icon name="arrow_forward" size={20} color={C.primary} />
          </Press>
        </View>
      </View>
    </ScrollView>
  );
}
