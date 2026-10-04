import {
  CATS, SCREEN_ICON, SLIDES, SUPPORT_GREETING, type Ad, type Campaign, type Item, type Status,
} from '../data/constants';
import { compact, initials, money } from '../theme/tokens';
import { formatTime } from '../lib/time';
import { parseCoords, type LatLng } from '../lib/geo';
import { IDLE_LOADS, type AppState, type Store, type LoadKey } from './store';

/** 'Mar 2024' from an ISO timestamp ('' when missing). */
function joinedLabel(iso: string | null): string {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';
}

/** 'M','T',... for a 'YYYY-MM-DD' day (UTC, as the view groups by date); '' when missing. */
function weekdayLetter(day: string | null): string {
  if (!day) return '';
  const d = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? '' : 'SMTWTFS'[d.getUTCDay()];
}

/** Stands in for the open post while none is selected, so the sheet's values always exist. */
const NO_ITEM: Item = {
  id: '', title: '', location: '', date: '', status: 'Active', kind: 'Lost', icon: 'inventory_2', by: '', desc: '', coords: null,
};

export function buildVals(store: Store) {
  const st: AppState = store.state;
  const sc = st.screen;
  const admin = st.role === 'admin';
  const fresh = st.role === 'new';
  const sh = st.sheet;
  /** Empty states only make sense once a list has really loaded (never while loading or after an error). */
  const settled = (k: LoadKey) => st.loads[k] === 'ready';

  const slide = SLIDES[st.slide];
  const convo = st.convos.find((c) => c.id === st.activeConvo) || null;
  const convoMsgs = convo ? convo.msgs : [];
  const convoWith = convo ? convo.with : '';
  const unread = st.convos.reduce((n, c) => n + (c.unread || 0), 0);
  // The open forum thread, shaped for the sheet (author, body, meta line).
  const dbThread = (st.dbThreads ?? []).find((x) => x.id === st.activeThread);
  const thread = dbThread ? {
    id: dbThread.id, title: dbThread.title, text: dbThread.body, tag: dbThread.tag, status: dbThread.status,
    user: dbThread.author_handle, ini: initials(dbThread.author_handle),
    meta: `${dbThread.created_at} · ${dbThread.author_display_name}`, mine: dbThread.author_id === st.profile?.id,
  } : null;

  const pw = st.suPass || '';
  const strength = pw.length === 0 ? 0 : pw.length < 8 ? 1 : (/[^a-z0-9]/i.test(pw) && /\d/.test(pw) ? 3 : 2);
  const strengthColor = strength >= 3 ? '#0F7B3D' : strength === 2 ? '#C98A00' : '#B42318';
  const strengthLabel = strength === 0 ? 'Use 8+ characters with a number and a symbol'
    : strength === 1 ? 'Too short — 8 characters minimum'
    : strength === 2 ? 'Good. Add a symbol to make it strong.' : 'Strong password';

  const fpw = st.fpPass || '';
  const fpStrength = fpw.length === 0 ? 0 : fpw.length < 8 ? 1 : (/[^a-z0-9]/i.test(fpw) && /\d/.test(fpw) ? 3 : 2);
  const fpStrengthColor = fpStrength >= 3 ? '#0F7B3D' : fpStrength === 2 ? '#C98A00' : '#B42318';
  const fpStage = st.fpStage;
  const fpCopy = ({
    email: ['Forgot password', 'Reset your password', "Enter the email on your account and we'll send you a reset link."],
    done: ['Check your inbox', 'Reset link sent', st.fpInfo || "If that email has an account, we've sent a reset link to it."],
    reset: ['Choose a new password', 'Set a new password', "Pick something you haven't used here before, then confirm it."],
    changed: ['All set', 'Password changed', 'Sign in with your new password.'],
  } as Record<string, string[]>)[fpStage] || ['', '', ''];
  const fpOrder = ['email', 'code', 'reset', 'done'];
  const fpIdx = fpStage === 'changed' ? 3 : fpOrder.indexOf(fpStage);

  const visibleThreads = (st.dbThreads ?? [])
    .filter((x) => !st.forumTag || st.forumTag === 'All' || x.tag === st.forumTag)
    .filter((x) => admin || x.status !== 'suspended');

  const sel = (st.dbItems ?? []).find((i) => i.id === st.sel) ?? NO_ITEM;
  const existingConvo = sel.dbId ? st.convos.find((c) => c.itemId === sel.dbId) : undefined;
  const meHandle = st.profile?.handle ?? '';
  const openItem = (it: Item) => () => {
    store.setState({ sel: it.id, sheet: 'detail', toast: '' });
    store.loadPhotosSupabase(it.dbId);
  };
  const go = (screen: string, extra?: Partial<AppState>) => () => {
    // Entering the other registry tab: drop the previous tab's rows and show the loader straight away, instead of
    // one frame of the old list before the effect starts the fetch.
    const switching = (screen === 'lost' || screen === 'found') && screen !== sc;
    store.setState({
      screen, sheet: null, filter: 'All', q: '', toast: '', ...(extra || {}),
      ...(switching ? { dbItems: null, registryHasMore: false, loads: { ...st.loads, registry: 'loading' as const } } : null),
    });
    // The review queue changes while the admin is elsewhere (items get flagged), so refetch on every visit.
    if (screen === 'moderation') store.loadModerationQueueSupabase();
  };

  // Filter, search and kind are applied server-side by Store#loadRegistry (see the useEffect in Registry.tsx),
  // so st.dbItems is the result set as-is.
  const registry: Item[] = st.dbItems ?? [];

  const titles: Record<string, string[]> = {
    dash: admin ? ['Super admin', 'System control'] : ['Community member', 'My dashboard'],
    lost: ['Registry', 'Lost items'], found: ['Registry', 'Found items'], forum: ['Community', 'Forum'],
    moderation: ['Super admin', 'Moderation'], supportInbox: ['Super admin', 'Support inbox'], analysis: ['Super admin', 'Analysis'],
    members: ['Super admin', 'Members'], messages: ['Inbox', 'Messages'], ads: ['Monetization', 'Ad placements'],
  };
  const t = titles[sc] || ['', ''];

  const activeKey = admin
    ? (({ dash: 'home', lost: 'registry', found: 'registry', moderation: 'moderation', members: 'members', forum: 'forum', analysis: 'home' } as Record<string, string>)[sc] || '')
    : (({ dash: 'home', lost: 'lost', found: 'found', forum: 'forum' } as Record<string, string>)[sc] || '');
  const tab = (key: string, icon: string, label: string, screen: string) => ({
    icon, label, key, on: key === activeKey, go: go(screen),
  });

  const barsData = (st.dbWeeklyReports ?? []).map((r) => [weekdayLetter(r.day), (r.reports ?? 0) as number] as [string, number]);

  // Ad placements and campaigns: the list, totals and editor all read this one shape.
  const campaigns: Campaign[] = (st.dbAdCampaigns ?? []).map((c) => ({ key: c.key, campaign: c.name, advertiser: c.advertiser, icon: c.icon, rate: c.rate_label, cpm: Number(c.cpm) }));
  const adRows: (Ad & { label?: string })[] = (st.dbAdPlacements ?? []).map((p) => ({
    id: p.id, label: p.display_id, screen: p.screen, slot: p.slot, format: p.format, size: p.size,
    campaignKey: p.campaign_key, campaign: p.campaign_name, advertiser: p.advertiser, icon: p.icon,
    days: p.duration_days, daysLeft: p.days_left, revenue: Number(p.revenue), impressions: p.impressions,
    ctr: Number(p.ctr), live: p.is_live,
  }));
  const NO_AD: Ad = {
    id: '', screen: '', slot: '', format: '', size: '', campaignKey: '', campaign: '', advertiser: '', icon: 'campaign',
    days: 1, daysLeft: 0, revenue: 0, impressions: 0, ctr: 0, live: false,
  };
  const NO_CAMPAIGN: Campaign = { key: '', campaign: '', advertiser: '', icon: 'campaign', rate: '', cpm: 0 };

  const adEdit = (() => {
    const a = adRows.find((x) => x.id === st.adEditId) || adRows[0] || NO_AD;
    const d = st.adDraft || { campaignKey: a.campaignKey, days: a.days };
    const c = campaigns.find((x) => x.key === d.campaignKey) || campaigns[0] || NO_CAMPAIGN;
    const proj = Math.round(c.cpm * (a.impressions / a.days) * d.days / 1000);
    return {
      ...a, ...c, id: (a as { label?: string }).label ?? a.id, projected: money(proj),
      projectedNote: `over ${d.days} days at ${c.rate}`,
      screenIcon: SCREEN_ICON[a.screen] || 'web_asset',
      metrics: [
        { value: compact(Math.round(a.impressions / a.days * d.days)), label: 'Est. impressions' },
        { value: money(Math.round(proj / d.days)), label: 'Per day' },
        { value: c.rate, label: 'Rate' },
      ],
    };
  })();

  return {
    crumb: sc === 'welcome' ? `Welcome ${st.slide + 1} of 3`
      : sc === 'signup' ? 'Sign up' : sc === 'login' ? 'Login'
      : sc === 'forgot' ? `Forgot password · ${fpCopy[0]}`
      : `${admin ? 'Super Admin' : fresh ? 'New User' : 'Member'} · ${t[1]}`,
    isWelcome: sc === 'welcome', slide, slideIndex: st.slide,
    nextLabel: st.slide === SLIDES.length - 1 ? 'Get started free' : 'Next',
    showWelcomeBack: st.slide > 0,
    prevSlide: () => store.setState((s) => ({ slide: Math.max(0, s.slide - 1) })),
    nextSlide: () => store.setState((s) => s.slide === SLIDES.length - 1 ? { screen: 'login' } : { slide: s.slide + 1 }),
    skipWelcome: () => store.setState({ screen: 'login' }),

    goSignup: () => store.setState({ screen: 'signup', error: '' }),
    goLogin: () => store.setState({ screen: 'login', suError: '' }),

    isSignup: sc === 'signup',
    suUser: st.suUser, suEmail: st.suEmail, suPass: st.suPass, suError: st.suError, suInfo: st.suInfo, suConfirm: st.suConfirm,
    onSuUser: (v: string) => store.setState({ suUser: v, suError: '' }),
    onSuEmail: (v: string) => store.setState({ suEmail: v, suError: '' }),
    onSuPass: (v: string) => store.setState({ suPass: v, suError: '' }),
    onSuConfirm: (v: string) => store.setState({ suConfirm: v, suError: '' }),
    strength, strengthColor, strengthLabel,
    toggleTerms: () => store.setState((s) => ({ suTerms: !s.suTerms })),
    suTerms: st.suTerms,
    suMatchGlyph: !st.suConfirm ? '' : (st.suConfirm === st.suPass ? 'check_circle' : 'cancel'),
    suMatchColor: st.suConfirm === st.suPass ? '#0F7B3D' : '#B42318',
    signupLoading: st.busy,
    signupEnabled: !!(st.suUser.trim() && st.suEmail.trim() && st.suPass && st.suConfirm && st.suTerms) && !st.busy,
    submitSignup: store.signUpSupabase,

    isForgot: sc === 'forgot',
    goForgot: () => store.setState({ screen: 'forgot', fpStage: 'email', fpEmail: st.username.includes('@') ? st.username : '', fpPass: '', fpConfirm: '', fpError: '', fpInfo: '', error: '' }),
    fpKicker: fpCopy[0], fpTitle: fpCopy[1], fpBody: fpCopy[2], fpIdx,
    fpIsEmail: fpStage === 'email',
    fpIsReset: fpStage === 'reset', fpIsDone: fpStage === 'done' || fpStage === 'changed',
    fpShowSignInLink: fpStage !== 'done' && fpStage !== 'changed' && !st.fpRecovery,
    fpEmail: st.fpEmail, fpPass: st.fpPass, fpConfirm: st.fpConfirm, fpError: st.fpError, fpInfo: st.fpInfo,
    onFpEmail: (v: string) => store.setState({ fpEmail: v, fpError: '' }),
    onFpPass: (v: string) => store.setState({ fpPass: v, fpError: '' }),
    onFpConfirm: (v: string) => store.setState({ fpConfirm: v, fpError: '' }),
    fpMatchGlyph: !st.fpConfirm ? '' : (st.fpConfirm === st.fpPass ? 'check_circle' : 'cancel'),
    fpMatchColor: st.fpConfirm === st.fpPass ? '#0F7B3D' : '#B42318',
    fpStrength, fpStrengthColor,
    fpStrengthLabel: fpStrength === 0 ? 'Use 8+ characters with a number and a symbol'
      : fpStrength === 1 ? 'Too short — 8 characters minimum'
      : fpStrength === 2 ? 'Good. Add a symbol to make it strong.' : 'Strong password',
    fpPrimaryLabel: st.fpBusy ? (fpStage === 'reset' ? 'Updating…' : 'Sending…') : fpStage === 'email' ? 'Send reset link'
      : fpStage === 'reset' ? 'Update password' : 'Back to sign in',
    fpLoading: st.fpBusy,
    fpPrimaryEnabled: !st.fpBusy && (fpStage === 'email' ? !!st.fpEmail.trim()
      : fpStage === 'reset' ? !!(st.fpPass && st.fpConfirm) : true),
    fpPrimary: () => {
      if (fpStage === 'email') { store.requestResetSupabase(); return; }
      if (fpStage === 'reset') { store.finishPasswordResetSupabase(); return; }
      store.setState({ screen: 'login', fpStage: 'email', fpPass: '', fpConfirm: '', fpInfo: '', error: '', password: '' });
    },
    fpBack: () => {
      if (st.fpRecovery) { store.abandonRecovery(); return; }
      store.setState({ screen: 'login', fpStage: 'email', fpError: '' });
    },

    isLogin: sc === 'login',
    isUserDash: sc === 'dash' && !admin && !fresh, isFreshDash: sc === 'dash' && fresh,
    isAdminDash: sc === 'dash' && admin,
    isRegistry: sc === 'lost' || sc === 'found', isForum: sc === 'forum',
    isModeration: sc === 'moderation', isSupportInbox: sc === 'supportInbox' && admin, isAnalysis: sc === 'analysis',
    isMembers: sc === 'members', isAds: sc === 'ads' && admin,
    isAdmin: admin, isSimple: !admin && sc !== 'login',
    showHeader: !['login', 'welcome', 'signup', 'forgot'].includes(sc),
    showNav: !['login', 'welcome', 'signup', 'forgot'].includes(sc),
    showBack: ['moderation', 'supportInbox', 'analysis', 'members', 'messages'].includes(sc),
    showInbox: !admin,
    back: go('dash'),
    headerKicker: t[0], headerTitle: t[1], toast: st.toast,
    initials: store.me().ini,

    username: st.username, password: st.password, error: st.error,
    onUser: (v: string) => store.setState({ username: v, error: '' }),
    onPass: (v: string) => store.setState({ password: v, error: '' }),
    submit: store.signInSupabase,
    signInLabel: st.busy ? 'Signing in…' : 'Sign in & continue',
    signInLoading: st.busy,
    signInEnabled: !!(st.username && st.password) && !st.busy,
    toggleRemember: () => store.setState((s) => ({ remember: !s.remember })),
    remember: st.remember,
    // Per-list load state for LoadGate and the matching retry handlers.
    loads: st.loads,
    retry: {
      registry: () => store.loadRegistry(),
      forum: () => store.loadForumSupabase(),
      conversations: () => store.loadConversationsSupabase(),
      moderation: () => store.loadModerationQueueSupabase(),
      members: () => store.searchMembersSupabase(st.memberSearchQuery || ''),
      analysis: () => store.loadAnalysisSupabase(),
      ads: () => store.loadAdsSupabase(),
      notifications: () => store.loadNotificationsSupabase(),
      support: () => store.loadSupportInboxSupabase(),
    },
    setupSteps: (() => {
      const done1 = !!st.suTerms;
      const done2 = (st.myDashStats?.totalReports ?? 0) > 0;
      const done3 = (st.myDashStats?.myThreads ?? 0) > 0;
      const mk = (done: boolean, title: string, desc: string, go: () => void) => ({
        title, desc, go, done, mark: done ? 'check' : 'radio_button_unchecked',
      });
      return [
        mk(done1, 'Read the safe meetup rules', 'Two minutes. It keeps handovers safe.', () => store.setState({ sheet: 'guidelines' })),
        mk(done2, 'Post your first report', 'Lost or found — add a photo, place and date.', () => store.setState({ sheet: 'report', step: 1, toast: '' })),
        mk(done3, 'Say hello in the forum', 'Ask a question or share a sighting.', () => store.setState({ screen: 'forum', sheet: null })),
      ];
    })(),
    setupProgress: (() => {
      const done1 = !!st.suTerms;
      const done2 = (st.myDashStats?.totalReports ?? 0) > 0;
      const done3 = (st.myDashStats?.myThreads ?? 0) > 0;
      return `${[done1, done2, done3].filter(Boolean).length} of 3 done`;
    })(),

    freshName: st.profile?.display_name?.split(' ')[0] || st.profile?.username || 'there',

    myStats: fresh
      ? [{ value: '0', label: 'Active reports', color: '#a8acb2' }, { value: '0', label: 'Reunited', color: '#a8acb2' }, { value: '0', label: 'Forum posts', color: '#a8acb2' }]
      : [
          { value: String(st.myDashStats?.activeReports ?? 0), label: 'Active reports', color: '#0B6BCB' },
          { value: String(st.myDashStats?.reunited ?? 0), label: 'Reunited', color: '#0F7B3D' },
          { value: String(st.profile?.post_count ?? 0), label: 'Forum posts', color: '#16181F' },
        ],
    shortcuts: [
      { icon: 'travel_explore', title: 'Search lost items registry', desc: 'Browse recent lost reports from members in your city.', go: go('lost') },
      { icon: 'storefront', title: 'Search found items registry', desc: 'Check if someone handed in what you are missing.', go: go('found') },
      { icon: 'chat', title: 'Messages', desc: unread ? `${unread} unread from people returning your items.` : 'Your conversations with finders and owners.', go: go('messages') },
    ],
    goSearch: go('found'), goFound: go('found'), goLost: go('lost'),

    // Phase 7: Moderation queue (real data from Supabase in admin mode)
    flaggedCount: st.dbModerationStats?.pending ?? 0,
    flaggedEmpty: (st.dbModerationStats?.pending ?? 0) === 0,
    flagged: (st.dbModerationQueue ?? []).map((f) => ({
      // Display id (LOST-1031) rather than the flag's uuid; the real flag id drives the actions.
      key: f.id,
      id: f.target_ref || f.id,
      title: f.target_title || '(Unknown)',
      author: f.target_author || '(Unknown)',
      category: f.target_type === 'item' ? 'Item' : 'Forum Thread',
      reason: f.reason,
      date: f.created_at,
      sub: `${f.target_author ? '@' + f.target_author : 'Unknown member'} · ${formatTime(f.target_date || f.created_at)}`,
      approve: () => store.takeModActionSupabase(f.id, 'approve'),
      remove: () => store.takeModActionSupabase(f.id, 'remove'),
    })),
    adminMetrics: [
      { label: 'Active lost', value: String(st.adminDashStats?.activeLost ?? 0), color: '#16181F', delta: '', deltaColor: '#0F7B3D', icon: 'person_search', iconColor: '#B42318' },
      { label: 'Recovered', value: String(st.adminDashStats?.recovered ?? 0), color: '#0B6BCB', delta: '', deltaColor: '#0F7B3D', icon: 'inventory_2', iconColor: '#0F7B3D' },
      { label: 'Active members', value: String(st.adminDashStats?.activeMembers ?? 0), color: '#16181F', delta: '', deltaColor: '#8b8f95', icon: 'group', iconColor: '#0B6BCB' },
    ],
    modStats: [
      { value: st.dbModerationStats?.pending ?? 0, label: 'Pending', color: '#B42318' },
      { value: st.dbModerationStats?.approved ?? 0, label: 'Approved', color: '#0F7B3D' },
      { value: st.dbModerationStats?.removed ?? 0, label: 'Removed', color: '#16181F' },
    ],
    goModeration: go('moderation'), goAnalysis: go('analysis'),
    goSupportInbox: () => { store.setState({ screen: 'supportInbox', sheet: null, toast: '' }); store.loadSupportInboxSupabase(); },
    supportOpenCount: (st.dbSupportInbox ?? []).length,
    supportInbox: (st.dbSupportInbox ?? []).map((i) => {
      const msgs = i.messages ?? [];
      const last = msgs[msgs.length - 1];
      const answered = !!last && last.sender === 'agent';
      return {
        id: i.requestId, name: i.displayName, handle: i.handle, ini: (i.displayName || i.handle || '?').slice(0, 1).toUpperCase(),
        since: formatTime(i.openedAt),
        preview: last ? last.body : '',
        status: answered ? 'Replied, waiting on member' : 'Needs a reply',
        needsReply: !answered,
        open: () => store.openSupportReply(i.userId),
        resolve: () => store.resolveSupportRequest(i.requestId),
      };
    }),
    sheetSupportReply: sh === 'supportReply',
    supportReplyWho: (() => { const i = (st.dbSupportInbox ?? []).find((x) => x.userId === st.activeSupportUser); return i ? { name: i.displayName, handle: i.handle, requestId: i.requestId } : null; })(),
    supportReplyMessages: ((st.dbSupportInbox ?? []).find((x) => x.userId === st.activeSupportUser)?.messages ?? [])
      .map((m) => ({ text: m.body, time: formatTime(m.created_at), mine: m.sender === 'agent' })),
    supportReplyDraft: st.supportReplyDraft,
    onSupportReplyDraft: (v: string) => store.setState({ supportReplyDraft: v }),
    supportReplySending: !!st.pending.adminReply,
    sendSupportReply: () => store.withPending('adminReply', () => store.sendSupportReply()),
    goMembers: go('members', { uq: '' }), goAds: go('ads'),

    // Phase 8: Members Management (real data from Supabase in admin mode)
    memberRows: (st.dbMembers ?? []).map((m) => ({
      id: m.id,
      name: m.display_name || m.handle,
      handle: m.handle,
      username: m.username,
      role: m.role === 'superadmin' ? 'Super Admin' : 'Member',
      posts: String(m.post_count),
      joined: m.created_at,
      status: m.is_suspended ? 'Suspended' : 'Active',
      suspended: m.is_suspended,
      suspend: () => store.suspendMemberSupabase(m.id),
      restore: () => store.restoreMemberSupabase(m.id),
      remove: () => store.removeMemberSupabase(m.id),
    })),
    memberCount: st.dbMembers?.length ?? 0,
    suspendedCount: st.dbMembers?.filter(m => m.is_suspended).length ?? 0,
    memberSearchActive: st.memberSearchQuery.length > 0,
    searchMembers: (q: string) => store.searchMembersSupabase(q),
    clearMemberSearch: () => store.searchMembersSupabase(''),

    adSlots: adRows.map((a) => {
      const pct = a.days ? Math.max(0, Math.min(100, Math.round((a.days - a.daysLeft) / a.days * 100))) : 0;
      const ended = a.daysLeft <= 0;
      return {
        ...a, pct, ended,
        screenIcon: SCREEN_ICON[a.screen] || 'web_asset',
        statusLabel: a.live ? 'Live' : ended ? 'Ended' : 'Paused',
        metrics: [
          { value: money(Math.round(a.revenue)), label: 'Revenue', color: '#0F7B3D' }, // whole dollars, like the mock figures
          { value: compact(a.impressions), label: 'Impressions', color: '#16181F' },
          { value: a.ctr.toFixed(1) + '%', label: 'CTR', color: '#0B6BCB' },
        ],
        runLabel: ended ? `Ended · ran ${a.days} days` : `${a.daysLeft} of ${a.days} days left`,
        runColor: ended ? '#B42318' : a.daysLeft <= 3 ? '#B4611D' : '#6B7280',
        toggleLabel: a.live ? 'Pause on this screen' : ended ? 'Relaunch' : 'Set live',
        toggle: () => store.toggleAdSupabase(a.id, !a.live),
        edit: () => store.setState({ sheet: 'ad', adEditId: a.id, adDraft: { campaignKey: a.campaignKey, days: a.days } }),
      };
    }),
    adRevenue: money(Math.round(adRows.reduce((s, a) => s + a.revenue, 0))),
    // No historical baseline in the database yet, so no month-over-month figure.
    adRevenueDelta: '',
    adTotals: [
      { value: compact(adRows.reduce((s, a) => s + a.impressions, 0)), label: 'Impressions' },
      { value: adRows.filter((a) => a.live).length + ' / ' + adRows.length, label: 'Slots live' },
      { value: (adRows.length ? adRows.reduce((s, a) => s + a.ctr, 0) / adRows.length : 0).toFixed(1) + '%', label: 'Avg CTR' },
    ],
    adLiveCount: `${adRows.filter((a) => a.live).length} running`,
    adHome: store.slotFor('Home', fresh, st),
    adFeed: store.slotFor('Registry', fresh, st),
    adForum: store.slotFor('Forum', fresh, st),

    sheetAd: sh === 'ad', adEdit,
    adCampaigns: campaigns.map((c) => ({
      ...c, on: (st.adDraft ? st.adDraft.campaignKey : null) === c.key,
      mark: (st.adDraft ? st.adDraft.campaignKey : null) === c.key ? 'radio_button_checked' : 'radio_button_unchecked',
      pick: () => store.setState((s) => ({ adDraft: { campaignKey: c.key, days: s.adDraft?.days ?? 30 } })),
    })),
    adDurations: [7, 14, 30, 60].map((n) => ({
      label: n + ' days', on: (st.adDraft ? st.adDraft.days : 0) === n,
      pick: () => store.setState((s) => ({ adDraft: { campaignKey: s.adDraft?.campaignKey ?? campaigns[0]?.key ?? '', days: n } })),
    })),
    saveAdLoading: !!st.pending.ad,
    saveAd: () => store.withPending('ad', store.saveAdSupabase),

    q: st.q, onQuery: (v: string) => store.setState({ q: v }),
    regIsLost: sc === 'lost', regIsFound: sc === 'found',
    filters: (admin ? ['All', 'Active', 'Resolved', 'Reunited', 'Flagged'] : ['All', 'My posts', 'Active', 'Reunited', 'Resolved'])
      .map((f) => ({ name: f, on: st.filter === f, pick: () => store.setState({ filter: f }) })),
    registry: registry.map((i, ix) => ({
      ...i, open: openItem(i),
      adAfter: !admin && ix === 3 && registry.length > 4 && store.slotFor('Registry', fresh, st).live,
    })),
    registryHasMore: st.registryHasMore,
    registryLoadingMore: st.registryLoadingMore,
    loadMoreRegistry: store.loadMoreRegistry,
    myPostsEmpty: settled('registry') && st.filter === 'My posts' && registry.length === 0,
    registryEmpty: settled('registry') && registry.length === 0 && st.filter !== 'My posts',

    topics: ['All', 'Sighting', 'Reunited', 'Question'].map((name) => ({
      name,
      on: name === 'All' ? !st.forumTag : name === st.forumTag,
      pick: () => store.setForumTag(name === 'All' ? '' : name),
    })),
    canPost: !admin,
    threadsEmpty: settled('forum') && visibleThreads.length === 0,
    threads: visibleThreads.map((x) => ({
      ...x,
      isAdmin: admin,
      suspended: x.status === 'suspended',
      ini: initials(x.author_handle),
      user: x.author_handle,
      meta: `${x.created_at} · ${x.author_display_name}`,
      replyLabel: `${x.reply_count} ${x.reply_count === 1 ? 'reply' : 'replies'}`,
      helpfulCount: x.helpful_vote_count,
      open: () => {
        store.setState({ sheet: 'thread', activeThread: x.id, replyDraft: '' });
        store.loadRepliesSupabase(x.id).catch(console.error);
        store.scrollChat();
      },
      helpful: () => store.toggleThreadHelpfulSupabase(x.id),
      suspendLabel: x.status === 'suspended' ? 'Restore post' : 'Suspend post',
      suspend: () => {
        if (x.status === 'suspended') store.restoreThreadSupabase(String(x.id)); else store.suspendThreadSupabase(String(x.id));
      },
      remove: () => store.deleteThreadSupabase(String(x.id)),
    })),

    sheetThread: sh === 'thread',
    thread: thread
      ? {
        ...thread,
        replyLabel: `${(st.dbReplies || []).length} ${(st.dbReplies || []).length === 1 ? 'reply' : 'replies'}`,
        suspendLabel: thread.status === 'suspended' ? 'Restore post' : 'Suspend post',
      }
      : { replies: [] as unknown[] },
    hasThread: !!thread,
    threadReplies: (st.dbReplies || []).map((r: any) => ({
      ...r,
      ini: initials(r.author_handle),
      user: r.author_handle,
      time: r.created_at,
      text: r.body,
    })),
    noReplies: !st.dbReplies || st.dbReplies.length === 0,
    replyDraft: st.replyDraft,
    onReplyDraft: (v: string) => store.setState({ replyDraft: v }),
    replySending: !!st.pending.reply,
    sendReply: () => store.withPending('reply', () => store.replyToThreadSupabase()),
    // Closing the sheet matches how delete behaves and avoids showing a now-stale action label.
    suspendThread: () => {
      const id = st.activeThread;
      if (!id) return;
      const currentThread = st.dbThreads?.find((t) => t.id === id);
      if (currentThread?.status === 'suspended') store.restoreThreadSupabase(String(id));
      else store.suspendThreadSupabase(String(id));
    },
    deleteThread: () => {
      const id = st.activeThread;
      if (!id) return;
      store.deleteThreadSupabase(String(id));
    },

    sheetNewThread: sh === 'newthread',
    openNewThread: () => store.setState({ sheet: 'newthread', ntTitle: '', ntBody: '', ntTag: 'Question' }),
    newTopics: ['Sighting', 'Reunited', 'Question'].map((name) => ({
      name, on: st.ntTag === name, pick: () => store.setState({ ntTag: name }),
    })),
    ntTitle: st.ntTitle, ntBody: st.ntBody,
    onNtTitle: (v: string) => store.setState({ ntTitle: v }),
    onNtBody: (v: string) => store.setState({ ntBody: v }),
    publishEnabled: !!(st.ntTitle.trim() && st.ntBody.trim()),
    publishLoading: !!st.pending.publish,
    publishThread: () => {
      if (!st.ntTitle.trim() || !st.ntBody.trim()) return;
      store.withPending('publish', () => store.createThreadSupabase());
    },

    uq: st.uq,
    onUserQuery: (v: string) => { store.setState({ uq: v }); store.queueMemberSearch(v); },
    membersEmpty: settled('members') && (st.dbMembers ?? []).length === 0,
    members: (st.dbMembers ?? []).map((m) => {
      const name = m.display_name || m.handle;
      const isSuper = m.role === 'superadmin';
      return {
        ini: initials(name), name, key: m.id,
        meta: `@${m.handle} · ${m.post_count} posts · joined ${joinedLabel(m.created_at)}${isSuper ? ' · Super Admin' : ''}`,
        status: m.is_suspended ? 'Suspended' : 'Active', chipKey: m.is_suspended ? 'Flagged' : 'Active',
        toggleLabel: m.is_suspended ? 'Restore' : 'Suspend',
        // Staff accounts can't be suspended from here (it would lock an admin out), and there is no
        // permanent-delete yet (see 8.3 in the checklist), so rows have no Remove action.
        canAct: !isSuper,
        canRemove: false,
        toggle: m.is_suspended ? () => store.restoreMemberSupabase(m.id) : () => store.suspendMemberSupabase(m.id),
        remove: () => {},
      };
    }),

    showFab: !admin,
    navLeft: admin
      ? [tab('home', 'space_dashboard', 'Home', 'dash'), tab('registry', 'travel_explore', 'Registry', 'lost'), tab('moderation', 'flag', 'Review', 'moderation')]
      : [tab('home', 'space_dashboard', 'Home', 'dash'), tab('lost', 'travel_explore', 'Lost', 'lost')],
    navRight: admin
      ? [tab('members', 'group', 'Members', 'members'), tab('forum', 'forum', 'Forum', 'forum')]
      : [tab('found', 'storefront', 'Found', 'found'), tab('forum', 'forum', 'Forum', 'forum')],
    openReport: () => store.setState({ sheet: 'report', step: 1, toast: '' }),
    openProfile: () => store.setState({ sheet: 'profile', toast: '' }),
    closeSheet: () => store.setState({ sheet: null }),
    sheetGuidelines: sh === 'guidelines',
    openGuidelines: () => store.setState({ sheet: 'guidelines' }),
    guidelinesLoading: !!st.pending.guidelines,
    acceptGuidelines: () => store.withPending('guidelines', store.acceptGuidelinesSupabase),
    guidelineRules: [
      { icon: 'public', title: 'Meet in public, in daylight', body: 'Police station lobbies, café counters and transit hubs are ideal. Never a home address, never a car park after dark.' },
      { icon: 'group_add', title: 'Bring someone with you', body: "Tell a friend where you're going and when you expect to be back. Handovers take two minutes; a companion costs nothing." },
      { icon: 'quiz', title: 'Verify before you hand over', body: "Ask the claimant to describe a detail that isn't in the listing — a scratch, a lock screen, what's in the side pocket." },
      { icon: 'lock', title: 'Keep personal data off the post', body: 'No phone numbers, addresses, serial numbers or ID scans in listings or the forum. Use in-app chat for anything specific.' },
      { icon: 'payments', title: 'No money changes hands', body: "Returns are free. Rewards, deposits and 'shipping fees' are the most common scam on the platform — report anyone who asks." },
      { icon: 'chat', title: 'Be decent in the forum', body: 'No accusations, doxxing or pile-ons. Posts that break this are suspended by Super Admins and repeat accounts are removed.' },
    ],
    sheetDetail: sh === 'detail', sheetReport: sh === 'report',
    sheetSent: sh === 'sent', sheetProfile: sh === 'profile',

    showBell: true,
    sheetNotifications: sh === 'notifications',
    unreadNotifs: st.notifications.filter((n) => !n.isRead).length,
    hasUnreadNotifs: st.notifications.some((n) => !n.isRead),
    notificationList: st.notifications.map((n) => ({
      id: n.id, title: n.title, body: n.body, time: n.time, unread: !n.isRead,
      icon: ({ message: 'chat', match: 'person_search', moderation: 'flag', system: 'info' } as const)[n.type] ?? 'notifications',
      open: () => store.openNotification(n.id),
    })),
    noNotifications: settled('notifications') && st.notifications.length === 0,
    openNotifications: store.openNotifications,
    markAllRead: store.markAllNotificationsRead,
    sheetOpen: !!sh,

    detail: sel,
    detailRows: ([{ k: 'Status', v: sel.status }, { k: 'Where', v: sel.location }] as { k: string; v: string }[])
      .concat(sel.coords ? [{ k: 'Map pin', v: sel.coords }] : [])
      .concat([{ k: 'When', v: sel.date }, { k: 'Submitted by', v: sel.by }]),
    // Only an open post can be claimed. Once it is reunited / resolved the button goes away (a person who already has
    // a conversation about it can still open that chat), and a note says why.
    canClaim: !admin && sel.by !== meHandle
      && (sel.status === 'Active' || !!existingConvo),
    claimClosedNote: !admin && sel.by !== meHandle && sel.status !== 'Active' && !existingConvo
      ? (sel.status === 'Reunited' ? 'This item has already been reunited with its owner.'
        : sel.status === 'Resolved' ? 'This post has been closed by its owner.'
        : 'This post is under review and cannot be claimed right now.')
      : '',
    isOwner: !admin && sel.by === meHandle,
    ownerHint: sel.status === 'Reunited'
      ? 'Handed over. Members can still read the record but it no longer shows as open.'
      : 'When you hand the item to its owner, update the status here so the community stops searching.',
    handoverLabel: sel.status === 'Reunited' ? 'Reopen this post' : 'Mark as handed over',
    ownerStatuses: ['Active', 'Reunited', 'Resolved'].map((name) => ({
      name, on: sel.status === name,
      pick: () => store.setItemStatusSupabase(name as Status),
    })),
    withdrawPost: store.withdrawItemSupabase,
    handoverLoading: !!st.pending.handover,
    toggleHandover: () => store.withPending('handover', () => store.setItemStatusSupabase(sel.status === 'Reunited' ? 'Active' : 'Reunited')),
    // Already claimed (this session or an earlier one)? Open that conversation instead of re-claiming.
    claimLoading: !!st.pending.claim,
    claim: existingConvo ? () => store.openChatSupabase(existingConvo.id) : () => store.withPending('claim', store.claimItemSupabase),
    claimLabel: existingConvo ? 'Open chat with finder' : (sel.kind === 'Found' ? 'This is mine' : 'I have found this'),

    isMessages: sc === 'messages',
    unreadTotal: unread, hasUnread: unread > 0,
    openMessages: () => store.setState({ screen: 'messages', sheet: null, toast: '' }),
    conversations: st.convos.map((c) => {
      const msgs = (c as any).msgs || [];
      const last = msgs[msgs.length - 1] || ({} as { from?: string; text?: string });
      return {
        itemId: c.itemId, item: c.item, icon: c.icon, with: c.with, time: c.time,
        ini: initials(c.with),
        preview: (last.from === 'me' ? 'You: ' : '') + (last.text || ''),
        unread: c.unread, hasUnread: c.unread > 0,
        open: () => store.openChatSupabase(c.id),
      };
    }),
    noConversations: settled('conversations') && st.convos.length === 0,

    sheetChat: sh === 'chat',
    chatWith: convoWith, chatItem: convo ? convo.item : sel.title,
    chatItemId: convo ? convo.itemId : sel.id, chatIcon: convo ? convo.icon : sel.icon,
    chatIni: initials(convoWith),
    messages: convoMsgs.map((m) => ({ text: m.text, time: m.time, mine: m.from === 'me' })),
    showQuickReplies: convoMsgs.length < 6,
    quickReplies: [
      { label: 'Meet in public', icon: 'handshake', text: "Could we meet at the station café tomorrow around 6pm? It's public and busy." },
      { label: 'Post it to me', icon: 'local_shipping', text: "If meeting is hard, I'm happy to cover postage and send you a prepaid label." },
      { label: 'Share my number', icon: 'call', text: "Here's my number so we can sort out the handover faster." },
    ].map((r) => ({ ...r, send: () => store.setState({ draft: r.text }) })),
    draft: st.draft,
    onDraft: (v: string) => store.setState({ draft: v }),
    chatSending: !!st.pending.chat,
    sendMessage: () => store.withPending('chat', store.sendMessageSupabase),
    addPhoto: store.pickPhotoSupabase,
    flagRecord: store.flagItemSupabase,
    deleteRecord: store.deleteItemSupabase,

    isStep1: st.step === 1, isStep2: st.step === 2,
    reportTitle: st.step === 1 ? 'Report an item' : 'Where and when',
    rType: st.rType,
    setLost: () => store.setState({ rType: 'Lost' }), setFound: () => store.setState({ rType: 'Found' }),
    rTitle: st.rTitle, rPlace: st.rPlace, rDate: st.rDate, rDesc: st.rDesc, rCat: st.rCat,
    onRTitle: (v: string) => store.setState({ rTitle: v }),
    onRPlace: (v: string) => store.setState({ rPlace: v }),
    onRDate: (v: string) => store.setState({ rDate: v }),
    onRDesc: (v: string) => store.setState({ rDesc: v }),
    categories: CATS.map((c) => ({ name: c, on: st.rCat === c, pick: () => store.setState({ rCat: c }) })),
    reportBtnLabel: st.step === 1 ? 'Continue' : 'Submit to registry',
    reportBtnEnabled: st.step === 1 ? !!(st.rTitle.trim() && st.rCat) : !!st.rPlace.trim() && !!st.rPhotoBlob,
    photoRequired: true,
    photoPreview: st.rPhotoPreview,
    removePhoto: store.removePhoto,
    itemPhotos: (sel.dbId ? st.photoUrls[sel.dbId] : undefined) ?? [],
    reportBtnLoading: !!st.pending.report && st.step === 2,
    reportNext: () => store.withPending('report', store.reportItemSupabase),
    newId: st.newId,
    goRegistryFromSent: () => store.setState({ screen: st.newId.startsWith('LOST') ? 'lost' : 'found', sheet: null, filter: 'All', q: '' }),

    hasPin: !!st.pin,
    pinLabel: st.pin ? `pin set · ${st.pin.lat}, ${st.pin.lng}` : 'no pin set',
    clearPin: () => store.setState({ pin: null }),
    mapPin: st.pin ? { lat: Number(st.pin.lat), lng: Number(st.pin.lng) } : null,
    onMapPick: (at: LatLng) => { store.setPinSupabase(at); },
    placeQuery: st.placeQuery,
    onPlaceQuery: (q: string) => store.setState({ placeQuery: q }),
    searchPlace: store.searchPlaceSupabase,
    placeSearching: st.placeSearching,
    placeResults: st.placeResults.map((r) => ({ key: `${r.lat},${r.lng}`, label: r.label, pick: () => store.setPinSupabase(r, r.label) })),
    detailPin: parseCoords(sel.coords),
    useMyLocation: store.useMyLocationSupabase,

    meName: store.me().name,
    meEmail: st.authEmail || '',
    // Only facts that exist in the database.
    settings: [
      { label: 'Member since', value: st.profile ? new Date(st.profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
      ...(admin
        ? [{ label: 'Role', value: 'Super admin' }]
        : [
            { label: 'Reports posted', value: String(st.myDashStats?.totalReports ?? 0) },
            { label: 'Forum posts', value: String(st.profile?.post_count ?? 0) },
            { label: 'Guidelines accepted', value: st.suTerms ? 'Yes' : 'Not yet' },
          ]),
    ],
    toastSupport: () => { store.setState({ sheet: 'support', supportDraft: '' }); store.scrollChat(); },
    sheetSupport: sh === 'support',
    // The assistant's greeting (not stored) always opens the thread, so it doesn't vanish after the first question.
    supportMessages: [
      { text: SUPPORT_GREETING, time: '', mine: false },
      ...(st.dbSupportMessages ?? []).map((m) => ({ text: m.body, time: formatTime(m.created_at), mine: m.sender === 'user' })),
    ],
    botTyping: st.botTyping,
    faqChips: (st.dbFaqEntries ?? []).map((f) => ({ q: f.question, ask: () => store.askBot(f.question) })),
    supportDraft: st.supportDraft,
    onSupportDraft: (v: string) => store.setState({ supportDraft: v }),
    sendSupport: () => store.askBot(st.supportDraft),
    escalate: store.escalateSupabase,
    logout: () => {
      store.signOutSupabase();
      store.setState({
        screen: 'login', role: null, username: '', password: '', sheet: null, toast: '',
        convos: [], activeConvo: null, draft: '',
        profile: null, authEmail: null, fpRecovery: false, pending: {}, loads: IDLE_LOADS, notifications: [], myDashStats: null, adminDashStats: null, registryHasMore: false, registryLoadingMore: false,
        // Every cached server list: another account signing in on this device must not see the last user's data.
        dbItems: null, dbThreads: null, dbReplies: null, dbMembers: null, memberSearchQuery: '', dbModerationQueue: null,
        dbModerationStats: null, dbWeeklyReports: null, dbKeywords: null, dbAdPlacements: null, dbAdCampaigns: null,
        dbFaqEntries: null, dbSupportMessages: null, dbSupportInbox: null, activeSupportUser: null, supportReplyDraft: '',
        suUser: '', suEmail: '', suPass: '', suConfirm: '', suTerms: false, suError: '', suInfo: '',
        fpStage: 'email', fpEmail: '', fpPass: '', fpConfirm: '', fpError: '', fpBusy: false, fpInfo: '',
      });
    },

    // Real counts scale to the busiest day (a 3-report day must not draw as a sliver, nor a 40-report day overflow
    // the card) and the busiest day is highlighted.
    bars: (() => {
      const top = Math.max(1, ...barsData.map(([, v]) => v));
      return barsData.map(([label, v]) => ({ label, value: v, height: v > 0 ? Math.max(6, Math.round(v / top * 96)) : 0, on: v === top }));
    })(),
    barsEmpty: barsData.length === 0,
    keywordsEmpty: (st.dbKeywords ?? []).length === 0,
    keywords: (st.dbKeywords ?? []).map((k) => ({ word: k.word, hits: `${k.hits} ${k.hits === 1 ? 'hit' : 'hits'}` })),
  };
}

export type Vals = ReturnType<typeof buildVals>;
