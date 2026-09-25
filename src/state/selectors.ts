import {
  CAMPAIGNS, CATS, CHAT_SEED, CONVOS, FAQ, FLAGGED, FOUND, LOST, MEMBERS,
  SCOUTS, SCREEN_ICON, SLIDES, SUPPORT_SEED, THREADS, type Item, type Thread,
} from '../data/constants';
import { compact, initials, money } from '../theme/tokens';
import type { AppState, Store } from './store';

const ME = 'simple.user';

/**
 * Port of the prototype's renderVals() (lines 1540-2171). Key names are kept
 * identical so the golden-master oracle can diff this against the original.
 */
export function buildVals(store: Store) {
  const st: AppState = store.state;
  const sc = st.screen;
  const admin = st.role === 'admin';
  const fresh = st.role === 'new';
  const sh = st.sheet;
  const isSupabaseAuth = st.authMode === 'supabase';

  const slide = SLIDES[st.slide];
  const convo = st.convos.find((c) => c.itemId === st.activeConvo) || null;
  const convoMsgs = convo ? convo.msgs : [];
  const convoWith = convo ? convo.with : '';
  const unread = st.convos.reduce((n, c) => n + (c.unread || 0), 0);
  const thread = st.threads.find((x) => x.id === st.activeThread) || null;

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
  const fpCopy = st.authMode === 'supabase'
    ? ({
        email: ['Forgot password', 'Reset your password', "Enter the email on your account and we'll send you a reset link."],
        done: ['Check your inbox', 'Reset link sent', st.fpInfo || "If that email has an account, we've sent a reset link to it."],
      } as Record<string, string[]>)[fpStage] || ['', '', '']
    : ({
        email: ['Step 1 of 3', 'Reset your password', "Enter the email on your account and we'll send a 6-digit code to confirm it's you."],
        code: ['Step 2 of 3', 'Check your inbox', 'Enter the 6-digit code we sent. It expires in 10 minutes.'],
        reset: ['Step 3 of 3', 'Choose a new password', "Pick something you haven't used here before, then confirm it."],
        done: ['All set', "You're back in", 'Your password has been changed.'],
      } as Record<string, string[]>)[fpStage];
  const fpOrder = ['email', 'code', 'reset', 'done'];
  const fpIdx = fpOrder.indexOf(fpStage);

  const visibleThreads = st.threads
    .filter((x) => st.topic === 'All' || x.tag === st.topic)
    .filter((x) => admin || x.status !== 'suspended');

  const all = [...st.lost, ...st.found];
  const sel = all.find((i) => i.id === st.sel) || all[0];
  const openItem = (it: Item) => () => store.setState({ sel: it.id, sheet: 'detail', toast: '' });
  const go = (screen: string, extra?: Partial<AppState>) => () =>
    store.setState({ screen, sheet: null, filter: 'All', q: '', toast: '', ...(extra || {}) });

  const source = sc === 'lost' ? st.lost : st.found;
  const myPosts = [...st.lost, ...st.found].filter((i) => i.by === ME);
  let registry = st.filter === 'All' ? source
    : st.filter === 'My posts' ? source.filter((i) => i.by === ME)
    : source.filter((i) => i.status === st.filter);
  const q = st.q.trim().toLowerCase();
  if (q) registry = registry.filter((i) => (i.title + ' ' + i.location + ' ' + i.id).toLowerCase().includes(q));

  const decide = (id: string, ok: boolean) => () => {
    store.setState((s) => ({
      flagged: s.flagged.filter((f) => f.id !== id),
      approved: s.approved + (ok ? 1 : 0),
      removed: s.removed + (ok ? 0 : 1),
    }));
    store.flash(ok ? `${id} approved and unflagged.` : `${id} was permanently deleted by Super Admin.`);
  };

  const titles: Record<string, string[]> = {
    dash: admin ? ['Super admin', 'System control'] : ['Community member', 'My dashboard'],
    lost: ['Registry', 'Lost items'], found: ['Registry', 'Found items'], forum: ['Community', 'Forum'],
    moderation: ['Super admin', 'Moderation'], analysis: ['Super admin', 'Analysis'],
    members: ['Super admin', 'Members'], messages: ['Inbox', 'Messages'], ads: ['Monetization', 'Ad placements'],
  };
  const t = titles[sc] || ['', ''];

  const activeKey = admin
    ? (({ dash: 'home', lost: 'registry', found: 'registry', moderation: 'moderation', members: 'members', forum: 'forum', analysis: 'home' } as Record<string, string>)[sc] || '')
    : (({ dash: 'home', lost: 'lost', found: 'found', forum: 'forum' } as Record<string, string>)[sc] || '');
  const tab = (key: string, icon: string, label: string, screen: string) => ({
    icon, label, key, on: key === activeKey, go: go(screen),
  });

  const bars: [string, number][] = [['M', 9], ['T', 13], ['W', 11], ['T', 18], ['F', 14], ['S', 8], ['S', 12]];
  const memberList = st.members.filter((m) =>
    !st.uq.trim() || (m.name + ' ' + m.handle).toLowerCase().includes(st.uq.trim().toLowerCase()));

  const adEdit = (() => {
    const a = st.ads.find((x) => x.id === st.adEditId) || st.ads[0];
    const d = st.adDraft || { campaignKey: a.campaignKey, days: a.days };
    const c = CAMPAIGNS.find((x) => x.key === d.campaignKey) || CAMPAIGNS[0];
    const proj = Math.round(c.cpm * (a.impressions / a.days) * d.days / 1000);
    return {
      ...a, ...c, projected: money(proj),
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
      : `${admin ? 'Super Admin' : fresh ? 'New User' : 'Simple User'} · ${t[1]}`,
    reset: () => store.setState({
      ...({ screen: 'welcome', slide: 0, convos: CONVOS, activeConvo: null, draft: '',
        supportMsgs: SUPPORT_SEED, supportDraft: '', botTyping: false,
        threads: THREADS, activeThread: null, replyDraft: '', ntTitle: '', ntBody: '', ntTag: 'Question',
        role: null, username: '', password: '', error: '', sheet: null,
        suUser: '', suEmail: '', suPass: '', suConfirm: '', suTerms: false, suError: '',
        fpStage: 'email', fpEmail: '', fpCode: '', fpPass: '', fpConfirm: '', fpError: '', fpBusy: false,
        flagged: FLAGGED, approved: 0, removed: 0, lost: LOST, found: FOUND, members: MEMBERS,
        q: '', uq: '', filter: 'All', topic: 'All', claimed: {}, step: 1,
        rTitle: '', rCat: '', rPlace: '', rDate: '', rDesc: '', pin: null, toast: '' } as Partial<AppState>),
    }),

    isWelcome: sc === 'welcome', slide, slideIndex: st.slide,
    nextLabel: st.slide === SLIDES.length - 1 ? 'Get started free' : 'Next',
    showWelcomeBack: st.slide > 0,
    prevSlide: () => store.setState((s) => ({ slide: Math.max(0, s.slide - 1) })),
    nextSlide: () => store.setState((s) => s.slide === SLIDES.length - 1 ? { screen: 'login' } : { slide: s.slide + 1 }),
    skipWelcome: () => store.setState({ screen: 'login' }),

    socials: [
      { name: 'Google', mark: 'G', bg: '#fff', fg: '#101319', ring: true },
      { name: 'Facebook', mark: 'f', bg: '#1877F2', fg: '#fff', ring: false },
      { name: 'X', mark: 'X', bg: '#101319', fg: '#fff', ring: true },
    ].map((s) => ({ ...s, go: () => {
      store.setState({ busy: true });
      setTimeout(() => store.setState({ busy: false, screen: 'dash', role: 'user' }), 700);
    } })),
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
    signupEnabled: !!(st.suUser.trim() && st.suEmail.trim() && st.suPass && st.suConfirm && st.suTerms) && !st.busy,
    submitSignup: isSupabaseAuth ? store.signUpSupabase : () => {
      if (!st.suUser.trim() || !st.suEmail.trim() || !st.suPass) { store.setState({ suError: 'Fill in username, email and password to continue.' }); return; }
      if (!/.+@.+\..+/.test(st.suEmail)) { store.setState({ suError: "That email address doesn't look right." }); return; }
      if (st.suPass.length < 8) { store.setState({ suError: 'Use at least 8 characters for your password.' }); return; }
      if (st.suPass !== st.suConfirm) { store.setState({ suError: "Passwords don't match. Check both fields." }); return; }
      if (!st.suTerms) { store.setState({ suError: 'Please accept the community guidelines.' }); return; }
      store.setState({ screen: 'dash', role: 'user', suError: '' });
      store.flash('Welcome to Lost Items Community. Your account is live.');
    },

    isForgot: sc === 'forgot',
    goForgot: () => store.setState({ screen: 'forgot', fpStage: 'email', fpEmail: st.username.includes('@') ? st.username : '', fpCode: '', fpPass: '', fpConfirm: '', fpError: '', fpInfo: '', error: '' }),
    fpKicker: fpCopy[0], fpTitle: fpCopy[1], fpBody: fpCopy[2], fpIdx,
    fpIsEmail: fpStage === 'email', fpIsCode: fpStage === 'code',
    fpIsReset: fpStage === 'reset', fpIsDone: fpStage === 'done',
    fpShowSignInLink: fpStage !== 'done',
    fpEmail: st.fpEmail, fpCode: st.fpCode, fpPass: st.fpPass, fpConfirm: st.fpConfirm, fpError: st.fpError, fpInfo: st.fpInfo,
    onFpEmail: (v: string) => store.setState({ fpEmail: v, fpError: '' }),
    onFpCode: (v: string) => store.setState({ fpCode: v.replace(/\D/g, '').slice(0, 6), fpError: '' }),
    onFpPass: (v: string) => store.setState({ fpPass: v, fpError: '' }),
    onFpConfirm: (v: string) => store.setState({ fpConfirm: v, fpError: '' }),
    fpMatchGlyph: !st.fpConfirm ? '' : (st.fpConfirm === st.fpPass ? 'check_circle' : 'cancel'),
    fpMatchColor: st.fpConfirm === st.fpPass ? '#0F7B3D' : '#B42318',
    fpStrength, fpStrengthColor,
    fpStrengthLabel: fpStrength === 0 ? 'Use 8+ characters with a number and a symbol'
      : fpStrength === 1 ? 'Too short — 8 characters minimum'
      : fpStrength === 2 ? 'Good. Add a symbol to make it strong.' : 'Strong password',
    fpPrimaryLabel: st.fpBusy ? 'Sending…' : fpStage === 'email' ? (isSupabaseAuth ? 'Send reset link' : 'Send reset code')
      : fpStage === 'code' ? 'Verify code' : fpStage === 'reset' ? 'Update password' : 'Back to sign in',
    fpPrimaryEnabled: !st.fpBusy && (fpStage === 'email' ? !!st.fpEmail.trim()
      : fpStage === 'code' ? st.fpCode.length === 6
      : fpStage === 'reset' ? !!(st.fpPass && st.fpConfirm) : true),
    fpPrimary: isSupabaseAuth ? () => {
      if (fpStage === 'email') { store.requestResetSupabase(); return; }
      store.setState({ screen: 'login', fpStage: 'email', fpPass: '', fpConfirm: '', fpCode: '', fpInfo: '', error: '', password: '' });
    } : () => {
      if (fpStage === 'email') {
        if (!/.+@.+\..+/.test(st.fpEmail.trim())) { store.setState({ fpError: 'Enter the email address on your account.' }); return; }
        store.setState({ fpBusy: true, fpError: '' });
        setTimeout(() => store.setState({ fpBusy: false, fpStage: 'code', fpCode: '' }), 650);
        return;
      }
      if (fpStage === 'code') {
        if (st.fpCode.length !== 6) { store.setState({ fpError: 'Enter all six digits of the code.' }); return; }
        store.setState({ fpStage: 'reset', fpError: '' });
        return;
      }
      if (fpStage === 'reset') {
        if (st.fpPass.length < 8) { store.setState({ fpError: 'Use at least 8 characters for your new password.' }); return; }
        if (st.fpPass !== st.fpConfirm) { store.setState({ fpError: "Passwords don't match. Check both fields." }); return; }
        store.setState({ fpStage: 'done', fpError: '' });
        return;
      }
      store.setState({ screen: 'login', fpStage: 'email', fpPass: '', fpConfirm: '', fpCode: '', error: '', password: '' });
    },
    fpResend: () => { store.setState({ fpCode: '', fpError: '' }); store.flash(`New code sent to ${st.fpEmail}.`); },
    fpBack: () => {
      if (fpStage === 'code') store.setState({ fpStage: 'email', fpError: '' });
      else if (fpStage === 'reset') store.setState({ fpStage: 'code', fpError: '' });
      else store.setState({ screen: 'login', fpStage: 'email', fpError: '' });
    },

    isLogin: sc === 'login',
    isUserDash: sc === 'dash' && !admin && !fresh, isFreshDash: sc === 'dash' && fresh,
    isAdminDash: sc === 'dash' && admin,
    isRegistry: sc === 'lost' || sc === 'found', isForum: sc === 'forum',
    isModeration: sc === 'moderation', isAnalysis: sc === 'analysis',
    isMembers: sc === 'members', isAds: sc === 'ads' && admin,
    isAdmin: admin, isSimple: !admin && sc !== 'login',
    showHeader: !['login', 'welcome', 'signup', 'forgot'].includes(sc),
    showNav: !['login', 'welcome', 'signup', 'forgot'].includes(sc),
    showBack: ['moderation', 'analysis', 'members', 'messages'].includes(sc),
    showInbox: !admin,
    back: go('dash'),
    headerKicker: t[0], headerTitle: t[1], toast: st.toast,
    initials: store.me().ini,

    username: st.username, password: st.password, error: st.error,
    onUser: (v: string) => store.setState({ username: v, error: '' }),
    onPass: (v: string) => store.setState({ password: v, error: '' }),
    submit: isSupabaseAuth ? store.signInSupabase : store.signIn,
    signInLabel: st.busy ? 'Signing in…' : 'Sign in & continue',
    signInEnabled: !!(st.username && st.password) && !st.busy,
    toggleRemember: () => store.setState((s) => ({ remember: !s.remember })),
    remember: st.remember,
    // Temporary Phase-1 scaffolding -- see backend/INTEGRATION_CHECKLIST.md.
    // Removed once every screen is wired to Supabase and the demo path is dropped.
    authMode: st.authMode, isDemoAuth: !isSupabaseAuth, isSupabaseAuthMode: isSupabaseAuth,
    authModeOptions: [
      { key: 'demo', label: 'Demo data', on: !isSupabaseAuth, pick: () => store.setAuthMode('demo') },
      { key: 'supabase', label: 'Supabase account', on: isSupabaseAuth, pick: () => store.setAuthMode('supabase') },
    ],
    quickLogins: [
      { name: 'Super Admin', handle: 'superadmin', desc: 'Moderation queue and member controls', icon: 'shield', color: '#0B6BCB', tint: 'rgba(11,107,203,.1)', go: () => store.quick('superadmin') },
      { name: 'Simple User', handle: 'user', desc: 'Existing member with posts and chats', icon: 'person', color: '#0F7B3D', tint: 'rgba(15,123,61,.1)', go: () => store.quick('user') },
      { name: 'New User', handle: 'newuser', desc: 'Fresh account — nothing posted yet', icon: 'person_add', color: '#B4611D', tint: 'rgba(180,97,29,.12)', go: () => store.quick('newuser') },
    ],

    setupSteps: (() => {
      const done1 = !!st.suTerms, done2 = myPosts.length > 0, done3 = st.threads.some((x) => x.mine);
      const mk = (done: boolean, title: string, desc: string, go: () => void) => ({
        title, desc, go, done, mark: done ? 'check' : 'radio_button_unchecked',
      });
      return [
        mk(done1, 'Read the safe meetup rules', 'Two minutes. It keeps handovers safe.', () => store.setState({ sheet: 'guidelines' })),
        mk(done2, 'Post your first report', 'Lost or found — add a photo, place and date.', () => store.setState({ sheet: 'report', step: 1, toast: '' })),
        mk(done3, 'Say hello in the forum', 'Ask a question or share a sighting.', () => store.setState({ screen: 'forum', sheet: null })),
      ];
    })(),
    setupProgress: `${[!!st.suTerms, myPosts.length > 0, st.threads.some((x) => x.mine)].filter(Boolean).length} of 3 done`,

    myStats: fresh
      ? [{ value: '0', label: 'Active reports', color: '#a8acb2' }, { value: '0', label: 'Reunited', color: '#a8acb2' }, { value: '0', label: 'Forum posts', color: '#a8acb2' }]
      : [{ value: '2', label: 'Active reports', color: '#0B6BCB' }, { value: '1', label: 'Reunited', color: '#0F7B3D' }, { value: '4', label: 'Forum posts', color: '#16181F' }],
    shortcuts: [
      { icon: 'travel_explore', title: 'Search lost items registry', desc: 'Browse recent lost reports from members in your city.', go: go('lost') },
      { icon: 'storefront', title: 'Search found items registry', desc: 'Check if someone handed in what you are missing.', go: go('found') },
      { icon: 'chat', title: 'Messages', desc: unread ? `${unread} unread from people returning your items.` : 'Your conversations with finders and owners.', go: go('messages') },
    ],
    handedIn: st.found.slice(0, 5).map((i) => ({ ...i, open: openItem(i) })),
    comments: [
      { ini: 'JO', user: 'Joyce', onItem: 'Rolex Submariner', time: '09:00 AM', text: 'Great news! I think I saw this matching description at the Central Station desk.' },
      { ini: 'GL', user: 'Gladyce', onItem: 'MacBook Pro 16', time: '08:45 AM', text: 'Verified ownership serial number matches. Owner contacted successfully.' },
    ],
    goSearch: go('found'), goFound: go('found'), goLost: go('lost'),

    flaggedCount: st.flagged.length, flaggedEmpty: st.flagged.length === 0,
    flagged: st.flagged.map((f) => ({ ...f, sub: `${f.author} · ${f.date}`, approve: decide(f.id, true), remove: decide(f.id, false) })),
    adminMetrics: [
      { label: 'Active lost', value: '1,293', color: '#16181F', delta: '↓ 36.8% vs last month', deltaColor: '#0F7B3D', icon: 'person_search', iconColor: '#B42318' },
      { label: 'Recovered', value: '256k', color: '#0B6BCB', delta: '↑ 36.8% vs last month', deltaColor: '#0F7B3D', icon: 'inventory_2', iconColor: '#0F7B3D' },
      { label: 'Scouts online', value: '857', color: '#16181F', delta: '857 joined today', deltaColor: '#8b8f95', icon: 'group', iconColor: '#0B6BCB' },
    ],
    sentimentRows: [
      { k: 'Avg response velocity', v: '12.4 min', color: '#0B6BCB' },
      { k: 'Flagged keyword alerts', v: '3 pending', color: '#B42318' },
      { k: 'Active scouts', v: '857 online', color: '#0F7B3D' },
    ],
    modStats: [
      { value: st.flagged.length, label: 'Pending', color: '#B42318' },
      { value: st.approved, label: 'Approved', color: '#0F7B3D' },
      { value: st.removed, label: 'Removed', color: '#16181F' },
    ],
    scouts: SCOUTS,
    goModeration: go('moderation'), goAnalysis: go('analysis'),
    goMembers: go('members', { uq: '' }), goAds: go('ads'),

    adSlots: st.ads.map((a) => {
      const pct = a.days ? Math.max(0, Math.min(100, Math.round((a.days - a.daysLeft) / a.days * 100))) : 0;
      const ended = a.daysLeft <= 0;
      return {
        ...a, pct, ended,
        screenIcon: SCREEN_ICON[a.screen] || 'web_asset',
        statusLabel: a.live ? 'Live' : ended ? 'Ended' : 'Paused',
        metrics: [
          { value: money(a.revenue), label: 'Revenue', color: '#0F7B3D' },
          { value: compact(a.impressions), label: 'Impressions', color: '#16181F' },
          { value: a.ctr.toFixed(1) + '%', label: 'CTR', color: '#0B6BCB' },
        ],
        runLabel: ended ? `Ended · ran ${a.days} days` : `${a.daysLeft} of ${a.days} days left`,
        runColor: ended ? '#B42318' : a.daysLeft <= 3 ? '#B4611D' : '#6B7280',
        toggleLabel: a.live ? 'Pause on this screen' : ended ? 'Relaunch' : 'Set live',
        toggle: () => store.toggleAd(a.id),
        edit: () => store.setState({ sheet: 'ad', adEditId: a.id, adDraft: { campaignKey: a.campaignKey, days: a.days } }),
      };
    }),
    adRevenue: money(st.ads.reduce((s, a) => s + a.revenue, 0)),
    adRevenueDelta: '+18% vs last month',
    adTotals: [
      { value: compact(st.ads.reduce((s, a) => s + a.impressions, 0)), label: 'Impressions' },
      { value: st.ads.filter((a) => a.live).length + ' / ' + st.ads.length, label: 'Slots live' },
      { value: (st.ads.reduce((s, a) => s + a.ctr, 0) / st.ads.length).toFixed(1) + '%', label: 'Avg CTR' },
    ],
    adLiveCount: `${st.ads.filter((a) => a.live).length} running`,
    adHome: store.slotFor('Home', fresh, st),
    adFeed: store.slotFor('Registry', fresh, st),
    adForum: store.slotFor('Forum', fresh, st),

    sheetAd: sh === 'ad', adEdit,
    adCampaigns: CAMPAIGNS.map((c) => ({
      ...c, on: (st.adDraft ? st.adDraft.campaignKey : null) === c.key,
      mark: (st.adDraft ? st.adDraft.campaignKey : null) === c.key ? 'radio_button_checked' : 'radio_button_unchecked',
      pick: () => store.setState((s) => ({ adDraft: { campaignKey: c.key, days: s.adDraft?.days ?? 30 } })),
    })),
    adDurations: [7, 14, 30, 60].map((n) => ({
      label: n + ' days', on: (st.adDraft ? st.adDraft.days : 0) === n,
      pick: () => store.setState((s) => ({ adDraft: { campaignKey: s.adDraft?.campaignKey ?? CAMPAIGNS[0].key, days: n } })),
    })),
    saveAd: () => {
      const d = st.adDraft!;
      const c = CAMPAIGNS.find((x) => x.key === d.campaignKey) || CAMPAIGNS[0];
      store.setState((s) => ({
        sheet: null,
        ads: s.ads.map((a) => a.id === s.adEditId
          ? { ...a, campaignKey: c.key, campaign: c.campaign, advertiser: c.advertiser, icon: c.icon, days: d.days, daysLeft: d.days, live: true }
          : a),
      }));
      store.flash(`${st.adEditId} updated · ${c.advertiser} for ${d.days} days.`);
    },

    q: st.q, onQuery: (v: string) => store.setState({ q: v }),
    regIsLost: sc === 'lost', regIsFound: sc === 'found',
    filters: (admin ? ['All', 'Active', 'Resolved', 'Reunited', 'Flagged'] : ['All', 'My posts', 'Active', 'Reunited', 'Resolved'])
      .map((f) => ({ name: f, on: st.filter === f, pick: () => store.setState({ filter: f }) })),
    registry: registry.map((i, ix) => ({
      ...i, open: openItem(i),
      adAfter: !admin && ix === 3 && registry.length > 4 && store.slotFor('Registry', fresh, st).live,
    })),
    myPostsEmpty: st.filter === 'My posts' && registry.length === 0,
    registryEmpty: registry.length === 0 && st.filter !== 'My posts',

    topics: ['All', 'Sighting', 'Reunited', 'Question'].map((name) => ({
      name, on: st.topic === name, pick: () => store.setState({ topic: name }),
    })),
    canPost: !admin,
    threadsEmpty: visibleThreads.length === 0,
    threads: visibleThreads.map((x) => ({
      ...x, isAdmin: admin, suspended: x.status === 'suspended',
      replyLabel: `${x.replies.length} ${x.replies.length === 1 ? 'reply' : 'replies'}`,
      open: () => { store.setState({ sheet: 'thread', activeThread: x.id, replyDraft: '' }); store.scrollChat(); },
      helpful: () => store.flash('Marked helpful. Thanks for confirming.'),
      suspendLabel: x.status === 'suspended' ? 'Restore post' : 'Suspend post',
      suspend: () => {
        store.setState((s) => ({ threads: s.threads.map((v) => v.id === x.id ? { ...v, status: v.status === 'suspended' ? 'live' : 'suspended' } : v) }));
        store.flash(x.status === 'suspended' ? 'Post restored to the forum.' : 'Post suspended — hidden from members.');
      },
      remove: () => {
        store.setState((s) => ({ threads: s.threads.filter((v) => v.id !== x.id) }));
        store.flash('Post permanently deleted by Super Admin.');
      },
    })),

    sheetThread: sh === 'thread',
    // Mirrors the prototype: an absent thread still yields an empty replies array.
    thread: thread
      ? { ...thread, replyLabel: `${thread.replies.length} ${thread.replies.length === 1 ? 'reply' : 'replies'}`, suspendLabel: thread.status === 'suspended' ? 'Restore post' : 'Suspend post' }
      : { replies: [] as Thread['replies'] },
    hasThread: !!thread,
    threadReplies: thread ? thread.replies : [],
    noReplies: !!thread && thread.replies.length === 0,
    replyDraft: st.replyDraft,
    onReplyDraft: (v: string) => store.setState({ replyDraft: v }),
    sendReply: () => store.postReply(),
    // The prototype leaves the sheet open here; closing it matches how delete
    // behaves and avoids the sheet showing a now-stale action label.
    suspendThread: () => {
      const id = st.activeThread;
      store.setState((s) => ({
        threads: s.threads.map((v) => v.id === id ? { ...v, status: v.status === 'suspended' ? 'live' : 'suspended' } : v),
        sheet: null,
      }));
      store.flash(thread && thread.status === 'suspended' ? 'Post restored to the forum.' : 'Post suspended — hidden from members.');
    },
    deleteThread: () => {
      const id = st.activeThread;
      store.setState((s) => ({ threads: s.threads.filter((v) => v.id !== id), sheet: null }));
      store.flash('Post permanently deleted by Super Admin.');
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
    publishThread: () => {
      if (!st.ntTitle.trim() || !st.ntBody.trim()) return;
      const t2 = {
        id: Date.now(), user: store.me().name, ini: store.me().ini, mine: true,
        meta: `${store.stamp()} · You`, tag: st.ntTag, status: 'live',
        title: st.ntTitle.trim(), text: st.ntBody.trim(), replies: [],
      };
      store.setState((s) => ({ threads: [t2, ...s.threads], sheet: null, ntTitle: '', ntBody: '' }));
      store.flash('Posted to the forum.');
    },

    uq: st.uq, onUserQuery: (v: string) => store.setState({ uq: v }),
    membersEmpty: memberList.length === 0,
    members: memberList.map((m) => ({
      ini: m.ini, name: m.name, meta: `@${m.handle} · ${m.posts} posts · joined ${m.joined}`,
      status: m.suspended ? 'Suspended' : 'Active', chipKey: m.suspended ? 'Flagged' : 'Active',
      toggleLabel: m.suspended ? 'Restore' : 'Suspend',
      toggle: () => {
        store.setState((s) => ({ members: s.members.map((x) => x.id === m.id ? { ...x, suspended: !x.suspended } : x) }));
        store.flash(m.suspended ? `${m.name} restored.` : `${m.name} suspended by Super Admin.`);
      },
      remove: () => {
        store.setState((s) => ({ members: s.members.filter((x) => x.id !== m.id) }));
        store.flash(`${m.name} was permanently deleted by Super Admin.`);
      },
    })),

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
    acceptGuidelines: () => store.setState({ sheet: null, suTerms: true, suError: '' }),
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
    sheetOpen: !!sh,

    detail: sel,
    detailRows: ([{ k: 'Status', v: sel.status }, { k: 'Where', v: sel.location }] as { k: string; v: string }[])
      .concat(sel.coords ? [{ k: 'Map pin', v: sel.coords }] : [])
      .concat([{ k: 'When', v: sel.date }, { k: 'Submitted by', v: sel.by }]),
    canClaim: !admin && sel.by !== ME,
    isOwner: !admin && sel.by === ME,
    ownerHint: sel.status === 'Reunited'
      ? 'Handed over. Members can still read the record but it no longer shows as open.'
      : 'When you hand the item to its owner, update the status here so the community stops searching.',
    handoverLabel: sel.status === 'Reunited' ? 'Reopen this post' : 'Mark as handed over',
    ownerStatuses: ['Active', 'Reunited', 'Resolved'].map((name) => ({
      name, on: sel.status === name, pick: () => store.setStatus(sel.id, name),
    })),
    withdrawPost: () => {
      store.setState((s) => ({ lost: s.lost.filter((i) => i.id !== sel.id), found: s.found.filter((i) => i.id !== sel.id), sheet: null }));
      store.flash(`${sel.id} withdrawn from the registry.`);
    },
    toggleHandover: () => store.setStatus(sel.id, sel.status === 'Reunited' ? 'Active' : 'Reunited'),
    claim: () => {
      store.setState((s) => {
        const exists = s.convos.find((c) => c.itemId === sel.id);
        const convos = exists
          ? s.convos.map((c) => c.itemId === sel.id ? { ...c, unread: 0 } : c)
          : [{ itemId: sel.id, with: sel.by, item: sel.title, icon: sel.icon, unread: 0, time: store.stamp(), msgs: CHAT_SEED }, ...s.convos];
        return { claimed: { ...s.claimed, [sel.id]: true }, convos, activeConvo: sel.id, sheet: 'chat' as const, draft: '' };
      });
      store.scrollChat();
      store.flash('Claim opened. You can talk to ' + sel.by + ' directly.');
    },
    claimLabel: st.claimed[sel.id] ? 'Open chat with finder' : (sel.kind === 'Found' ? 'This is mine' : 'I have found this'),

    isMessages: sc === 'messages',
    unreadTotal: unread, hasUnread: unread > 0,
    openMessages: () => store.setState({ screen: 'messages', sheet: null, toast: '' }),
    conversations: st.convos.map((c) => {
      const last = c.msgs[c.msgs.length - 1] || ({} as { from?: string; text?: string });
      return {
        itemId: c.itemId, item: c.item, icon: c.icon, with: c.with, time: c.time,
        ini: initials(c.with),
        preview: (last.from === 'me' ? 'You: ' : '') + (last.text || ''),
        unread: c.unread, hasUnread: c.unread > 0,
        open: () => {
          store.setState((s) => ({ sheet: 'chat', activeConvo: c.itemId, draft: '', convos: s.convos.map((x) => x.itemId === c.itemId ? { ...x, unread: 0 } : x) }));
          store.scrollChat();
        },
      };
    }),
    noConversations: st.convos.length === 0,

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
    ].map((r) => ({ ...r, send: () => store.pushMsg(r.text) })),
    draft: st.draft,
    onDraft: (v: string) => store.setState({ draft: v }),
    sendMessage: () => store.pushMsg(st.draft),
    addPhoto: () => store.flash('Photo picker opens here.'),
    flagRecord: () => store.flash(`${sel.id} sent to the moderation queue.`),
    deleteRecord: () => {
      store.setState((s) => ({ lost: s.lost.filter((i) => i.id !== sel.id), found: s.found.filter((i) => i.id !== sel.id), removed: s.removed + 1, sheet: null }));
      store.flash(`${sel.id} was permanently deleted by Super Admin.`);
    },

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
    reportBtnEnabled: st.step === 1 ? !!(st.rTitle.trim() && st.rCat) : !!st.rPlace.trim(),
    reportNext: () => {
      if (st.step === 1) { if (st.rTitle.trim() && st.rCat) store.setState({ step: 2 }); return; }
      if (!st.rPlace.trim()) return;
      const lost = st.rType === 'Lost';
      const id = `${lost ? 'LOST' : 'FOUND'}-${lost ? 1032 : 2019}`;
      const rec: Item = {
        id, title: st.rTitle, location: st.rPlace, date: st.rDate || 'Today', status: 'Active',
        kind: st.rType as Item['kind'], icon: 'inventory_2', by: 'simple.user',
        desc: st.rDesc || 'No extra details were given.',
        coords: st.pin ? `${st.pin.lat}, ${st.pin.lng}` : null,
      };
      const clear = { sheet: 'sent' as const, newId: id, step: 1, rTitle: '', rCat: '', rPlace: '', rDate: '', rDesc: '', pin: null };
      store.setState((s) => lost ? { lost: [rec, ...s.lost], ...clear } : { found: [rec, ...s.found], ...clear });
    },
    newId: st.newId,
    goRegistryFromSent: () => store.setState({ screen: st.newId.startsWith('LOST') ? 'lost' : 'found', sheet: null, filter: 'All', q: '' }),

    hasPin: !!st.pin, noPin: !st.pin, pin: st.pin,
    pinLabel: st.pin ? `pin set · ${st.pin.lat}, ${st.pin.lng}` : 'no pin set',
    onMapTap: (xPct: number, yPct: number) => {
      const x = Math.max(4, Math.min(96, xPct));
      const y = Math.max(6, Math.min(94, yPct));
      store.setState({ pin: { x, y, lat: (40.7128 + (50 - y) / 900).toFixed(4), lng: (-73.9960 + (x - 50) / 900).toFixed(4) } });
    },
    clearPin: () => store.setState({ pin: null }),
    useMyLocation: () => store.setState((s) => ({ pin: { x: 50, y: 48, lat: '40.7139', lng: '-73.9960' }, rPlace: s.rPlace || 'Union Square, current location' })),

    meName: store.me().name,
    meEmail: admin ? 'admin@lostitems.community' : fresh ? 'newuser@lostitems.community' : 'user@lostitems.community',
    settings: fresh
      ? [{ label: 'Member since', value: 'Today' }, { label: 'Reports posted', value: String(myPosts.length) }, { label: 'Notifications', value: 'On' }, { label: 'Guidelines accepted', value: st.suTerms ? 'Yes' : 'Not yet' }]
      : admin
      ? [{ label: 'Role', value: 'Super admin' }, { label: 'Moderation alerts', value: 'On' }, { label: 'Records reviewed', value: String(st.approved + st.removed) }, { label: 'Audit log', value: 'View' }]
      : [{ label: 'Notifications', value: 'On' }, { label: 'City', value: 'Central' }, { label: 'Contact sharing', value: 'After match' }, { label: 'Language', value: 'English' }],
    toastSupport: () => { store.setState({ sheet: 'support', supportDraft: '' }); store.scrollChat(); },
    sheetSupport: sh === 'support',
    supportMessages: st.supportMsgs.map((m) => ({ text: m.text, time: m.time, mine: m.from === 'me' })),
    botTyping: st.botTyping,
    faqChips: FAQ.map((f) => ({ q: f.q, ask: () => store.askBot(f.q) })),
    supportDraft: st.supportDraft,
    onSupportDraft: (v: string) => store.setState({ supportDraft: v }),
    sendSupport: () => store.askBot(st.supportDraft),
    escalate: () => { store.setState({ sheet: null }); store.flash("Handed to the support team — they'll reply in your inbox."); },
    logout: () => {
      if (isSupabaseAuth) store.signOutSupabase();
      store.setState({
        screen: 'login', role: null, username: '', password: '', sheet: null, toast: '',
        convos: CONVOS, activeConvo: null, draft: '',
        suUser: '', suEmail: '', suPass: '', suConfirm: '', suTerms: false, suError: '', suInfo: '',
        fpStage: 'email', fpEmail: '', fpCode: '', fpPass: '', fpConfirm: '', fpError: '', fpBusy: false, fpInfo: '',
      });
    },

    bars: bars.map(([label, v]) => ({ label, value: v, height: Math.round(v / 18 * 96), on: v === 18 })),
    keywords: [{ word: 'payment upfront', hits: '7 hits' }, { word: 'send deposit', hits: '4 hits' }, { word: 'meet alone', hits: '2 hits' }],
  };
}

export type Vals = ReturnType<typeof buildVals>;
