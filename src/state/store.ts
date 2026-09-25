import type { RefObject } from 'react';
import type { ScrollView } from 'react-native';
import {
  ADS, CHAT_SEED, CONVOS, FAQ, FLAGGED, FOUND, LOST, MEMBERS, SLIDES, SUPPORT_SEED, THREADS,
  type Ad, type ChatMsg, type Convo, type FlaggedRecord, type Item, type Member, type Thread,
} from '../data/constants';
// Type-only import: the real module (which pulls in react-native-url-polyfill
// and other RN-only code) is loaded lazily inside each method below via
// dynamic import(), so requiring store.ts outside Expo/Metro -- as the
// Node-based prototype-parity oracle in tools/oracle/ does -- doesn't try to
// transform React Native internals through plain esbuild.
import type * as AuthApi from '../api/auth';

export type Role = 'admin' | 'user' | 'new' | null;
/** 'demo' is the existing mock-data flow, unchanged; 'supabase' hits the real backend.
 *  Temporary scaffolding for Phase 1 testing -- see backend/INTEGRATION_CHECKLIST.md. */
export type AuthMode = 'demo' | 'supabase';
export type Sheet =
  | 'detail' | 'report' | 'sent' | 'profile' | 'chat' | 'thread'
  | 'newthread' | 'support' | 'guidelines' | 'ad' | null;

export interface Pin { x: number; y: number; lat: string; lng: string }

/** Mirrors `state` in the prototype's Component class (line 1404). */
export interface AppState {
  screen: string; slide: number; convos: Convo[]; activeConvo: string | null;
  draft: string; role: Role;
  supportMsgs: ChatMsg[]; supportDraft: string; botTyping: boolean;
  threads: Thread[]; activeThread: number | null; replyDraft: string;
  ntTitle: string; ntBody: string; ntTag: string;
  username: string; password: string; remember: boolean; error: string; busy: boolean;
  authMode: AuthMode;
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
}

export const initialState: AppState = {
  screen: 'welcome', slide: 0, convos: CONVOS, activeConvo: null, draft: '', role: null,
  supportMsgs: SUPPORT_SEED, supportDraft: '', botTyping: false,
  threads: THREADS, activeThread: null, replyDraft: '', ntTitle: '', ntBody: '', ntTag: 'Question',
  username: '', password: '', remember: true, error: '', busy: false,
  authMode: 'demo',
  suUser: '', suEmail: '', suPass: '', suConfirm: '', suTerms: false, suError: '', suInfo: '',
  fpStage: 'email', fpEmail: '', fpCode: '', fpPass: '', fpConfirm: '', fpError: '', fpBusy: false, fpInfo: '',
  sheet: null,
  ads: ADS, adEditId: 'AD-01', adDraft: null,
  flagged: FLAGGED, approved: 0, removed: 0, lost: LOST, found: FOUND, members: MEMBERS,
  q: '', uq: '', filter: 'All', topic: 'All', sel: null, claimed: {}, toast: '', newId: '',
  step: 1, rType: 'Lost', rTitle: '', rCat: '', rPlace: '', rDate: '', rDesc: '', pin: null,
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
    const r = this.state.role;
    if (r === 'admin') return { name: 'Super Admin', ini: 'SA', handle: 'superadmin' };
    if (r === 'new') return { name: 'Nadia Iqbal', ini: 'NI', handle: 'newuser' };
    return { name: 'Simple User', ini: 'SU', handle: 'user' };
  }

  roleState(username: string): Partial<AppState> {
    if (username === 'superadmin') return { role: 'admin' };
    if (username === 'newuser') return {
      role: 'new', filter: 'All', suTerms: false,
      convos: [], activeConvo: null, threads: THREADS,
      lost: LOST.filter((i) => i.by !== 'simple.user'),
      found: FOUND.filter((i) => i.by !== 'simple.user'),
    };
    return { role: 'user', convos: CONVOS, threads: THREADS, lost: LOST, found: FOUND, filter: 'All' };
  }

  /** The finder replies automatically after 1600ms. */
  pushMsg(text: string) {
    const t = (text || '').trim();
    if (!t) return;
    const id = this.state.activeConvo;
    const time = this.stamp();
    this.setState((s) => ({
      draft: '',
      convos: s.convos.map((c) => c.itemId === id ? { ...c, time, msgs: [...c.msgs, { from: 'me', text: t, time }] } : c),
    }));
    this.scrollChat();
    clearTimeout(this.tReply);
    this.tReply = setTimeout(() => {
      const reply = "Works for me. I'll bring it in the original box — see you there.";
      const s = this.state;
      const open = s.sheet === 'chat' && s.activeConvo === id;
      const c = s.convos.find((x) => x.itemId === id);
      const now = this.stamp();
      this.setState({
        convos: s.convos.map((x) => x.itemId === id
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
    if (!t) return;
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
    return { role, suTerms: !!p.guidelines_accepted_at };
  }

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
      this.setState({ busy: false, screen: 'dash', ...this.roleFromProfile(profile) });
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

  signOutSupabase = async () => {
    const authApi = await import('../api/auth');
    await authApi.signOut();
  };

  /** Restores a previous Supabase session on app launch, so a killed/reopened
   *  app doesn't drop back to Welcome. No-ops if there is no session, or if
   *  navigation has already moved past the welcome/login screens. */
  restoreSession = async () => {
    const authApi = await import('../api/auth');
    const session = await authApi.getSession();
    if (!session) return;
    if (!['welcome', 'login'].includes(this.state.screen)) return;
    const profile = await authApi.getMyProfile();
    if (!profile) return;
    this.setState({ authMode: 'supabase', screen: 'dash', ...this.roleFromProfile(profile) });
  };

  slotFor(screen: string, fresh: boolean, st: AppState) {
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

  setStatus(id: string, status: string) {
    const swap = (list: Item[]) => list.map((i) => i.id === id ? { ...i, status: status as Item['status'] } : i);
    this.setState((s) => ({ lost: swap(s.lost), found: swap(s.found) }));
    this.flash(status === 'Reunited' ? `${id} marked as handed over.`
      : status === 'Resolved' ? `${id} closed.` : `${id} is active again.`);
  }
}
