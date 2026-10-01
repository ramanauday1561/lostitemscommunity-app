import type { RefObject } from 'react';
import type { ScrollView } from 'react-native';
import {
  ADS, CHAT_SEED, CONVOS, FAQ, FLAGGED, FOUND, LOST, MEMBERS, SLIDES, SUPPORT_SEED, THREADS,
  type Ad, type ChatMsg, type Convo, type FlaggedRecord, type Item, type Member, type Status, type Thread,
} from '../data/constants';
import { initials } from '../theme/tokens';
// Type-only import: the real module (which pulls in react-native-url-polyfill
// and other RN-only code) is loaded lazily inside each method below via
// dynamic import(), so requiring store.ts outside Expo/Metro -- as the
// Node-based prototype-parity oracle in tools/oracle/ does -- doesn't try to
// transform React Native internals through plain esbuild.
import type * as AuthApi from '../api/auth';
import type { MyDashboardStats, AdminDashboardStats } from '../api/dashboard';
import type { ModerationFlag } from '../api/moderation';
import type { MemberProfile } from '../api/members';
import type { WeeklyReportCount, ModerationKeyword } from '../api/analysis';
import type { AdPlacementWithStatus, AdCampaign } from '../api/ads';
import type { FaqEntry, SupportInboxItem, SupportMessage } from '../api/support';
import type { IncomingMessage, IncomingNotification } from '../api/realtime';
import type { AppNotification } from '../api/notifications';

export type Role = 'admin' | 'user' | 'new' | null;
/** 'demo' is the existing mock-data flow, unchanged; 'supabase' hits the real backend.
 *  Temporary scaffolding for Phase 1 testing -- see backend/INTEGRATION_CHECKLIST.md. */
export type AuthMode = 'demo' | 'supabase';
export type Sheet =
  | 'detail' | 'report' | 'sent' | 'profile' | 'chat' | 'thread'
  | 'newthread' | 'support' | 'guidelines' | 'ad' | 'notifications' | 'supportReply' | null;

export interface Pin { x: number; y: number; lat: string; lng: string }

/** Mirrors `state` in the prototype's Component class (line 1404). */
/** Lists that load from Supabase. Demo mode never touches these (they stay 'idle'). */
export type LoadKey = 'registry' | 'forum' | 'conversations' | 'moderation' | 'members' | 'analysis' | 'ads' | 'notifications' | 'support';
export type LoadState = 'idle' | 'loading' | 'ready' | 'error';
export const IDLE_LOADS: Record<LoadKey, LoadState> = {
  registry: 'idle', forum: 'idle', conversations: 'idle', moderation: 'idle', members: 'idle', analysis: 'idle', ads: 'idle', notifications: 'idle', support: 'idle',
};

export interface AppState {
  screen: string; slide: number; convos: Convo[]; activeConvo: string | null;
  draft: string; role: Role;
  supportMsgs: ChatMsg[]; supportDraft: string; botTyping: boolean;
  threads: Thread[]; activeThread: string | number | null; replyDraft: string;
  ntTitle: string; ntBody: string; ntTag: string;
  username: string; password: string; remember: boolean; error: string; busy: boolean;
  authMode: AuthMode;
  /** Only populated in Supabase mode -- null in demo mode / before login. */
  profile: AuthApi.Profile | null;
  /** auth.users email of the signed-in Supabase account (not on profiles). */
  authEmail: string | null;
  /** True while the user arrived via a password-reset link and is choosing a new password. */
  fpRecovery: boolean;
  /** Actions with a request in flight (keyed by name), so their buttons can show the loader and ignore repeat taps. */
  pending: Record<string, boolean>;
  /** Per-list loading state: drives the spinner / error+retry / empty states (see LoadGate). */
  loads: Record<LoadKey, LoadState>;
  /** Bell / notifications sheet (Supabase mode only). Newest first. */
  notifications: AppNotification[];
  myDashStats: MyDashboardStats | null;
  dbThreads: any[] | null;
  dbReplies: any[] | null;
  forumTag: string;
  adminDashStats: AdminDashboardStats | null;
  /** Real registry results (Supabase mode only), refetched by the Registry screen
   *  when screen/filter/q change -- see src/screens/Registry.tsx. */
  dbItems: Item[] | null;
  /** Registry paging (3.4): more rows exist on the server / a next page is in flight. */
  registryHasMore: boolean; registryLoadingMore: boolean;
  suUser: string; suEmail: string; suPass: string; suConfirm: string;
  suTerms: boolean; suError: string; suInfo: string;
  fpStage: string; fpEmail: string; fpCode: string; fpPass: string;
  fpConfirm: string; fpError: string; fpBusy: boolean; fpInfo: string;
  sheet: Sheet;
  ads: Ad[]; adEditId: string; adDraft: { campaignKey: string; days: number } | null;
  flagged: FlaggedRecord[]; approved: number; removed: number;
  lost: Item[]; found: Item[]; members: Member[];
  q: string; uq: string; filter: string; topic: string; sel: string | null;
  claimed: Record<string, boolean>; toast: string; newId: string;
  step: number; rType: string; rTitle: string; rCat: string;
  rPlace: string; rDate: string; rDesc: string; pin: Pin | null;
  /** Supabase mode only: a photo picked in the Report sheet, held in memory and
   *  uploaded once the item itself is created -- see Store#pickPhotoSupabase. */
  rPhotoBlob: Blob | null; rPhotoName: string;
  /** Supabase mode only: moderation queue (pending flags). Real data replaces
   *  the mock flagged array in Admin > Moderation screen. */
  dbModerationQueue: ModerationFlag[] | null;
  /** Supabase mode only: count of moderation flags by status (pending, approved, removed). */
  dbModerationStats: { pending: number; approved: number; removed: number } | null;
  /** Supabase mode only: list of all members for admin management (Phase 8). */
  dbMembers: MemberProfile[] | null;
  /** Search query for members list (Phase 8). */
  memberSearchQuery: string;
  /** Supabase mode only: weekly report counts for analysis dashboard (Phase 9). */
  dbWeeklyReports: WeeklyReportCount[] | null;
  /** Supabase mode only: moderation keyword hits for analysis dashboard (Phase 9). */
  dbKeywords: ModerationKeyword[] | null;
  /** Supabase mode only: ad placements with status for admin ads screen (Phase 10). */
  dbAdPlacements: AdPlacementWithStatus[] | null;
  /** Supabase mode only: available ad campaigns for editor (Phase 10). */
  dbAdCampaigns: AdCampaign[] | null;
  /** Supabase mode only: FAQ entries for support bot (Phase 11). */
  dbFaqEntries: FaqEntry[] | null;
  /** Supabase mode only: support messages for current user (Phase 11). */
  dbSupportMessages: SupportMessage[] | null;
  /** Superadmin, Supabase mode: open "talk to a human" requests with their threads (11.3). */
  dbSupportInbox: SupportInboxItem[] | null;
  /** The member whose thread the reply sheet is showing, and the reply being typed. */
  activeSupportUser: string | null;
  supportReplyDraft: string;
}

