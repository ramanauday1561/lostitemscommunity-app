import { Text, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONTS, MONO, SHADOW, GLASS } from '../theme/tokens';
import { chip, chipText, cta, ctaText, pill, pillText, seg, segText } from '../theme/styles';
import { Press } from './Press';
import { Loader } from './Loader';
import { Icon } from './Icon';
import { pop, rise } from './motion';

export function Chip({ status, label, style }: { status: string; label?: string; style?: ViewStyle }) {
  return (
    <View style={[chip(status), style]}>
      <Text style={chipText(status)}>{label ?? status}</Text>
    </View>
  );
}

export function Pill({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Press style={pill(on)} scale={0.95} onPress={onPress}>
      <Text style={pillText(on)}>{label}</Text>
    </Press>
  );
}

export function Seg({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Press style={seg(on)} scale={0.98} onPress={onPress}>
      <Text style={segText(on)}>{label}</Text>
    </Press>
  );
}

/**
 * The big action button. While `loading` (a request is in flight) it takes the disabled look and shows the
 * loader in place of the label, so the person sees something is happening and can't send the same thing twice.
 */
export function Cta({ label, on, dark, onPress, style, loading }: {
  label: string; on: boolean; dark?: boolean; onPress: () => void; style?: ViewStyle; loading?: boolean;
}) {
  const live = on && !loading;
  return (
    <Press style={[cta(live, dark), style]} scale={0.98} disabled={!live} onPress={onPress}
      accessibilityState={{ busy: !!loading, disabled: !live }}>
      {live ? (
        <LinearGradient
          colors={[C.primary, C.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', inset: 0, borderRadius: 20 } as object}
        />
      ) : null}
      {loading ? <Loader size={11} /> : <Text style={ctaText(on, dark)}>{label}</Text>}
    </Press>
  );
}

/** Inline error / info banner that eases in when it appears. */
export function Notice({ tone, icon, text, style }: { tone: 'error' | 'info'; icon: string; text: string; style?: ViewStyle }) {
  const color = tone === 'error' ? C.danger : C.primary;
  return (
    <Animated.View entering={rise(0)} style={[{
      flexDirection: 'row', gap: 9, padding: 14, paddingHorizontal: 16, borderRadius: 16,
      backgroundColor: tone === 'error' ? 'rgba(180,35,24,.08)' : 'rgba(11,107,203,.08)',
    }, style]}>
      <Icon name={icon} size={19} color={color} />
      <Text style={{ flex: 1, fontFamily: FONTS[500], fontSize: 12.5, lineHeight: 19, color }}>{text}</Text>
    </Animated.View>
  );
}

export function Kicker({ children, color = C.faint }: { children: string; color?: string }) {
  return (
    <Text style={{ fontFamily: MONO[600], fontSize: 10, letterSpacing: 1.4, color, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

/** `enter` is the card's place in its stack (0 = first): when given, it rises in after the ones above it. */
export function Card({ children, style, enter }: { children: React.ReactNode; style?: ViewStyle; enter?: number }) {
  return (
    <Animated.View entering={enter === undefined ? undefined : rise(enter)}
      style={[{ ...GLASS, borderRadius: 26, padding: 18 }, SHADOW.card, style]}>
      {children}
    </Animated.View>
  );
}

/** Three-segment password strength meter, used by signup and password reset. */
export function StrengthBars({ strength, color }: { strength: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: i < strength ? color : C.line }} />
      ))}
    </View>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
      <Text style={{ fontFamily: MONO[600], fontSize: 10, letterSpacing: 1.4, color: C.subtle, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
    </View>
  );
}

export function Avatar({ text, size = 44, bg = C.white, color = C.primary }: {
  text: string; size?: number; bg?: string; color?: string;
}) {
  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2, backgroundColor: bg,
      alignItems: 'center', justifyContent: 'center',
    }, SHADOW.raised]}>
      <Text style={{ fontFamily: MONO[600], fontSize: size * 0.27, color }}>{text}</Text>
    </View>
  );
}

export function Empty({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <Animated.View entering={rise(0)} style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <Animated.View entering={pop.delay(120)} style={{
        width: 64, height: 64, borderRadius: 32, ...GLASS, alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={30} color={C.lighter} />
      </Animated.View>
      <Text style={{ fontFamily: FONTS[700], fontSize: 15, color: C.ink, marginTop: 14 }}>{title}</Text>
      <Text style={{ fontFamily: FONTS[400], fontSize: 13, lineHeight: 20, color: C.muted, textAlign: 'center', marginTop: 6 }}>
        {body}
      </Text>
    </Animated.View>
  );
}

/**
 * Loading / error state for a Supabase-backed list. Renders nothing when idle or ready, so
 * loaded lists are untouched; the genuine empty state is each screen's own
 * <Empty>, which the selectors only show once the list is 'ready'.
 *
 * `hasData`: rows from an earlier load are already on screen, so a refresh runs quietly instead of putting a spinner
 * on top of a list that is already there. The spinner is for the first load, when there is nothing else to look at.
 */
export function LoadGate({ status, onRetry, what, hasData = false }: {
  status: 'idle' | 'loading' | 'ready' | 'error'; onRetry: () => void; what: string; hasData?: boolean;
}) {
  if (status === 'loading' && !hasData) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 24, gap: 0 }}>
        <Loader />
        <Text style={{ fontFamily: FONTS[500], fontSize: 13, color: C.muted }}>Loading {what}…</Text>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
        <Text style={{ fontFamily: FONTS[700], fontSize: 15, color: C.ink }}>Couldn't load {what}</Text>
        <Text style={{ fontFamily: FONTS[400], fontSize: 13, lineHeight: 20, color: C.muted, textAlign: 'center', marginTop: 6 }}>
          Check your connection and try again.
        </Text>
        <Press style={{ marginTop: 16, minHeight: 44, paddingHorizontal: 24, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}
          scale={0.96} onPress={onRetry}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.white }}>Try again</Text>
        </Press>
      </View>
    );
  }
  return null;
}
