import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarButton, IconButton, ScreenHeader } from '@/components/layout';
import { ErrorState, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { broadcast, fetchFlags, fetchStats, resolveFlag, type AdminStats, type ModerationFlag } from '@/lib/admin';
import { colors, font, radius, shadow, spacing, text } from '@/theme/tokens';
import { initials as toInitials, money, shortDate } from '@/lib/format';

/**
 * A card on the metrics rail. The prototype scrolls these horizontally at a
 * fixed 176pt with scroll snapping, rather than wrapping them into a grid:
 * icon-and-label row, a 28pt value, then a secondary line beneath.
 */
function MetricCard({
  icon,
  iconColor,
  label,
  value,
  valueColor,
  note,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  value: string;
  valueColor: string;
  note: string;
}) {
  return (
    <View style={s.metric}>
      <View style={s.metricLabelRow}>
        <Ionicons name={icon} size={16} color={iconColor} />
        <RNText style={s.metricLabel}>{label}</RNText>
      </View>
      <RNText style={[s.metricValue, { color: valueColor }]}>{value}</RNText>
      <RNText style={s.metricNote}>{note}</RNText>
    </View>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { profile, user, signOut } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendNote, setSendNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [st, fl] = await Promise.all([fetchStats(), fetchFlags('pending')]);
      setStats(st);
      setFlags(fl.slice(0, 3));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the dashboard.');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function decide(flag: ModerationFlag, decision: 'approved' | 'removed') {
    if (!user) return;
    setBusyId(flag.id);
    try {
      await resolveFlag(flag, decision, user.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update that flag.');
    } finally {
      setBusyId(null);
    }
  }

  async function sendWelcome() {
    if (sending) return;
    setSendNote(null);
    setSending(true);
    try {
      const n = await broadcast(
        'Welcome to Lost Items Community',
        'Say hello in the forum and tell us what you are looking for.',
      );
      setSendNote(`Delivered to ${n} member${n === 1 ? '' : 's'}.`);
    } catch (e) {
      setSendNote(e instanceof Error ? e.message : 'Could not send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function onSignOut() {
    if (signingOut) return;
    setSignOutError(null);
    setSigningOut(true);
    try {
      await signOut();
      // The root layout watches the session and redirects to the welcome
      // screen once it clears, so there is no navigation to do here.
    } catch (e) {
      setSignOutError(e instanceof Error ? e.message : 'Could not sign out. Please try again.');
      setSigningOut(false);
    }
  }

  if (loading) return <Loading label="Loading control centre…" />;
  if (error || !stats) return <ErrorState message={error ?? 'No data'} onRetry={() => void onRefresh()} />;

  const initials = toInitials(profile?.full_name, 'SA');

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <ScreenHeader
          kicker="Super admin"
          title="System control"
          right={
            <>
              <IconButton icon="flag-outline" badge={stats.flags_pending} onPress={() => router.push('/admin/moderation')} />
              <AvatarButton initials={initials} onPress={() => router.push('/(tabs)/profile')} />
            </>
          }
        />

        <View style={s.stack}>
          {/* Ad placements & revenue */}
          <Pressable style={s.revenue} onPress={() => router.push('/admin/ads')}>
            <View style={[s.revenueIcon, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="card-outline" size={23} color={colors.success} />
            </View>
            <View style={s.revenueText}>
              <RNText style={s.revenueTitle}>Ad placements &amp; revenue</RNText>
              <RNText style={s.revenueSub}>
                {money(stats.revenue_month)} this month · {stats.campaigns_live} running
              </RNText>
            </View>
            <Ionicons name="chevron-forward" size={21} color={colors.chevron} />
          </Pressable>

          {/* Needs moderation. The prototype's dark hero: this is the one
              thing an admin opens the app for, so it is the loudest card on
              the screen rather than one white tile among four. */}
          <View style={s.hero}>
            <View style={s.heroKicker}>
              <Ionicons name="flag" size={16} color={colors.flagBright} />
              <RNText style={s.heroKickerText}>NEEDS MODERATION</RNText>
            </View>
            <View style={s.heroRow}>
              <View style={s.heroCount}>
                <RNText style={s.heroNumber}>{stats.flags_pending}</RNText>
                <RNText style={s.heroUnit}>flagged posts</RNText>
              </View>
              <Pressable style={s.heroButton} onPress={() => router.push('/admin/moderation')}>
                <RNText style={s.heroButtonText}>Review</RNText>
              </Pressable>
            </View>
          </View>

          {/* Metrics rail - horizontal and snapping, not a wrapped grid. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
            snapToInterval={176 + 12}
            style={s.railOuter}
            contentContainerStyle={s.rail}
          >
            <MetricCard
              icon="search-outline"
              iconColor={colors.danger}
              label="Active lost"
              value={String(stats.active_lost)}
              valueColor={colors.ink}
              note={`${stats.active_found} found active`}
            />
            <MetricCard
              icon="cube-outline"
              iconColor={colors.success}
              label="Recovered"
              value={String(stats.recovered)}
              valueColor={colors.primary}
              note={`${stats.matches_confirmed} matches confirmed`}
            />
            <MetricCard
              icon="people-outline"
              iconColor={colors.primary}
              label="Scouts"
              value={String(stats.members)}
              valueColor={colors.ink}
              note={`${stats.members_today} joined today`}
            />
          </ScrollView>

          {/* Flagged content */}
          <View>
            <View style={s.sectionRow}>
              <RNText style={s.sectionTitle}>Flagged content</RNText>
              <RNText style={s.pendingPill}>{stats.flags_pending} pending</RNText>
            </View>

            {flags.length === 0 ? (
              <View style={s.queueClear}>
                <View style={s.queueClearIcon}>
                  <Ionicons name="checkmark-circle-outline" size={26} color={colors.success} />
                </View>
                <RNText style={s.queueClearTitle}>Queue clear</RNText>
                <RNText style={s.queueClearBody}>No flagged content pending review.</RNText>
              </View>
            ) : (
              <View style={s.flagList}>
                {flags.map((f) => (
                  <View key={f.id} style={s.flagCard}>
                    <View style={s.flagTop}>
                      <RNText style={s.flagId}>{f.items?.short_code ?? (f.forum_threads ? 'FORUM THREAD' : 'REPORTED')}</RNText>
                      <RNText style={s.flagReason}>{f.reason}</RNText>
                    </View>
                    <RNText style={s.flagTitle}>
                      {f.items?.title ?? f.forum_threads?.title ?? 'Reported content'}
                    </RNText>
                    <RNText style={s.flagSub}>{shortDate(f.created_at)}</RNText>
                    <View style={s.flagActions}>
                      <Pressable
                        style={[s.flagBtn, s.approveBtn, busyId === f.id && s.btnBusy]}
                        disabled={busyId === f.id}
                        onPress={() => decide(f, 'approved')}
                      >
                        <RNText style={[s.flagBtnText, { color: colors.success }]}>Approve</RNText>
                      </Pressable>
                      <Pressable
                        style={[s.flagBtn, s.removeBtn, busyId === f.id && s.btnBusy]}
                        disabled={busyId === f.id}
                        onPress={() => decide(f, 'removed')}
                      >
                        <RNText style={[s.flagBtnText, { color: colors.danger }]}>Remove</RNText>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* New scouts. The prototype shows who joined rather than offering
              a bare button, and sends people on to Members. */}
          <View style={s.panel}>
            <RNText style={s.panelTitle}>{stats.members_today} new scouts today</RNText>
            <RNText style={s.panelBody}>
              Send a welcome message to everyone joining the recovery network.
            </RNText>
            <View style={s.scoutRow}>
              <Pressable
                style={[s.sendBtn, sending && s.btnBusy]}
                disabled={sending}
                onPress={sendWelcome}
              >
                <RNText style={s.sendBtnText}>{sending ? 'Sending…' : 'Send welcome message'}</RNText>
              </Pressable>
              <Pressable style={s.scoutArrow} onPress={() => router.push('/admin/members')}>
                <Ionicons name="arrow-forward" size={20} color={colors.primary} />
              </Pressable>
            </View>
            {!!sendNote && <RNText style={s.note}>{sendNote}</RNText>}
          </View>

          {/* Account */}
          <View style={s.panel}>
            <RNText style={s.panelTitle}>{profile?.full_name ?? profile?.username ?? 'Super admin'}</RNText>
            <RNText style={s.panelBody}>
              Signed in as @{profile?.username ?? '—'}. Signing out returns you to the welcome screen.
            </RNText>
            {!!signOutError && <RNText style={[s.note, { color: colors.danger }]}>{signOutError}</RNText>}
            <Pressable
              style={[s.signOut, signingOut && s.btnBusy]}
              disabled={signingOut}
              onPress={onSignOut}
            >
              <RNText style={s.signOutText}>{signingOut ? 'Signing out…' : 'Sign out'}</RNText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Values transcribed from the prototype's admin dashboard markup rather
// than approximated: 20pt side padding with a 16pt stack gap, a 26pt radius
// on the revenue row, 28pt on panels and the hero, 24pt on the smaller
// cards, and a 176pt rail card.
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 130 },
  stack: { paddingHorizontal: 20, paddingBottom: 32, gap: 16, marginTop: 16 },

  revenue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 76,
    paddingHorizontal: 18,
    backgroundColor: colors.card,
    borderRadius: 26,
    ...shadow.card,
  },
  revenueIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  revenueText: { flex: 1, minWidth: 0 },
  revenueTitle: { fontFamily: font.bold, fontSize: 15, letterSpacing: -0.22, color: colors.ink },
  revenueSub: { marginTop: 3, fontFamily: font.medium, fontSize: 12, color: colors.mutedLight },

  hero: { backgroundColor: colors.inkDeep, borderRadius: 28, padding: 20 },
  heroKicker: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroKickerText: {
    fontFamily: font.monoSemibold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.5)',
  },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 14 },
  heroCount: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  heroNumber: { fontFamily: font.extrabold, fontSize: 46, letterSpacing: -2.3, color: colors.white },
  heroUnit: { fontFamily: font.medium, fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  heroButton: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonText: { fontFamily: font.bold, fontSize: 13.5, color: colors.white },

  // Negative margin lets the rail bleed to the screen edge while its
  // content keeps the 20pt gutter, so a card can sit half off-screen and
  // read as scrollable.
  railOuter: { marginHorizontal: -20 },
  rail: { gap: 12, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  metric: { width: 176, backgroundColor: colors.card, borderRadius: 24, padding: 18, ...shadow.card },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metricLabel: { fontFamily: font.semibold, fontSize: 11, color: colors.mutedLight },
  metricValue: { marginTop: 12, fontFamily: font.extrabold, fontSize: 28, letterSpacing: -1.12 },
  metricNote: { marginTop: 6, fontFamily: font.semibold, fontSize: 11, color: colors.mutedLight },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  sectionTitle: { fontFamily: font.extrabold, fontSize: 18, letterSpacing: -0.45, color: colors.ink },
  pendingPill: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },

  queueClear: { backgroundColor: colors.card, borderRadius: 24, paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center', ...shadow.field },
  queueClearIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueClearTitle: { marginTop: 14, fontFamily: font.bold, fontSize: 14, color: colors.ink },
  queueClearBody: { marginTop: 4, fontFamily: font.regular, fontSize: 12.5, color: colors.mutedLight, textAlign: 'center' },

  flagList: { gap: 8 },
  flagCard: { backgroundColor: colors.card, borderRadius: 24, padding: 16, ...shadow.card },
  flagTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flagId: { fontFamily: font.mono, fontSize: 10.5, letterSpacing: 0.4, color: colors.mutedLight },
  flagReason: {
    fontFamily: font.semibold,
    fontSize: 10.5,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  flagTitle: { marginTop: 10, fontFamily: font.bold, fontSize: 15, lineHeight: 19.5, letterSpacing: -0.22, color: colors.ink },
  flagSub: { marginTop: 4, fontFamily: font.monoMedium, fontSize: 12, color: colors.mutedLight },
  flagActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  flagBtn: { flex: 1, minHeight: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  approveBtn: { backgroundColor: colors.successSoft },
  removeBtn: { backgroundColor: colors.dangerSoft },
  flagBtnText: { fontFamily: font.bold, fontSize: 13.5 },
  btnBusy: { opacity: 0.5 },

  panel: { backgroundColor: colors.card, borderRadius: 28, padding: 20, ...shadow.card },
  panelTitle: { fontFamily: font.extrabold, fontSize: 16, letterSpacing: -0.32, color: colors.ink },
  panelBody: { marginTop: 6, fontFamily: font.regular, fontSize: 12.5, lineHeight: 19.4, color: colors.mutedLight },
  scoutRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  sendBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { fontFamily: font.bold, fontSize: 13, color: colors.ink },
  scoutArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { marginTop: 10, ...text.small },

  signOut: {
    marginTop: 16,
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { fontFamily: font.bold, fontSize: 13.5, color: colors.danger },
});
