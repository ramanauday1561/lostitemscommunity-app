import { Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { C, FONTS, SHADOW } from '../theme/tokens';
import { Press } from './Press';
import { Divider } from './bits';

/** "Or continue with a social account": Google, Facebook and X. The buttons are in place; the sign-in itself is not
 *  wired up yet, so a tap says so (see `socials` in selectors.ts). */
export function SocialButtons() {
  const v = useVals();
  return (
    <>
      <Divider label="Or continue with a social account" />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {v.socials.map((s) => (
          <Press
            key={s.name}
            style={[{
              flex: 1, minHeight: 64, borderRadius: 20, backgroundColor: C.white,
              alignItems: 'center', justifyContent: 'center', gap: 7,
            }, SHADOW.tile]}
            scale={0.95} activeBg={C.fillSoft} onPress={s.go} accessibilityLabel={`Continue with ${s.name}`}
          >
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
    </>
  );
}
