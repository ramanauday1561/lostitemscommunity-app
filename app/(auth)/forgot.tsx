import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { colors, spacing, type } from '../../src/theme/tokens';

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
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Reset your password</Text>
        <Text style={s.sub}>We'll email you a link to set a new one.</Text>

        <View style={{ height: spacing.xxl }} />

        {sent ? (
          <Text style={s.notice}>
            If an account exists for {email.trim()}, a reset link is on its way. Check your spam folder too.
          </Text>
        ) : (
          <>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
            />
            {!!error && <Text style={s.error}>{error}</Text>}
            <Button label="Send reset link" onPress={submit} loading={busy} />
          </>
        )}

        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.xl, alignSelf: 'center' }}>
          <Text style={s.link}>Back to sign in</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingTop: spacing.xxl, flexGrow: 1 },
  title: { fontSize: type.h1.fontSize, fontWeight: '800', color: colors.ink },
  sub: { fontSize: type.body.fontSize, color: colors.muted, marginTop: spacing.sm },
  error: { color: colors.danger, fontSize: type.small.fontSize, marginBottom: spacing.lg },
  notice: { color: colors.success, fontSize: type.body.fontSize, lineHeight: 22 },
  link: { color: colors.primary, fontSize: type.small.fontSize, fontWeight: '600' },
});
