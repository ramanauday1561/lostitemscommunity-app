import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorBanner, Field, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, spacing, text } from '@/theme/tokens';

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
    if (busy) return;
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
                    returnKeyType="go"
                    onSubmitEditing={submit}
                  />
                  {!!error && <ErrorBanner message={error} />}
                  <Button label="Send reset link" onPress={submit} loading={busy} style={{ marginTop: spacing.sm }} />
                </>
              )}
            </View>

            <Pressable onPress={() => router.back()} style={s.footer}>
              <RNText style={s.link}>Back to sign in</RNText>
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
  notice: { ...text.bodyInk },
  link: { ...text.smallStrong, color: colors.primary },
  footer: { alignSelf: 'center', paddingTop: spacing.lg },
});
