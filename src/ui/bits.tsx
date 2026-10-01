import { ActivityIndicator, Text, View, type ViewStyle } from 'react-native';
import { C, FONTS, MONO, SHADOW } from '../theme/tokens';
import { chip, chipText, cta, ctaText, pill, pillText, seg, segText } from '../theme/styles';
import { Press } from './Press';

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

export function Cta({ label, on, dark, onPress, style }: {
  label: string; on: boolean; dark?: boolean; onPress: () => void; style?: ViewStyle;
}) {
  return (
    <Press style={[cta(on, dark), style]} scale={0.98} disabled={!on} onPress={onPress}>
      <Text style={ctaText(on, dark)}>{label}</Text>
    </Press>
  );
}

export function Kicker({ children, color = C.faint }: { children: string; color?: string }) {
  return (
    <Text style={{ fontFamily: MONO[600], fontSize: 10, letterSpacing: 1.4, color, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ backgroundColor: C.white, borderRadius: 26, padding: 18 }, SHADOW.card, style]}>
      {children}
    </View>
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
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <Text style={{ fontFamily: FONTS[700], fontSize: 15, color: C.ink, marginTop: 12 }}>{title}</Text>
      <Text style={{ fontFamily: FONTS[400], fontSize: 13, lineHeight: 20, color: C.muted, textAlign: 'center', marginTop: 6 }}>
        {body}
      </Text>
    </View>
  );
}

/**
 * Loading / error state for a Supabase-backed list. Renders nothing when idle or ready, so
 * demo mode and loaded lists are untouched; the genuine empty state is each screen's own
 * <Empty>, which the selectors only show once the list is 'ready'.
 */
export function LoadGate({ status, onRetry, what }: {
  status: 'idle' | 'loading' | 'ready' | 'error'; onRetry: () => void; what: string;
}) {
  if (status === 'loading') {
    return (
      <View accessibilityRole="progressbar" style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
        <ActivityIndicator color={C.primary} />
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
