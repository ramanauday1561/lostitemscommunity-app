import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorBanner, Field, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, radius, shadow, spacing, text } from '@/theme/tokens';

/** Keeps the phone layout readable when the web build is opened wide. */
const MAX_WIDTH = 460;

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function submit() {
    setError(null);
    if (!canSubmit) return;
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.brandRow}>
            <Image source={require('../../assets/illustrations/logo.png')} style={s.logo} />
            <RNText style={text.brand}>Lost Items Community</RNText>
          </View>

          <Text variant="h1">Welcome back</Text>
          <Text variant="body" style={{ marginTop: spacing.sm, marginBottom: spacing.xxl }}>
            Great to see you again. Let's find what you're looking for.
          </Text>

          <Field
            label="Email or username"
            icon="person-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            returnKeyType="next"
          />

          <Field
            label="Password"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secure
            autoCapitalize="none"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />

          <View style={s.row}>
            <Pressable
              style={s.remember}
              onPress={() => setRemember(!remember)}
              hitSlop={8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: remember }}
            >
              <View style={[s.check, remember && { backgroundColor: colors.primary }]}>
                {remember && <Ionicons name="checkmark" size={13} color={colors.white} />}
              </View>
              <RNText style={text.small}>Remember me</RNText>
            </Pressable>

            <Pressable onPress={() => router.push('/(auth)/forgot')} hitSlop={8}>
              <RNText style={s.link}>Forgot password?</RNText>
            </Pressable>
          </View>

          {!!error && <ErrorBanner message={error} />}

          <Button label="Sign in & continue" onPress={submit} loading={busy} disabled={!canSubmit} />

          <Pressable onPress={() => router.push('/(auth)/signup')} style={s.footer}>
            <RNText style={text.small}>
              New here? <RNText style={s.link}>Join free in 30 seconds</RNText>
            </RNText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  // flexGrow lets the block centre when it is shorter than the screen and
  // still scroll when the keyboard shrinks the viewport.
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxl },
  logo: { width: 34, height: 34, borderRadius: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  remember: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.field,
  },
  link: { ...text.smallStrong, color: colors.primary },
  footer: { marginTop: spacing.xxl, alignSelf: 'center' },
});
