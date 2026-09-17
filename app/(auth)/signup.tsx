import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorBanner, Field, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, spacing, text } from '@/theme/tokens';

const MAX_WIDTH = 460;

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setNotice(null);
    if (busy) return;
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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.column}>
            <View style={s.middle}>
              <Text variant="h1">Set up your account</Text>
              <Text variant="body" style={{ marginTop: spacing.sm, marginBottom: spacing.xxl }}>
                It takes about a minute, and it's free.
              </Text>

              <Field
                label="Full name"
                icon="person-outline"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nadia Rahman"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => emailRef.current?.focus()}
              />

              <Field
                ref={emailRef}
                label="Email"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                inputMode="email"
                textContentType="emailAddress"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <Field
                ref={passwordRef}
                label="Password"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secure
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={submit}
              />

              {!!error && <ErrorBanner message={error} />}
              {!!notice && <RNText style={s.notice}>{notice}</RNText>}

              <Button label="Create account" onPress={submit} loading={busy} style={{ marginTop: spacing.sm }} />

              <RNText style={s.legal}>
                By creating an account you agree to keep the community safe and to follow the posting guidelines.
              </RNText>
            </View>

            <Pressable onPress={() => router.push('/(auth)/login')} style={s.footer}>
              <RNText style={text.small}>
                Already a member? <RNText style={s.link}>Sign in</RNText>
              </RNText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  middle: { flex: 1, justifyContent: 'center' },
  notice: { ...text.small, color: colors.success, marginBottom: spacing.md },
  legal: { ...text.small, fontSize: 12, textAlign: 'center', marginTop: spacing.lg },
  link: { ...text.smallStrong, color: colors.primary },
  footer: { alignSelf: 'center', paddingTop: spacing.lg },
});
