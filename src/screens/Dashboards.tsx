import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useVals } from '../StoreProvider';
import { C, FONTS, MONO, SHADOW } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Card } from '../ui/bits';
import { AdSlot } from '../ui/AdSlot';
import { Glass } from '../ui/Glass';
import { rise } from '../ui/motion';

const page = { paddingHorizontal: 20, paddingBottom: 32, gap: 16 };

/** A dark hero card: a deep gradient with a soft coloured glow in one corner. */
function Hero({ children, glow, enter = 0 }: { children: React.ReactNode; glow: string; enter?: number }) {
  return (
    <Animated.View entering={rise(enter)} style={{ borderRadius: 28, overflow: 'hidden', boxShadow: '0 20px 40px -24px rgba(16,19,25,.8)' }}>
      <LinearGradient colors={['#1B2130', '#101319']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 } as object} />
      <View pointerEvents="none" style={{
        position: 'absolute', right: -50, top: -50, width: 170, height: 170, borderRadius: 85,
        backgroundColor: glow, boxShadow: `0 0 90px 50px ${glow}`,
      } as object} />
      {children}
    </Animated.View>
  );
}

/** Red dot that breathes, so a non-empty moderation queue catches the eye. */
function Pulse({ color }: { color: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(t);
  }, [t]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - t.value), transform: [{ scale: 1 + t.value * 1.8 }] }));
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: color }, ring]} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

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

export function UserDash() {
  const v = useVals();
  return (
    <ScrollView contentContainerStyle={{ ...page, gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {v.myStats.map((s, n) => (
          <Card key={s.label} enter={n} style={{ flex: 1, padding: 14, borderRadius: 22 }}>
            <Text style={{ fontFamily: FONTS[800], fontSize: 22, color: s.color }}>{s.value}</Text>
            <Text style={{ fontFamily: FONTS[500], fontSize: 10.5, color: C.subtle, marginTop: 3 }}>{s.label}</Text>
          </Card>
        ))}
      </View>
      {v.shortcuts.map((s, n) => (
        <Animated.View key={s.title} entering={rise(n + 3)}>
        <Press style={[{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, borderRadius: 24, backgroundColor: C.white }, SHADOW.card]}
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
        </Animated.View>
      ))}
      <AdSlot ad={v.adHome} />
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
      <Hero glow="rgba(0,227,155,.22)">
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}>
        <View style={{
          alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(0,227,155,.14)',
        }}>
          <Icon name="celebration" size={14} color="#00E39B" />
          <Text style={{ fontFamily: MONO[600], fontSize: 10, letterSpacing: 1.2, color: '#00E39B' }}>NEW MEMBER</Text>
        </View>
        <Text style={{ fontFamily: FONTS[800], fontSize: 26, lineHeight: 30, letterSpacing: -0.9, color: C.white, marginTop: 16 }}>
          Welcome to Lost Items Community, {v.freshName}.
        </Text>
        <Text style={{ fontFamily: FONTS[400], fontSize: 13.5, lineHeight: 22, color: 'rgba(255,255,255,.6)', marginTop: 10, marginBottom: 18 }}>
          Your account is empty for now. Report something you lost, or hand in something you found — both take under a minute.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Press style={[{ flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }, SHADOW.send]}
            scale={0.97} onPress={v.openReport}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.white }}>Report an item</Text>
          </Press>
          <Press scale={0.97} onPress={v.openGuidelines}>
            <Glass tint="dark" radius={16} style={{ backgroundColor: 'rgba(255,255,255,.1)', boxShadow: 'none' }}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.white, paddingHorizontal: 18, paddingVertical: 14 }}>The rules</Text>
            </Glass>
          </Press>
        </View>
        </View>
      </Hero>

      <Animated.View entering={rise(1)}>
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
      </Animated.View>


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
      {/* Ads are off until real campaigns exist: no entry point to an empty screen. */}
      {v.adSlots.length > 0 && (
        <Press entering={rise(0)} style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 76, paddingHorizontal: 18, backgroundColor: C.white, borderRadius: 26 }, SHADOW.card]}
          scale={0.985} onPress={v.goAds}>
          <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(15,123,61,.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="payments" size={23} color={C.success} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 15, letterSpacing: -0.22, color: C.ink }}>Ad placements & revenue</Text>
            <Text style={{ fontFamily: FONTS[500], fontSize: 12, color: C.subtle, marginTop: 3 }}>{v.adRevenue} total · {v.adLiveCount}</Text>
          </View>
          <Icon name="chevron_right" size={21} color={C.barIdle} />
        </Press>
      )}

      <Hero glow="rgba(255,138,128,.2)" enter={1}>
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {v.flaggedCount > 0 ? <Pulse color="#FF8A80" /> : null}
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
      </Hero>

      <Press entering={rise(2)} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, padding: 16, borderRadius: 24, backgroundColor: C.white }, SHADOW.card]}
        scale={0.985} onPress={v.goSupportInbox}>
        <Icon name="support_agent" size={22} color={C.primary} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>Support inbox</Text>
          <Text style={{ fontFamily: FONTS[400], fontSize: 12, color: C.subtle, marginTop: 2 }}>
            {v.supportOpenCount ? `${v.supportOpenCount} waiting on a person` : 'Nobody is waiting'}
          </Text>
        </View>
        <Icon name="chevron_right" size={21} color={C.barIdle} />
      </Press>

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}
      >
        {v.adminMetrics.map((m, n) => (
          <Animated.View key={m.label} entering={rise(n + 3)} style={[{ width: 176, backgroundColor: C.white, borderRadius: 24, padding: 18 }, SHADOW.card]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Icon name={m.icon} size={16} color={m.iconColor} />
              <Text style={{ fontFamily: FONTS[600], fontSize: 11, color: C.subtle }}>{m.label}</Text>
            </View>
            <Text style={{ fontFamily: FONTS[800], fontSize: 28, letterSpacing: -1.1, color: m.color, marginTop: 12 }}>{m.value}</Text>
            <Text style={{ fontFamily: FONTS[600], fontSize: 11, color: m.deltaColor, marginTop: 6 }}>{m.delta}</Text>
          </Animated.View>
        ))}
      </ScrollView>

      <Press entering={rise(4)} style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 76, paddingHorizontal: 18, backgroundColor: C.white, borderRadius: 26 }, SHADOW.card]}
        scale={0.985} onPress={v.goAnalysis}>
        <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(11,107,203,.1)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="analytics" size={23} color={C.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 15, letterSpacing: -0.22, color: C.ink }}>Analysis hub</Text>
          <Text style={{ fontFamily: FONTS[500], fontSize: 12, color: C.subtle, marginTop: 3 }}>Weekly reports and flagged keywords</Text>
        </View>
        <Icon name="chevron_right" size={21} color={C.barIdle} />
      </Press>


      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8, marginBottom: 12 }}>
          <Text style={{ fontFamily: FONTS[800], fontSize: 18, letterSpacing: -0.45, color: C.ink }}>Flagged content</Text>
          <View style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(180,35,24,.1)' }}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 11, color: C.danger }}>{v.flaggedCount} pending</Text>
          </View>
        </View>
        <View style={{ gap: 8 }}>
          {v.flagged.map((f, n) => (
            <Animated.View key={f.id} entering={rise(n)} style={[{ backgroundColor: C.white, borderRadius: 24, padding: 16 }, SHADOW.card]}>
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
            </Animated.View>
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

    </ScrollView>
  );
}
