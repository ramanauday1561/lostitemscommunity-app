import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Text } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { colors, radius, spacing, text } from '../../src/theme/tokens';

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
          <Text variant="h1">Welcome back</Text>
          <Text variant="body" style={{ marginTop: spacing.sm, marginBottom: spacing.xxl }}>
            Great to see you again. Let's find what you're looking for.
          </Text>

          <Field
            icon="person-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="Username or email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
          />
          <Field
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
          />

          <View style={s.row}>
            <Pressable style={s.remember} onPress={() => setRemember(!remember)} hitSlop={8}>
              <View style={[s.check, remember && { backgroundColor: colors.primary }]}>
                {remember && <Ionicons name="checkmark" size={13} color={colors.white} />}
              </View>
              <RNText style={text.small}>Remember me</RNText>
            </Pressable>
            <Pressable onPress={() => router.push('/(auth)/forgot')} hitSlop={8}>
              <RNText style={s.link}>Forgot password?</RNText>
            </Pressable>
          </View>

          {!!error && <RNText style={s.error}>{error}</RNText>}

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
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.lg },
  remember: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { ...text.smallStrong, color: colors.primary },
  error: { ...text.small, color: colors.danger, marginBottom: spacing.md },
  footer: { marginTop: spacing.xxl, alignSelf: 'center' },
});
