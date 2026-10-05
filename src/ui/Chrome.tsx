import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useVals } from '../StoreProvider';
import { C, FONTS, SHADOW } from '../theme/tokens';
import { Icon } from './Icon';
import { Press } from './Press';
import { Kicker } from './bits';
import { Glass } from './Glass';
import { SPRING, pop } from './motion';

export function Header() {
  const v = useVals();
  if (!v.showHeader) return null;
  return (
    <Animated.View entering={FadeInDown.duration(280)} style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
      {v.showBack && (
        <Press style={{ width: 44, height: 44, marginLeft: -10, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
          scale={0.92} activeBg="rgba(22,24,31,.06)" onPress={v.back}>
          <Icon name="arrow_back" size={24} color={C.ink} />
        </Press>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Kicker>{v.headerKicker}</Kicker>
        <Text style={{ fontFamily: FONTS[800], fontSize: 26, lineHeight: 29, letterSpacing: -0.8, color: C.ink, marginTop: 4 }}>
          {v.headerTitle}
        </Text>
      </View>

      {v.showInbox && (
        <Press style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, SHADOW.raised]}
          scale={0.94} onPress={v.openMessages}>
          <Icon name="chat" size={22} color={C.ink} />
          {v.hasUnread && (
            <Animated.View entering={pop} style={{
              position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, paddingHorizontal: 5,
              borderRadius: 999, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 3px #F2F2F0',
            }}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 10, color: C.white }}>{v.unreadTotal}</Text>
            </Animated.View>
          )}
        </Press>
      )}

      {v.showBell && (
        <Press style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, SHADOW.raised]}
          scale={0.94} onPress={v.openNotifications}>
          <Icon name="notifications" size={22} color={C.ink} />
          {v.hasUnreadNotifs && (
            <Animated.View entering={pop} style={{
              position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, paddingHorizontal: 5,
              borderRadius: 999, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 3px #F2F2F0',
            }}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 10, color: C.white }}>{v.unreadNotifs > 9 ? '9+' : v.unreadNotifs}</Text>
            </Animated.View>
          )}
        </Press>
      )}

      <Press style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, SHADOW.raised]}
        scale={0.94} onPress={v.openProfile}>
        <Text style={{ fontFamily: FONTS[700], fontSize: 12, color: C.primary }}>{v.initials}</Text>
      </Press>
    </Animated.View>
  );
}

function Tab({ t }: { t: { icon: string; label: string; on: boolean; go: () => void } }) {
  const p = useSharedValue(t.on ? 1 : 0);
  useEffect(() => { p.value = withSpring(t.on ? 1 : 0, SPRING); }, [t.on, p]);
  const bg = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.85 + p.value * 0.15 }] }));
  const icon = useAnimatedStyle(() => ({ transform: [{ translateY: -p.value * 1.5 }, { scale: 1 + p.value * 0.1 }] }));
  return (
    <Press
      style={{ flex: 1, minWidth: 0, minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 3 }}
      scale={0.93} onPress={t.go}
    >
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0, borderRadius: 18, backgroundColor: 'rgba(11,107,203,.1)' } as object, bg]} />
      <Animated.View style={icon}>
        <Icon name={t.icon} size={21} color={t.on ? C.primary : C.faint} />
      </Animated.View>
      <Text style={{ fontFamily: t.on ? FONTS[700] : FONTS[600], fontSize: 10, color: t.on ? C.primary : C.faint }}>
        {t.label}
      </Text>
    </Press>
  );
}

export function BottomNav() {
  const v = useVals();
  if (!v.showNav) return null;
  return (
    <Animated.View entering={FadeInUp.duration(300)} style={{ flexShrink: 0, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 12 }}>
      <Glass radius={28} style={{ backgroundColor: 'rgba(255,255,255,.86)', boxShadow: '0 -1px 0 rgba(255,255,255,.9), 0 16px 34px -18px rgba(22,24,31,.55)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 }}>
          {v.navLeft.map((t) => <Tab key={t.key} t={t} />)}
          {v.showFab && (
            <Press style={[{
              width: 56, height: 56, borderRadius: 20, backgroundColor: C.primary,
              alignItems: 'center', justifyContent: 'center', marginHorizontal: 4,
            }, SHADOW.cta]} scale={0.9} onPress={v.openReport}>
              <Icon name="add" size={28} color={C.white} />
            </Press>
          )}
          {v.navRight.map((t) => <Tab key={t.key} t={t} />)}
        </View>
      </Glass>
    </Animated.View>
  );
}

export function Toast() {
  const v = useVals();
  if (!v.toast) return null;
  return (
    <Animated.View entering={FadeInUp.springify().damping(16)} style={{ position: 'absolute', left: 16, right: 16, bottom: 96, zIndex: 60, alignItems: 'center' }}>
      <Glass tint="dark" blur radius={18} intensity={50} style={{ maxWidth: '100%' }}>
        <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, lineHeight: 18, color: C.white, paddingVertical: 13, paddingHorizontal: 18 }}>{v.toast}</Text>
      </Glass>
    </Animated.View>
  );
}