export const initialState: AppState = {
  screen: 'welcome', slide: 0, convos: CONVOS, activeConvo: null, draft: '', role: null,
  supportMsgs: SUPPORT_SEED, supportDraft: '', botTyping: false,
  threads: THREADS, activeThread: null, replyDraft: '', ntTitle: '', ntBody: '', ntTag: 'Question',
  username: '', password: '', remember: true, error: '', busy: false,
  authMode: 'demo',
  profile: null, authEmail: null, fpRecovery: false, pending: {}, loads: IDLE_LOADS, notifications: [], myDashStats: null, adminDashStats: null, dbItems: null, registryHasMore: false, registryLoadingMore: false,
  dbThreads: null, dbReplies: null, forumTag: '',
  dbWeeklyReports: null, dbKeywords: null, dbAdPlacements: null, dbAdCampaigns: null,
  dbFaqEntries: null, dbSupportMessages: null, dbSupportInbox: null, activeSupportUser: null, supportReplyDraft: '',
  suUser: '', suEmail: '', suPass: '', suConfirm: '', suTerms: false, suError: '', suInfo: '',
  fpStage: 'email', fpEmail: '', fpCode: '', fpPass: '', fpConfirm: '', fpError: '', fpBusy: false, fpInfo: '',
  sheet: null,
  ads: ADS, adEditId: 'AD-01', adDraft: null,
  flagged: FLAGGED, approved: 0, removed: 0, lost: LOST, found: FOUND, members: MEMBERS,
  q: '', uq: '', filter: 'All', topic: 'All', sel: null, claimed: {}, toast: '', newId: '',
  step: 1, rType: 'Lost', rTitle: '', rCat: '', rPlace: '', rDate: '', rDesc: '', pin: null,
  rPhotoBlob: null, rPhotoName: '',
  dbModerationQueue: null, dbModerationStats: null,
  dbMembers: null, memberSearchQuery: '',
};

type Patch = Partial<AppState> | ((s: AppState) => Partial<AppState>);

/**
 * Port of the prototype's Component class. Behaviour, timings and messages are
 * kept identical -- see the corresponding methods at lines 1418-1538.
 */
export class Store {
  state: AppState = initialState;
  chatRef: RefObject<ScrollView | null> | null = null;

  private listeners = new Set<() => void>();
  private tToast: ReturnType<typeof setTimeout> | undefined;
  private tReply: ReturnType<typeof setTimeout> | undefined;
  private tBot: ReturnType<typeof setTimeout> | undefined;

