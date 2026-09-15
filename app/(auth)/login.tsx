import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { colors, spacing, type } from '../../src/theme/tokens';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      // AuthGate redirects into the tabs once the session lands.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.sub}>Sign in to pick up where you left off.</Text>

          <View style={{ height: spacing.xxl }} />

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
            placeholder="Your password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
          />

          {!!error && <Text style={s.error}>{error}</Text>}

          <Button label="Sign in" onPress={submit} loading={busy} />

          <Pressable onPress={() => router.push('/(auth)/forgot')} style={{ marginTop: spacing.lg, alignSelf: 'center' }}>
            <Text style={s.link}>Forgot your password?</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/signup')} style={{ marginTop: spacing.xxl, alignSelf: 'center' }}>
            <Text style={s.muted}>
              New here? <Text style={s.linkStrong}>Create an account</Text>
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
  link: { color: colors.primary, fontSize: type.small.fontSize, fontWeight: '600' },
  linkStrong: { color: colors.primary, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: type.small.fontSize },
});
