import { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import * as Linking from 'expo-linking';
import { Store } from './state/store';
import { buildVals, type Vals } from './state/selectors';

const Ctx = createContext<{ store: Store; vals: Vals } | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<Store>(null);
  ref.current ??= new Store();
  const store = ref.current;

  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const vals = useMemo(() => buildVals(store), [state, store]);

  // A password-reset link opens the app with tokens in its URL (web address, or a deep link on native).
  // Check for one BEFORE restoring a stored session, and keep listening for links while the app is open.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const initial = await Linking.getInitialURL().catch(() => null);
      const handled = await store.handleAuthUrl(initial);
      if (!handled && !cancelled) await store.restoreSession();
    })();
    const sub = Linking.addEventListener('url', (e) => { store.handleAuthUrl(e.url); });
    return () => { cancelled = true; sub.remove(); };
  }, [store]);

  return <Ctx.Provider value={{ store, vals }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside StoreProvider');
  return v;
}
export const useVals = () => useApp().vals;