  subscribe = (l: () => void) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };
  getState = () => this.state;
  private emit() { this.listeners.forEach((l) => l()); }

  setState = (patch: Patch, cb?: () => void) => {
    const next = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = { ...this.state, ...next };
    this.emit();
    cb?.();
  };

  /** Toast auto-dismisses after 2400ms, as in the prototype. */
  /** Runs `fn` with `pending[key]` set for its duration; a second call while the first is running is ignored. */
  withPending = async <T,>(key: string, fn: () => Promise<T> | T): Promise<T | undefined> => {
    if (this.state.pending[key]) return undefined;
    this.setState((s) => ({ pending: { ...s.pending, [key]: true } }));
    try {
      return await fn();
    } finally {
      this.setState((s) => ({ pending: { ...s.pending, [key]: false } }));
    }
  };

  flash(msg: string) {
    clearTimeout(this.tToast);
    this.setState({ toast: msg });
    this.tToast = setTimeout(() => this.setState({ toast: '' }), 2400);
  }

  stamp() {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  }

  /** Replaces the prototype's document.querySelector('[data-chat-scroll]'). */
  scrollChat() {
    [0, 60, 220, 450].forEach((d) =>
      setTimeout(() => this.chatRef?.current?.scrollToEnd({ animated: d > 0 }), d));
  }

  me() {
    const p = this.state.authMode === 'supabase' ? this.state.profile : null;
    if (p) return { name: p.display_name, ini: initials(p.display_name), handle: p.handle };
    const r = this.state.role;
    if (r === 'admin') return { name: 'Super Admin', ini: 'SA', handle: 'superadmin' };
    if (r === 'new') return { name: 'Nadia Iqbal', ini: 'NI', handle: 'newuser' };
    return { name: 'Simple User', ini: 'SU', handle: 'user' };
  }

  roleState(username: string): Partial<AppState> {
    if (username === 'superadmin') return { role: 'admin' };
    if (username === 'newuser') return {
      role: 'new', filter: 'All', suTerms: false,
      activeConvo: null, threads: THREADS,
      lost: LOST.filter((i) => i.by !== 'simple.user'),
      found: FOUND.filter((i) => i.by !== 'simple.user'),
    };
    return { role: 'user', threads: THREADS, lost: LOST, found: FOUND, filter: 'All' };
  }

  /** The finder replies automatically after 1600ms. */
  pushMsg(text: string) {
    const t = (text || '').trim();
    if (!t) return;
    const id = this.state.activeConvo;
    const time = this.stamp();
    this.setState((s) => ({
      draft: '',
      convos: s.convos.map((c) => (c.id === id || c.itemId === id) ? { ...c, time, msgs: [...c.msgs, { from: 'me', text: t, time }] } : c),
    }));
    this.scrollChat();
    clearTimeout(this.tReply);
    this.tReply = setTimeout(() => {
      const reply = "Works for me. I'll bring it in the original box — see you there.";
      const s = this.state;
      const open = s.sheet === 'chat' && s.activeConvo === id;
      const c = s.convos.find((x) => x.id === id || x.itemId === id);
      const now = this.stamp();
      this.setState({
        convos: s.convos.map((x) => (x.id === id || x.itemId === id)
          ? { ...x, time: now, unread: open ? 0 : (x.unread || 0) + 1, msgs: [...x.msgs, { from: 'them', text: reply, time: now }] }
          : x),
      });
      if (open) this.scrollChat();
      else if (c) this.flash(`New message from ${c.with}`);
    }, 1600);
  }

  postReply() {
    const t2 = (this.state.replyDraft || '').trim();
    if (!t2) return;
    const id = this.state.activeThread;
    const time = this.stamp();
    this.setState((s) => ({
      replyDraft: '',
      threads: s.threads.map((v) => v.id === id
        ? { ...v, replies: [...v.replies, { user: this.me().name, ini: this.me().ini, time, text: t2 }] }
        : v),
    }));
    this.scrollChat();
  }

  /** Bot answers from FAQ keyword matching after 900ms. */
  askBot(text: string) {
    const t = (text || '').trim();
    // One question at a time: a second tap while the assistant is still answering would send the question twice.
    if (!t || this.state.botTyping) return;
    if (this.state.authMode === 'supabase') { this.askBotSupabase(t); return; }
    const time = this.stamp();
    this.setState((s) => ({
      supportMsgs: [...s.supportMsgs, { from: 'me', text: t, time }], supportDraft: '', botTyping: true,
    }));
    this.scrollChat();
    const low = t.toLowerCase();
    const hit = FAQ.find((f) => f.q.toLowerCase() === low) || FAQ.find((f) => f.keys.some((k) => low.includes(k)));
    const answer = hit ? hit.a
      : 'I\'m not sure about that one yet. Tap "Talk to a human instead" and our support team will pick it up — they usually reply within minutes.';
    clearTimeout(this.tBot);
    this.tBot = setTimeout(() => {
      this.setState((s) => ({
        supportMsgs: [...s.supportMsgs, { from: 'bot', text: answer, time: this.stamp() }], botTyping: false,
      }));
      this.scrollChat();
    }, 900);
  }

  signIn = () => {
    const u = this.state.username.trim().toLowerCase();
    if (!u || !this.state.password) { this.setState({ error: 'Username and password are required.' }); return; }
    this.setState({ busy: true, error: '' });
    setTimeout(() => {
      if (u === 'superadmin' && this.state.password !== 'Password1!') {
        this.setState({ busy: false, error: 'Invalid password for superadmin. Hint: Password1!' });
        return;
      }
      this.setState({
        busy: false, screen: 'dash',
        ...this.roleState(u === 'superadmin' ? 'superadmin' : (u === 'newuser' || u === 'new') ? 'newuser' : 'user'),
      });
    }, 600);
  };

  quick = (username: string) => {
    this.setState({ username, password: 'Password1!', error: '', busy: true });
    setTimeout(() => this.setState({ busy: false, screen: 'dash', ...this.roleState(username) }), 550);
  };

  setAuthMode = (mode: AuthMode) => this.setState({ authMode: mode, error: '', username: '', password: '' });

  /** role/fresh derived from the real profile row, not a hardcoded username switch. */
  private roleFromProfile(p: AuthApi.Profile): Partial<AppState> {
    const role: Role = p.role === 'superadmin' ? 'admin'
      : (p.post_count === 0 && !p.guidelines_accepted_at) ? 'new' : 'user';
    return { role, suTerms: !!p.guidelines_accepted_at, profile: p };
  }

  /** Support bot in Supabase mode (11.1/11.2): the question and the bot's answer are stored in
   *  `support_messages`, and the answer comes from the real `faq_entries`. Same 900 ms typing beat as the prototype. */
  private askBotSupabase = async (text: string) => {
    const s = this.state;
    if (!s.profile) return;
    const userId = s.profile.id;
    this.setState({ supportDraft: '', botTyping: true });
    try {
      const api = await import('../api/support');
      await api.sendSupportMessage(userId, text, 'user');
      await this.loadSupportMessagesSupabase();
      this.scrollChat();
      const answer = api.matchFaq(this.state.dbFaqEntries ?? [], text)?.answer ?? api.FAQ_FALLBACK;
      await new Promise((r) => { this.tBot = setTimeout(r, 900); });
      await api.sendSupportMessage(userId, answer, 'bot');
      await this.loadSupportMessagesSupabase();
    } catch (e) {
      console.error('support bot failed:', e);
      // A rate-limit rejection (migration 0025) carries a message worth showing; anything else stays generic.
      this.flash(e instanceof Error && /too often/i.test(e.message) ? e.message : "Couldn't send that. Please try again.");
      this.setState({ supportDraft: text });
    } finally {
      this.setState({ botTyping: false });
      this.scrollChat();
    }
  };

  /** Fetches the dashboard stat tiles for whichever role just signed in. Fire-and-forget:
   *  the dashboard renders zeros until this resolves, same as a fresh/new account would show. */
  loadDashboardStats = async (p: AuthApi.Profile) => {
    // Also the one async hook all three auth entry points share: fetch the account email for the Profile sheet.
    import('../api/auth').then((a) => a.getMyEmail()).then((authEmail) => this.setState({ authEmail })).catch(() => {});
    const dashboard = await import('../api/dashboard');
    if (p.role === 'superadmin') {
      const adminDashStats = await dashboard.getAdminDashboardStats();
      this.setState({ adminDashStats });
    } else {
      const myDashStats = await dashboard.getMyDashboardStats(p.id);
      this.setState({ myDashStats });
    }
  };

  /** Runs a list loader and records loading -> ready | error for `key`, so screens can show a
   *  spinner, an error with retry, or the genuine empty state instead of an ambiguous blank list. */
  private track = async (key: LoadKey, fn: () => Promise<void>, isCurrent: () => boolean = () => true) => {
    this.setState((s) => ({ loads: { ...s.loads, [key]: 'loading' } }));
    try {
      await fn();
      if (isCurrent()) this.setState((s) => ({ loads: { ...s.loads, [key]: 'ready' } }));
    } catch (e) {
      console.error(`${key} failed to load:`, e);
      if (isCurrent()) this.setState((s) => ({ loads: { ...s.loads, [key]: 'error' } }));
    }
  };

  /** Refetches the registry for the current screen/filter/search. No-ops outside
   *  Supabase mode or off the lost/found screens; called from a useEffect in
   *  Registry.tsx rather than from every place filter/q/screen can change. */
  loadRegistry = async () => {
    const st = this.state;
    if (st.authMode !== 'supabase') return;
    const kind = st.screen === 'lost' ? 'lost' : st.screen === 'found' ? 'found' : null;
    if (!kind) return;
    // Only the newest query may write: typing fast or switching filters can return responses out of order.
    const req = ++this.registryReq;
    await this.track('registry', async () => {
      const items = await import('../api/items');
      const page = await items.listItems({
        kind, filter: st.filter, query: st.q, userId: st.profile?.id,
      });
      if (req !== this.registryReq) return;
      this.setState({ dbItems: page.items, registryHasMore: page.hasMore, registryLoadingMore: false });
    }, () => req === this.registryReq);
  };

  private registryReq = 0;

  /** Appends the next page (3.4). No-op unless the server said more exists and nothing is in flight. */
  loadMoreRegistry = async () => {
    const st = this.state;
    if (st.authMode !== 'supabase' || !st.registryHasMore || st.registryLoadingMore || st.loads.registry === 'loading') return;
    const kind = st.screen === 'lost' ? 'lost' : st.screen === 'found' ? 'found' : null;
    if (!kind) return;
    const req = this.registryReq;
    this.setState({ registryLoadingMore: true });
    try {
      const items = await import('../api/items');
      const page = await items.listItems({
        kind, filter: st.filter, query: st.q, userId: st.profile?.id, offset: (st.dbItems ?? []).length,
      });
      if (req !== this.registryReq) return; // filter/search changed meanwhile; the new load owns the list
      this.setState((s) => {
        const seen = new Set((s.dbItems ?? []).map((i) => i.id));
        return {
          dbItems: [...(s.dbItems ?? []), ...page.items.filter((i) => !seen.has(i.id))],
          registryHasMore: page.hasMore, registryLoadingMore: false,
        };
      });
    } catch (e) {
      console.error('loadMoreRegistry failed:', e);
      if (req === this.registryReq) this.setState({ registryLoadingMore: false });
      this.flash("Couldn't load more items. Try again.");
    }
  };

  /** Registry items keep their display_id (e.g. "LOST-1031") as `Item.id`, but
   *  update/delete/claim need the real uuid -- see the `dbId` field added to
   *  `Item` for Supabase-sourced rows. */
  private findDbItem(id: string | null): Item | undefined {
    if (!id) return undefined;
    return (this.state.dbItems ?? []).find((i) => i.id === id);
  }

  reportItemSupabase = async () => {
    const s = this.state;
    if (s.step === 1) {
      if (s.rTitle.trim() && s.rCat) this.setState({ step: 2 });
      return;
    }
    if (!s.rPlace.trim() || !s.profile) return;
    this.setState({ busy: true });
    try {
      const items = await import('../api/items');
      const created = await items.createItem({
        kind: s.rType === 'Lost' ? 'lost' : 'found',
        category: s.rCat,
        title: s.rTitle.trim(),
        locationText: s.rPlace.trim(),
        lat: s.pin ? Number(s.pin.lat) : null,
        lng: s.pin ? Number(s.pin.lng) : null,
        occurredOn: s.rDate.trim() || null,
        description: s.rDesc.trim() || null,
        reporterId: s.profile.id,
      });
      if (s.rPhotoBlob && created.dbId) {
        // A failed photo upload shouldn't undo an already-created report.
        await items.uploadItemPhoto(created.dbId, s.profile.id, s.rPhotoBlob, s.rPhotoName || 'photo.jpg').catch(() => {});
      }
      this.setState({
        busy: false, sheet: 'sent', newId: created.id, step: 1,
        rTitle: '', rCat: '', rPlace: '', rDate: '', rDesc: '', pin: null,
        rPhotoBlob: null, rPhotoName: '',
      });
    } catch (e) {
      this.setState({ busy: false });
      this.flash(e instanceof Error ? e.message : 'Could not submit the report.');
    }
  };

  /** Opens the OS photo picker (works on native and web -- expo-image-picker
   *  drives a hidden <input type=file> on web) and holds the result in memory;
   *  it's uploaded once the item itself exists, from reportItemSupabase. */
  pickPhotoSupabase = async () => {
    try {
      const [ImagePicker, RN] = await Promise.all([import('expo-image-picker'), import('react-native')]);
      if (RN.Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { this.flash('Photo library permission was denied.'); return; }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      this.setState({ rPhotoBlob: blob, rPhotoName: asset.fileName || `photo-${Date.now()}.jpg` });
      this.flash('Photo attached — it uploads when you submit.');
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not open the photo picker.');
    }
  };

  claimItemSupabase = async () => {
    const s = this.state;
    const it = this.findDbItem(s.sel);
    if (!it?.dbId || !it.reporterId || !s.profile) return;
    try {
      const items = await import('../api/items');
      await items.claimItem(it.dbId, it.reporterId, s.profile.id);
      this.setState((st) => ({ claimed: { ...st.claimed, [it.id]: true }, sheet: null }));
      this.flash(`Claim sent. ${it.by} can see it in their conversations.`);
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not send the claim.');
    }
  };

  withdrawItemSupabase = async () => {
    const it = this.findDbItem(this.state.sel);
    if (!it?.dbId) return;
    try {
      const items = await import('../api/items');
      await items.deleteItem(it.dbId);
      this.setState((s) => ({ sheet: null, dbItems: (s.dbItems ?? []).filter((x) => x.id !== it.id) }));
      this.flash(`${it.id} withdrawn from the registry.`);
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not withdraw this post.');
    }
  };

  setItemStatusSupabase = async (status: Status) => {
    const it = this.findDbItem(this.state.sel);
    if (!it?.dbId) return;
    try {
      const items = await import('../api/items');
      await items.updateItemStatus(it.dbId, status);
      this.setState((s) => ({ dbItems: (s.dbItems ?? []).map((x) => (x.id === it.id ? { ...x, status } : x)) }));
      this.flash(status === 'Reunited' ? `${it.id} marked as handed over.`
        : status === 'Resolved' ? `${it.id} closed.` : `${it.id} is active again.`);
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not update status.');
    }
  };

  /** Admin-only, see Detail.tsx's `v.isAdmin` gate. */
  flagItemSupabase = async () => {
    const s = this.state;
    const it = this.findDbItem(s.sel);
    if (!it?.dbId || !s.profile) return;
    try {
      const items = await import('../api/items');
      const result = await items.flagItem(it.dbId, 'Flagged by a superadmin from the item detail sheet.', s.profile.id);
      this.setState((st) => ({
        sheet: null,
        dbItems: (st.dbItems ?? []).map((x) => (x.id === it.id ? { ...x, status: 'Flagged' as Status } : x)),
      }));
      this.flash(result === 'already_queued' ? `${it.id} is already in the moderation queue.` : `${it.id} sent to the moderation queue.`);
      this.loadModerationQueueSupabase();
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not flag this item.');
    }
  };

  /** Admin-only hard delete, see Detail.tsx's `v.isAdmin` gate. */
  deleteItemSupabase = async () => {
    const it = this.findDbItem(this.state.sel);
    if (!it?.dbId) return;
    try {
      const items = await import('../api/items');
      await items.deleteItem(it.dbId);
      this.setState((s) => ({ sheet: null, removed: s.removed + 1, dbItems: (s.dbItems ?? []).filter((x) => x.id !== it.id) }));
      this.flash(`${it.id} was permanently deleted by Super Admin.`);
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not delete this record.');
    }
  };

  // ============= Phase 5: Chat (conversations, messages, realtime) =============

  loadConversationsSupabase = async () => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    const profile = s.profile;
    await this.track('conversations', async () => {
      const convApi = await import('../api/conversations');
      const convos = await convApi.loadConversations(profile.id);
      this.setState({ convos });
    });
  };

  loadMessagesSupabase = async (conversationId: string) => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    try {
      const convApi = await import('../api/conversations');
      const msgs = await convApi.loadMessages(conversationId, s.profile.id);
      // Update the active conversation's messages.
      this.setState((st) => ({
        convos: st.convos.map((c) => (c.id === conversationId ? { ...c, msgs } : c)),
      }));
      // Mark as read.
      await convApi.markConversationRead(conversationId, s.profile.id);
      this.setState((st) => ({
        convos: st.convos.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)),
      }));
    } catch (e) {
      console.error('loadMessages failed:', e);
    }
  };

  sendMessageSupabase = async () => {
    const s = this.state;
    const activeConvo = s.convos.find((c) => c.id === s.activeConvo);
    if (s.authMode !== 'supabase' || !s.profile || !activeConvo || !s.draft.trim()) return;
    const text = s.draft;
    this.setState({ draft: '' });
    try {
      const convApi = await import('../api/conversations');
      await convApi.sendMessage(activeConvo.id, s.profile.id, text);
      // Reload messages to sync with server.
      await this.loadMessagesSupabase(activeConvo.id);
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not send message.');
      this.setState({ draft: text });
    }
  };

  /** Live chat (5.3): called for every message row Realtime delivers to this user. */
  handleIncomingMessage = (m: IncomingMessage) => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    const convo = s.convos.find((c) => c.id === m.conversation_id);
    if (!convo) { this.loadConversationsSupabase(); return; } // a conversation we haven't loaded yet

    // The thread is open: reload it (also marks it read, and de-duplicates our own echo).
    if (s.sheet === 'chat' && s.activeConvo === m.conversation_id) {
      this.loadMessagesSupabase(m.conversation_id).then(() => this.scrollChat());
      return;
    }
    // Not open: only others' messages count as unread; our own (e.g. sent from another device) don't.
    if (m.sender_id === s.profile.id) return;
    this.setState((st) => ({
      convos: st.convos.map((c) => (c.id === m.conversation_id ? { ...c, unread: c.unread + 1, time: this.stamp() } : c)),
    }));
    this.flash(`New message from ${convo.with}`);
  };

  // ============= Phase 12.3: Notifications =============

  loadNotificationsSupabase = async () => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    const profile = s.profile;
    await this.track('notifications', async () => {
      const api = await import('../api/notifications');
      this.setState({ notifications: await api.loadNotifications(profile.id) });
    });
  };

  /** Realtime delivered a new notification row. Message notifications don't toast: the chat
   *  handler already does, and the unread chat badge covers them. */
  handleIncomingNotification = async (row: IncomingNotification) => {
    if (this.state.authMode !== 'supabase') return;
    const api = await import('../api/notifications');
    const n = api.toAppNotification(row);
    if (!this.state.notifications.some((x) => x.id === n.id)) this.setState({ notifications: [n, ...this.state.notifications] });
    if (n.type !== 'message') this.flash(n.title);
    // A staff reply: pull it into the thread so it is there if the support sheet is (or gets) opened.
    if (n.type === 'system') this.loadSupportMessagesSupabase();
  };

  openNotifications = () => {
    this.setState({ sheet: 'notifications' });
    this.loadNotificationsSupabase();
  };

  markAllNotificationsRead = async () => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile || !s.notifications.some((n) => !n.isRead)) return;
    const before = s.notifications;
    this.setState({ notifications: before.map((n) => ({ ...n, isRead: true })) });
    try {
      const api = await import('../api/notifications');
      await api.markAllNotificationsRead(s.profile.id);
    } catch (e) {
      this.setState({ notifications: before });
      this.flash(e instanceof Error ? e.message : 'Could not update notifications.');
    }
  };

  /** Marks one read, then opens what it's about when that's a conversation. */
  openNotification = async (id: string) => {
    const n = this.state.notifications.find((x) => x.id === id);
    if (!n) return;
    if (!n.isRead) {
      this.setState((st) => ({ notifications: st.notifications.map((x) => (x.id === id ? { ...x, isRead: true } : x)) }));
      import('../api/notifications').then((api) => api.markNotificationRead(id)).catch((e) => console.error('markRead failed:', e));
    }
    if (n.conversationId && this.state.convos.some((c) => c.id === n.conversationId)) this.openChatSupabase(n.conversationId);
    else if (n.type === 'system' && n.title === 'Support replied') { this.setState({ sheet: 'support', supportDraft: '' }); this.loadSupportMessagesSupabase(); this.scrollChat(); }
    else this.setState({ sheet: null });
  };

  private chatUnsubscribe: (() => void) | null = null;

  /** Opens the chat subscription for the signed-in user (idempotent). */
  startChatRealtime = async (userId: string) => {
    if (this.chatUnsubscribe) return;
    try {
      const rt = await import('../api/realtime');
      if (this.chatUnsubscribe) return; // a concurrent call won the race
      this.chatUnsubscribe = rt.subscribeToChat(userId, {
        onMessage: this.handleIncomingMessage,
        onConversation: () => this.loadConversationsSupabase(),
        onNotification: this.handleIncomingNotification,
      });
    } catch (e) {
      console.error('chat realtime failed to start:', e); // chat still works, just without live updates
    }
  };

  stopChatRealtime = () => {
    this.chatUnsubscribe?.();
    this.chatUnsubscribe = null;
  };

  openChatSupabase = (conversationId: string) => {
    this.setState({ sheet: 'chat', activeConvo: conversationId });
    // Load messages for this conversation.
    this.loadMessagesSupabase(conversationId).catch(console.error);
  };

  loadForumSupabase = async () => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    const profile = s.profile;
    await this.track('forum', async () => {
      const forumApi = await import('../api/forum');
      const threads = await forumApi.loadThreads(profile.id, s.forumTag || undefined);
      this.setState({ dbThreads: threads });
    });
  };

  loadRepliesSupabase = async (threadId: string) => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    try {
      const forumApi = await import('../api/forum');
      const replies = await forumApi.loadReplies(threadId, s.profile.id);
      this.setState({ dbReplies: replies });
    } catch (e) {
      console.error('loadReplies failed:', e);
    }
  };

  createThreadSupabase = async () => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile || !s.ntTitle.trim() || !s.ntBody.trim()) return;
    const tag = s.ntTag as 'Sighting' | 'Question' | 'Reunited';
    try {
      const forumApi = await import('../api/forum');
      await forumApi.createThread(s.profile.id, s.ntTitle, s.ntBody, tag);
      this.setState({ ntTitle: '', ntBody: '', ntTag: 'Question', sheet: null });
      this.flash('Posted to the forum.');
      this.loadForumSupabase();
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not create thread.');
    }
  };

  replyToThreadSupabase = async () => {
    const s = this.state;
    const activeThread = s.activeThread;
    if (s.authMode !== 'supabase' || !s.profile || !activeThread || !s.replyDraft.trim()) return;
    const threadId = String(activeThread);
    const text = s.replyDraft;
    this.setState({ replyDraft: '' });
    try {
      const forumApi = await import('../api/forum');
      await forumApi.replyToThread(threadId, s.profile.id, text);
      await this.loadRepliesSupabase(threadId);
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not reply.');
      this.setState({ replyDraft: text });
    }
  };

  toggleThreadHelpfulSupabase = async (threadId: string) => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    try {
      const forumApi = await import('../api/forum');
      await forumApi.toggleThreadHelpful(threadId, s.profile.id);
      await this.loadForumSupabase();
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not toggle vote.');
    }
  };


  setForumTag = (tag: string) => {
    this.setState({ forumTag: tag });
    this.loadForumSupabase();
  };

  suspendThreadSupabase = async (threadId: string) => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    try {
      const forumApi = await import('../api/forum');
      await forumApi.suspendThread(threadId);
      this.setState({ sheet: null });
      this.flash('Post suspended — hidden from members.');
      await this.loadForumSupabase();
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not suspend thread.');
    }
  };

  restoreThreadSupabase = async (threadId: string) => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    try {
      const forumApi = await import('../api/forum');
      await forumApi.restoreThread(threadId);
      this.setState({ sheet: null });
      this.flash('Post restored to the forum.');
      await this.loadForumSupabase();
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not restore thread.');
    }
  };

  deleteThreadSupabase = async (threadId: string) => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    try {
      const forumApi = await import('../api/forum');
      await forumApi.deleteThread(threadId);
      this.setState({ sheet: null });
      this.flash('Post permanently deleted by Super Admin.');
      await this.loadForumSupabase();
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not delete thread.');
    }
  };

  loadModerationQueueSupabase = async () => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    await this.track('moderation', async () => {
      const modApi = await import('../api/moderation');
      const queue = await modApi.loadModerationQueue();
      const stats = await modApi.loadModerationStats();
      this.setState({ dbModerationQueue: queue, dbModerationStats: stats });
    });
  };

  takeModActionSupabase = async (flagId: string, action: 'approve' | 'remove') => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    const flag = (s.dbModerationQueue ?? []).find((f) => f.id === flagId);
    const ref = flag?.target_ref || flag?.target_title || 'Item';
    try {
      const modApi = await import('../api/moderation');
      if (action === 'approve') {
        await modApi.approveFlag(flagId);
        this.flash(`${ref} approved and unflagged.`);
      } else {
        await modApi.removeFlag(flagId);
        this.flash(`${ref} was permanently deleted by Super Admin.`);
      }
      await this.loadModerationQueueSupabase();
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not process moderation action.');
    }
  };

  // Phase 8: Members Management
  loadMembersSupabase = async () => {
    if (this.state.authMode !== 'supabase') return;
    await this.track('members', async () => {
      const membersApi = await import('../api/members');
      const members = await membersApi.loadMembers();
      this.setState({ dbMembers: members });
    });
  };

  private memberSearchSeq = 0;
  private tMemberSearch: ReturnType<typeof setTimeout> | undefined;

  /** Typing in the members search box: waits for a pause, then asks the server (one request per word, not per key). */
  queueMemberSearch = (query: string) => {
    clearTimeout(this.tMemberSearch);
    this.tMemberSearch = setTimeout(() => this.searchMembersSupabase(query), 250);
  };

  searchMembersSupabase = async (query: string) => {
    if (this.state.authMode !== 'supabase') return;
    this.setState({ memberSearchQuery: query });
    const seq = ++this.memberSearchSeq;
    // A slower, older search must not overwrite the result of a newer one.
    await this.track('members', async () => {
      const membersApi = await import('../api/members');
      const members = await membersApi.searchMembers(query);
      if (seq === this.memberSearchSeq) this.setState({ dbMembers: members });
    }, () => seq === this.memberSearchSeq);
  };

  suspendMemberSupabase = async (memberId: string) => {
    if (this.state.authMode !== 'supabase') return;
    try {
      const membersApi = await import('../api/members');
      await membersApi.suspendMember(memberId);
      this.flash('Member suspended.');
      await this.searchMembersSupabase(this.state.memberSearchQuery);
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not suspend member.');
    }
  };

  restoreMemberSupabase = async (memberId: string) => {
    if (this.state.authMode !== 'supabase') return;
    try {
      const membersApi = await import('../api/members');
      await membersApi.restoreMember(memberId);
      this.flash('Member restored.');
      await this.searchMembersSupabase(this.state.memberSearchQuery);
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not restore member.');
    }
  };

  removeMemberSupabase = async (memberId: string) => {
    if (this.state.authMode !== 'supabase') return;
    try {
      const membersApi = await import('../api/members');
      await membersApi.removeMember(memberId);
      this.flash('Member removed.');
      await this.loadMembersSupabase();
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not remove member.');
    }
  };

  loadAnalysisSupabase = async () => {
    if (this.state.authMode !== 'supabase') return;
    await this.track('analysis', async () => {
      const analysisApi = await import('../api/analysis');
      const [reports, keywords] = await Promise.all([
        analysisApi.getWeeklyReportCounts(),
        analysisApi.getModerationKeywords(),
      ]);
      this.setState({ dbWeeklyReports: reports, dbKeywords: keywords });
    });
  };

  loadAdsSupabase = async () => {
    if (this.state.authMode !== 'supabase') return;
    await this.track('ads', async () => {
      const adsApi = await import('../api/ads');
      const [placements, campaigns] = await Promise.all([
        adsApi.getAdPlacements(),
        adsApi.getAdCampaigns(),
      ]);
      this.setState({ dbAdPlacements: placements, dbAdCampaigns: campaigns });
    });
  };

  // Phase 11: Support Chat & FAQ
  loadFaqSupabase = async () => {
    if (this.state.authMode !== 'supabase') return;
    try {
      const supportApi = await import('../api/support');
      const faqEntries = await supportApi.getFaqEntries();
      this.setState({ dbFaqEntries: faqEntries });
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not load FAQ data.');
    }
  };

  loadSupportMessagesSupabase = async () => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    try {
      const supportApi = await import('../api/support');
      const messages = await supportApi.loadSupportMessages(s.profile.id);
      this.setState({ dbSupportMessages: messages });
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not load support messages.');
    }
  };

  /** "Talk to a human instead": opens (or finds) the member's request and tells them so in the thread. */
  escalateSupabase = async () => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    const userId = s.profile.id;
    try {
      const api = await import('../api/support');
      const result = await api.openSupportRequest(userId);
      if (result === 'opened') await api.sendSupportMessage(userId, api.HANDOFF_NOTICE, 'bot');
      await this.loadSupportMessagesSupabase();
      this.scrollChat();
      this.flash(result === 'opened' ? 'Passed to our support team. You will be notified when they reply.' : 'Your request is already with our support team. You will be notified when they reply.');
    } catch (e) {
      console.error('escalate failed:', e);
      this.flash(e instanceof Error && /too often/i.test(e.message) ? e.message : "Couldn't reach the support team. Please try again.");
    }
  };

  // ============= Phase 11.3: support inbox (superadmin) =============

  loadSupportInboxSupabase = async () => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile || s.profile.role !== 'superadmin') return;
    await this.track('support', async () => {
      const api = await import('../api/support');
      this.setState({ dbSupportInbox: await api.loadSupportInbox() });
    });
  };

  openSupportReply = (userId: string) => {
    this.setState({ sheet: 'supportReply', activeSupportUser: userId, supportReplyDraft: '' });
    this.scrollChat();
  };

  sendSupportReply = async () => {
    const s = this.state;
    const text = s.supportReplyDraft.trim();
    if (s.authMode !== 'supabase' || !s.profile || !s.activeSupportUser || !text) return;
    const userId = s.activeSupportUser;
    this.setState({ supportReplyDraft: '' });
    try {
      const api = await import('../api/support');
      await api.replyToSupport(userId, text);
      await this.loadSupportInboxSupabase();
      this.scrollChat();
    } catch (e) {
      this.setState({ supportReplyDraft: text });
      this.flash(e instanceof Error ? e.message : "Couldn't send that reply.");
    }
  };

  resolveSupportRequest = async (requestId: string) => {
    const s = this.state;
    if (s.authMode !== 'supabase' || !s.profile) return;
    try {
      const api = await import('../api/support');
      await api.closeSupportRequest(requestId, s.profile.id);
      this.setState({ sheet: s.sheet === 'supportReply' ? null : s.sheet, activeSupportUser: null });
      await this.loadSupportInboxSupabase();
      this.flash('Request resolved.');
    } catch (e) {
      this.flash(e instanceof Error ? e.message : "Couldn't resolve that request.");
    }
  };

  /** Everything a signed-in session needs, shared by sign-in, sign-up and "returning with a stored session"
   *  so the three can't drift apart (restoring a session used to skip the FAQ, support thread, forum and admin lists). */
  private bootstrapSession = (profile: AuthApi.Profile) => {
    this.loadDashboardStats(profile);
    this.loadConversationsSupabase();
    this.startChatRealtime(profile.id); this.loadNotificationsSupabase(); this.loadAdsSupabase();
    this.loadForumSupabase();
    this.loadFaqSupabase();
    this.loadSupportMessagesSupabase();
    if (profile.role === 'superadmin') {
      this.loadModerationQueueSupabase();
      this.loadSupportInboxSupabase();
      this.loadMembersSupabase();
      this.loadAnalysisSupabase();
    }
  };

  signInSupabase = async () => {
    const identifier = this.state.username.trim();
    if (!identifier || !this.state.password) {
      this.setState({ error: 'Username/email and password are required.' });
      return;
    }
    this.setState({ busy: true, error: '' });
    try {
      const authApi = await import('../api/auth');
      await authApi.signIn(identifier, this.state.password);
      const profile = await authApi.getMyProfile();
      if (!profile) throw new authApi.AuthApiError('Signed in, but no profile was found for this account.');
      this.setState({ busy: false, screen: 'dash', authMode: 'supabase', convos: [], dbThreads: [], ...this.roleFromProfile(profile) });
      this.bootstrapSession(profile);
    } catch (e) {
      this.setState({ busy: false, error: e instanceof Error ? e.message : 'Something went wrong.' });
    }
  };

  signUpSupabase = async () => {
    const s = this.state;
    if (!s.suUser.trim() || !s.suEmail.trim() || !s.suPass) {
      this.setState({ suError: 'Fill in username, email and password to continue.' }); return;
    }
    if (!/.+@.+\..+/.test(s.suEmail)) { this.setState({ suError: "That email address doesn't look right." }); return; }
    if (s.suPass.length < 8) { this.setState({ suError: 'Use at least 8 characters for your password.' }); return; }
    if (s.suPass !== s.suConfirm) { this.setState({ suError: "Passwords don't match. Check both fields." }); return; }
    if (!s.suTerms) { this.setState({ suError: 'Please accept the community guidelines.' }); return; }

    this.setState({ busy: true, suError: '', suInfo: '' });
    try {
      const authApi = await import('../api/auth');
      const result = await authApi.signUp(s.suUser, s.suEmail, s.suPass);
      if (result.signedIn) {
        const profile = await authApi.getMyProfile();
        this.setState({
          busy: false, screen: 'dash',
          ...(profile ? this.roleFromProfile(profile) : { role: 'new' as Role }),
        });
        if (profile) this.bootstrapSession(profile);
        this.flash('Welcome to Lost Items Community. Your account is live.');
      } else {
        this.setState({ busy: false, suInfo: `We sent a confirmation link to ${s.suEmail}. Confirm it, then sign in.` });
      }
    } catch (e) {
      this.setState({ busy: false, suError: e instanceof Error ? e.message : 'Something went wrong.' });
    }
  };

  requestResetSupabase = async () => {
    const email = this.state.fpEmail.trim();
    if (!/.+@.+\..+/.test(email)) { this.setState({ fpError: 'Enter the email address on your account.' }); return; }
    this.setState({ fpBusy: true, fpError: '', fpInfo: '' });
    try {
      const authApi = await import('../api/auth');
      await authApi.requestPasswordReset(email);
      this.setState({ fpBusy: false, fpStage: 'done', fpInfo: `If ${email} has an account, a reset link is on its way.` });
    } catch {
      this.setState({ fpBusy: false, fpStage: 'done', fpInfo: `If ${email} has an account, a reset link is on its way.` });
    }
  };

  /** Phase 12.2: persists guidelines_accepted_at, then mirrors it into local state so the
   *  dashboard checklist flips immediately. The sheet stays open if the write fails. */
  acceptGuidelinesSupabase = async () => {
    const p = this.state.profile;
    // Opened from the sign-up form (nobody is signed in yet): there is no profile to stamp, so just close the sheet
    // and tick the "I agree" box. This used to return silently, which is why the button seemed to do nothing.
    if (!p) { this.setState({ sheet: null, suTerms: true, suError: '' }); return; }
    try {
      const authApi = await import('../api/auth');
      const profile = await authApi.acceptGuidelines(p.id);
      this.setState({ sheet: null, suTerms: true, suError: '', profile });
    } catch (e) {
      this.flash(e instanceof Error ? e.message : "Couldn't save that. Please try again.");
    }
  };

  signOutSupabase = async () => {
    this.stopChatRealtime();
    const authApi = await import('../api/auth');
    await authApi.signOut();
  };

  // ============= Phase 14: password-reset link =============

  /** Set as soon as a reset link is recognised, so restoreSession() can't route to the dashboard. */
  private recovering = false;

  /**
   * Handles a URL the app was opened with (web address, or a deep link on native). Returns true when
   * it was a password-reset link (success or failure), so the caller skips restoring a normal session.
   * Success -> the "choose a new password" form; failure (expired/used link) -> the email form with an
   * explanation. The one-time tokens are scrubbed from the address bar either way.
   */
  handleAuthUrl = async (url: string | null | undefined): Promise<boolean> => {
    const { parseAuthUrl } = await import('../lib/authUrl');
    const parsed = parseAuthUrl(url);
    if (!parsed) return false;
    const { scrubAuthUrl } = await import('../lib/appUrl');
    scrubAuthUrl();

    const showError = (message: string) => {
      this.recovering = false;
      this.setState({ authMode: 'supabase', screen: 'forgot', fpStage: 'email', fpRecovery: false, fpError: message, fpInfo: '' });
    };
    if (parsed.kind === 'error') { showError(parsed.message); return true; }

    this.recovering = true;
    try {
      const authApi = await import('../api/auth');
      await authApi.startRecovery(parsed.accessToken, parsed.refreshToken);
      this.setState({
        authMode: 'supabase', screen: 'forgot', fpStage: 'reset', fpRecovery: true,
        fpPass: '', fpConfirm: '', fpError: '', fpInfo: '', role: null, profile: null,
      });
    } catch (e) {
      showError(e instanceof Error ? e.message : 'That reset link has expired. Request a new one.');
    }
    return true;
  };

  /** Saves the new password, then signs the recovery session out so the user signs in with it. */
  finishPasswordResetSupabase = async () => {
    const s = this.state;
    if (s.fpPass.length < 8) { this.setState({ fpError: 'Use at least 8 characters for your new password.' }); return; }
    if (s.fpPass !== s.fpConfirm) { this.setState({ fpError: "Passwords don't match. Check both fields." }); return; }
    this.setState({ fpBusy: true, fpError: '' });
    try {
      const authApi = await import('../api/auth');
      await authApi.updatePassword(s.fpPass);
      await authApi.signOut();
      this.recovering = false;
      this.setState({ fpBusy: false, fpStage: 'changed', fpRecovery: false, fpPass: '', fpConfirm: '', fpError: '' });
    } catch (e) {
      this.setState({ fpBusy: false, fpError: e instanceof Error ? e.message : 'Could not update your password. Try again.' });
    }
  };

  /** Leaving the reset form without finishing: end the recovery session instead of leaving it signed in. */
  abandonRecovery = async () => {
    this.recovering = false;
    this.setState({ screen: 'login', fpStage: 'email', fpRecovery: false, fpPass: '', fpConfirm: '', fpError: '' });
    try { const authApi = await import('../api/auth'); await authApi.signOut(); } catch { /* nothing to end */ }
  };

  /** Restores a previous Supabase session on app launch, so a killed/reopened
   *  app doesn't drop back to Welcome. No-ops if there is no session, or if
   *  navigation has already moved past the welcome/login screens. */
  restoreSession = async () => {
    // A password-reset link creates a session too; it must not be mistaken for "already signed in".
    if (this.recovering) return;
    const authApi = await import('../api/auth');
    const session = await authApi.getSession();
    if (!session) return;
    if (!['welcome', 'login'].includes(this.state.screen)) return;
    const profile = await authApi.getMyProfile();
    if (!profile) return;
    this.setState({ authMode: 'supabase', screen: 'dash', convos: [], ...this.roleFromProfile(profile) });
    this.bootstrapSession(profile);
  };

  slotFor(screen: string, fresh: boolean, st: AppState) {
    // Supabase mode reads the real placement for this screen (loaded at sign-in), never the mock list.
    // Same rule as the prototype: not live, ended, or a brand-new user who hasn't accepted the guidelines -> hidden.
    if (st.authMode === 'supabase') {
      const p = (st.dbAdPlacements ?? []).find((x) => x.screen === screen);
      if (!p) return { live: false } as Ad & { live: boolean };
      return {
        live: p.is_live && p.days_left > 0 && !(fresh && !st.suTerms),
        campaign: p.campaign_name, advertiser: p.advertiser, icon: p.icon,
      } as unknown as Ad & { live: boolean };
    }
    const a = st.ads.find((x) => x.screen === screen);
    if (!a) return { live: false } as Ad & { live: boolean };
    return { ...a, live: a.live && a.daysLeft > 0 && !(fresh && !st.suTerms) };
  }

  toggleAd(id: string) {
    let msg = '';
    this.setState((s) => ({
      ads: s.ads.map((a) => {
        if (a.id !== id) return a;
        const ended = a.daysLeft <= 0;
        const next = ended ? { ...a, live: true, daysLeft: a.days } : { ...a, live: !a.live };
        msg = next.live ? `${id} live on ${a.screen}.` : `${id} paused on ${a.screen}.`;
        return next;
      }),
    }), () => this.flash(msg));
  }

  toggleAdSupabase = async (id: string, isLive: boolean) => {
    try {
      const adsApi = await import('../api/ads');
      await adsApi.toggleAdLive(id, isLive);
      // Reload ads to get updated state
      await this.loadAdsSupabase();
      this.flash(isLive ? `Ad set live.` : `Ad paused.`);
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not update ad.');
    }
  };

  /** 10.3: saves the editor sheet to the real placement (campaign, duration, starts today, live). */
  saveAdSupabase = async () => {
    const s = this.state;
    const draft = s.adDraft;
    const campaign = (s.dbAdCampaigns ?? []).find((c) => c.key === draft?.campaignKey);
    const placement = (s.dbAdPlacements ?? []).find((p) => p.id === s.adEditId);
    if (!draft || !campaign || !placement) { this.flash('Pick a campaign first.'); return; }
    try {
      const adsApi = await import('../api/ads');
      await adsApi.updateAdPlacement(placement.id, campaign.id, draft.days);
      await this.loadAdsSupabase();
      this.setState({ sheet: null, adDraft: null });
      this.flash(`${placement.display_id} updated · ${campaign.advertiser} for ${draft.days} days.`);
    } catch (e) {
      this.flash(e instanceof Error ? e.message : 'Could not save this placement.');
    }
  };

  setStatus(id: string, status: string) {
    const swap = (list: Item[]) => list.map((i) => i.id === id ? { ...i, status: status as Item['status'] } : i);
    this.setState((s) => ({ lost: swap(s.lost), found: swap(s.found) }));
    this.flash(status === 'Reunited' ? `${id} marked as handed over.`
      : status === 'Resolved' ? `${id} closed.` : `${id} is active again.`);
  }
}
