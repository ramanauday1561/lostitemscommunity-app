import React, { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ErrorBanner, Field } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing, text } from '@/theme/tokens';

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  const confirmRef = useRef<TextInput>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  async function changePassword() {
    setPwError(null);
    if (pwBusy) return;
    if (password.length < 8) return setPwError('Use at least 8 characters.');
    if (password !== confirm) return setPwError('The two passwords do not match.');

    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirm('');
      Alert.alert('Password changed', 'Your new password is active from now on.');
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Could not change your password.');
    } finally {
      setPwBusy(false);
    }
  }

  async function onSignOut() {
    setBusy(true);
    try {
      await signOut();
    } catch (e) {
      Alert.alert('Could not sign out', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const initials = (profile?.full_name ?? profile?.username ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.h1}>Profile</Text>

        <Card style={{ marginTop: spacing.lg, alignItems: 'center', paddingVertical: spacing.xl }}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.name}>{profile?.full_name ?? profile?.username ?? 'Member'}</Text>
          <Text style={s.handle}>@{profile?.username ?? '—'}</Text>
          {profile?.role === 'admin' && <Text style={s.adminBadge}>ADMIN</Text>}
        </Card>

        <Card style={{ marginTop: spacing.lg }}>
          <Row label="Email" value={user?.email ?? '—'} />
          <Row label="City" value={profile?.city ?? 'Not set'} />
          <Row label="Contact sharing" value={labelFor(profile?.contact_sharing_pref)} last />
        </Card>

        <Text style={s.note}>
          Your phone number and email live in a separate, locked-down table. Other members only ever see them when
          your sharing preference allows it.
        </Text>

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={s.sectionTitle}>Change password</Text>
          <Text style={[text.small, { marginTop: spacing.xs, marginBottom: spacing.lg }]}>
            Use this if your password was set for you, or if you think someone else knows it.
          </Text>

          <Field
            label="New password"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          <Field
            ref={confirmRef}
            label="Confirm new password"
            icon="checkmark-circle-outline"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Type it again"
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={changePassword}
          />

          {!!pwError && <ErrorBanner message={pwError} />}

          <Button
            label="Update password"
            onPress={changePassword}
            loading={pwBusy}
            disabled={!password || !confirm}
          />
        </Card>

        <Button label="Sign out" variant="secondary" onPress={onSignOut} loading={busy} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function labelFor(pref?: string) {
  if (pref === 'always') return 'Always share with people I message';
  if (pref === 'never') return 'Never share';
  return 'Only after a confirmed match';
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.row, last && { borderBottomWidth: 0 }]}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  h1: { ...text.h1 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontFamily: text.h2.fontFamily, fontSize: 24, color: colors.primary },
  name: { ...text.h2 },
  handle: { ...text.small, marginTop: 2 },
  adminBadge: {
    marginTop: spacing.sm,
    ...text.kicker,
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  sectionTitle: { ...text.h3 },
  rowLabel: { ...text.small },
  rowValue: { ...text.bodyStrong, fontSize: 13.5, flexShrink: 1, textAlign: 'right' },
  note: { marginTop: spacing.lg, fontSize: 12, color: colors.mutedLight, lineHeight: 18 },
});
