import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PROVIDER_LABEL, signInWithProvider, type OAuthProvider } from '@/lib/oauth';
import { colors, font, radius, shadow, spacing, text } from '@/theme/tokens';

const PROVIDERS: { key: OAuthProvider; icon: React.ComponentProps<typeof Ionicons>['name']; tint: string }[] = [
  { key: 'google', icon: 'logo-google', tint: '#DB4437' },
  { key: 'facebook', icon: 'logo-facebook', tint: '#1877F2' },
  // Ionicons has no X glyph, so the wordmark is drawn as text below.
  { key: 'twitter', icon: 'close', tint: colors.ink },
];

export function SocialButtons({ onError }: { onError: (message: string) => void }) {
  const [busy, setBusy] = useState<OAuthProvider | null>(null);

  async function press(provider: OAuthProvider) {
    if (busy) return;
    setBusy(provider);
    onError('');
    try {
      await signInWithProvider(provider);
    } catch (e) {
      onError(e instanceof Error ? e.message : `Could not sign in with ${PROVIDER_LABEL[provider]}.`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={s.row}>
      {PROVIDERS.map((p) => (
        <Pressable
          key={p.key}
          style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
          onPress={() => press(p.key)}
          disabled={!!busy}
          accessibilityRole="button"
          accessibilityLabel={`Continue with ${PROVIDER_LABEL[p.key]}`}
        >
          {busy === p.key ? (
            <ActivityIndicator color={colors.mutedLight} />
          ) : (
            <>
              <View style={[s.glyph, p.key === 'twitter' && { backgroundColor: colors.ink }]}>
                {p.key === 'twitter' ? (
                  <Text style={s.xMark}>X</Text>
                ) : (
                  <Ionicons name={p.icon} size={18} color={p.tint} />
                )}
              </View>
              <Text style={s.label}>{PROVIDER_LABEL[p.key]}</Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  card: {
    flex: 1,
    height: 84,
    borderRadius: radius.field,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadow.field,
  },
  glyph: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgAlt,
  },
  xMark: { fontFamily: font.bold, fontSize: 15, color: colors.white },
  label: { ...text.smallStrong, fontSize: 12.5 },
});
