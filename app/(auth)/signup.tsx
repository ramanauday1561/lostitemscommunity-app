import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text as RNText } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Text } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { colors, spacing, text } from '../../src/theme/tokens';

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
        setNotice('Check your inbox — we sent you a confirmation link. Confirm it, then come back and sign in.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text variant="h1">Set up your account</Text>
          <Text variant="body" style={{ marginTop: spacing.sm, marginBottom: spacing.xxl }}>
            It takes about a minute, and it's free.
          </Text>

          <Field
            icon="person-outline"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            autoCapitalize="words"
            autoComplete="name"
          />
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
          <Field
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Password (8+ characters)"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
          />

          {!!error && <RNText style={s.error}>{error}</RNText>}
          {!!notice && <RNText style={s.notice}>{notice}</RNText>}

          <Button label="Create account" onPress={submit} loading={busy} style={{ marginTop: spacing.md }} />

          <RNText style={s.legal}>
            By creating an account you agree to keep the community safe and to follow the posting guidelines.
          </RNText>

          <Pressable onPress={() => router.push('/(auth)/login')} style={s.footer}>
            <RNText style={text.small}>
              Already a member? <RNText style={s.link}>Sign in</RNText>
            </RNText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl, flexGrow: 1 },
  error: { ...text.small, color: colors.danger, marginBottom: spacing.md },
  notice: { ...text.small, color: colors.success, marginBottom: spacing.md },
  legal: { ...text.small, fontSize: 12, textAlign: 'center', marginTop: spacing.lg },
  link: { ...text.smallStrong, color: colors.primary },
  footer: { marginTop: spacing.xl, alignSelf: 'center' },
});
