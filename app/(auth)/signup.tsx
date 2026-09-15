import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { colors, spacing, type } from '../../src/theme/tokens';

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setNotice(null);

    if (!fullName.trim()) return setError('Tell us your name.');
    if (!email.trim()) return setError('Enter your email address.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');

    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(email, password, fullName);
      if (needsConfirmation) {
        setNotice(
          'Check your inbox — we sent you a confirmation link. Once you confirm, come back and sign in.',
        );
      }
      // If confirmation is off, a session arrives and AuthGate moves us on.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Set up your account</Text>
          <Text style={s.sub}>It takes about a minute.</Text>

          <View style={{ height: spacing.xxl }} />

          <Field
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nadia Rahman"
            autoCapitalize="words"
            autoComplete="name"
          />
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
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
          />

          {!!error && <Text style={s.error}>{error}</Text>}
          {!!notice && <Text style={s.notice}>{notice}</Text>}

          <Button label="Create account" onPress={submit} loading={busy} />

          <Text style={s.legal}>
            By creating an account you agree to keep the community safe and to follow the posting guidelines.
          </Text>

          <Pressable onPress={() => router.push('/(auth)/login')} style={{ marginTop: spacing.xl, alignSelf: 'center' }}>
            <Text style={s.muted}>
              Already a member? <Text style={s.linkStrong}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingTop: spacing.xxl, flexGrow: 1 },
  title: { fontSize: type.h1.fontSize, fontWeight: '800', color: colors.ink },
  sub: { fontSize: type.body.fontSize, color: colors.muted, marginTop: spacing.sm },
  error: { color: colors.danger, fontSize: type.small.fontSize, marginBottom: spacing.lg },
  notice: { color: colors.success, fontSize: type.small.fontSize, marginBottom: spacing.lg, lineHeight: 20 },
  legal: { color: colors.mutedLight, fontSize: 12, marginTop: spacing.lg, lineHeight: 18, textAlign: 'center' },
  muted: { color: colors.muted, fontSize: type.small.fontSize },
  linkStrong: { color: colors.primary, fontWeight: '700' },
});
