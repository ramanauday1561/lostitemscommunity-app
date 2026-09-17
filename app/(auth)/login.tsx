import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Image,
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
import { Button, DividerLabel, ErrorBanner, Field, SocialButtons, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, radius, shadow, spacing, text } from '@/theme/tokens';

/** Keeps the phone layout readable when the web build is opened wide. */
const MAX_WIDTH = 460;

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();

  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function submit() {
    setError(null);
    if (!canSubmit || busy) return;
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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          // Lets a tap land on a control while the keyboard is open instead
          // of being swallowed by the dismiss gesture.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.column}>
            {/* top */}
            <View style={s.brandRow}>
              <Image source={require('../../assets/illustrations/logo.png')} style={s.logo} />
              <RNText style={text.brand}>Lost Items Community</RNText>
            </View>

            {/* centre */}
            <View style={s.middle}>
              <Text variant="h1">Welcome back</Text>
              <Text variant="body" style={{ marginTop: spacing.sm, marginBottom: spacing.xxl }}>
                Great to see you again. Let's find what you're looking for.
              </Text>

              <Field
                label="Email or username"
                icon="person-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com or superadmin"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                // Keep the keyboard up and jump straight to the password.
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <Field
                ref={passwordRef}
                label="Password"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secure
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                // Return / Enter submits from here.
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

              <DividerLabel>Or continue with a social account</DividerLabel>
              <SocialButtons onError={(m) => setError(m || null)} />
            </View>

            {/* bottom */}
            <Pressable onPress={() => router.push('/(auth)/signup')} style={s.footer}>
              <RNText style={text.small}>
                New here? <RNText style={s.link}>Join free in 30 seconds</RNText>
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
  // flexGrow makes the column fill a tall screen so the three zones can sit
  // top / centre / bottom, while still scrolling once the keyboard is up.
  scroll: { flexGrow: 1 },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: { width: 34, height: 34, borderRadius: 10 },

  middle: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xxl },

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
  footer: { alignSelf: 'center', paddingTop: spacing.lg },
});
