import { Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { C, FONTS, SHADOW } from '../theme/tokens';
import { Icon } from './Icon';
import { Press } from './Press';
import { Kicker } from './bits';

export function Header() {
  const v = useVals();
  if (!v.showHeader) return null;
  return (
    <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
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
            <View style={{
              position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, paddingHorizontal: 5,
              borderRadius: 999, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 3px #F2F2F0',
            }}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 10, color: C.white }}>{v.unreadTotal}</Text>
            </View>
          )}
        </Press>
      )}

      <Press style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }, SHADOW.raised]}
        scale={0.94} onPress={v.openProfile}>
        <Text style={{ fontFamily: FONTS[700], fontSize: 12, color: C.primary }}>{v.initials}</Text>
      </Press>
    </View>
  );
}

function Tab({ t }: { t: { icon: string; label: string; on: boolean; go: () => void } }) {
  return (
    <Press
      style={{
        flex: 1, minWidth: 0, minHeight: 52, borderRadius: 16, alignItems: 'center',
        justifyContent: 'center', gap: 3, backgroundColor: t.on ? C.bg : 'transparent',
      }}
      scale={0.95} onPress={t.go}
    >
      <Icon name={t.icon} size={21} color={t.on ? C.primary : C.faint} />
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
    <View style={{
      flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingTop: 8, paddingBottom: 14,
      backgroundColor: C.white, boxShadow: '0 -8px 24px -18px rgba(22,24,31,.5)',
    }}>
      {v.navLeft.map((t) => <Tab key={t.key} t={t} />)}
      {v.showFab && (
        <Press style={[{
          width: 56, height: 56, borderRadius: 20, backgroundColor: C.primary,
          alignItems: 'center', justifyContent: 'center', marginHorizontal: 4,
        }, SHADOW.cta]} scale={0.94} onPress={v.openReport}>
          <Icon name="add" size={28} color={C.white} />
        </Press>
      )}
      {v.navRight.map((t) => <Tab key={t.key} t={t} />)}
    </View>
  );
}

export function Toast() {
  const v = useVals();
  if (!v.toast) return null;
  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: 96, zIndex: 60, alignItems: 'center' }}>
      <View style={{
        maxWidth: '100%', paddingVertical: 13, paddingHorizontal: 18, borderRadius: 18,
        backgroundColor: C.ink, boxShadow: '0 18px 40px -18px rgba(16,19,25,.9)',
      }}>
        <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, lineHeight: 18, color: C.white }}>{v.toast}</Text>
      </View>
    </View>
  );
}
