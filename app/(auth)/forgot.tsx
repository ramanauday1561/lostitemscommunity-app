import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text as RNText } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, spacing, text } from '@/theme/tokens';

/** Keeps the phone layout readable when the web build is opened wide. */
const MAX_WIDTH = 460;

export default function Forgot() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim()) return setError('Enter the email you signed up with.');
    setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the reset link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text variant="h1">Reset your password</Text>
        <Text variant="body" style={{ marginTop: spacing.sm, marginBottom: spacing.xxl }}>
          We'll email you a link to set a new one.
        </Text>

        {sent ? (
          <RNText style={s.notice}>
            If an account exists for {email.trim()}, a reset link is on its way. Check your spam folder too.
          </RNText>
        ) : (
          <>
            <Field
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
            />
            {!!error && <RNText style={s.error}>{error}</RNText>}
            <Button label="Send reset link" onPress={submit} loading={busy} style={{ marginTop: spacing.md }} />
          </>
        )}

        <Pressable onPress={() => router.back()} style={s.footer}>
          <RNText style={s.link}>Back to sign in</RNText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  error: { ...text.small, color: colors.danger, marginBottom: spacing.md },
  notice: { ...text.bodyInk },
  link: { ...text.smallStrong, color: colors.primary },
  footer: { marginTop: spacing.xxl, alignSelf: 'center' },
});
