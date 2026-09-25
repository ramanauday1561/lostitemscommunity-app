import { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Store } from './state/store';
import { buildVals, type Vals } from './state/selectors';

const Ctx = createContext<{ store: Store; vals: Vals } | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<Store>(null);
  ref.current ??= new Store();
  const store = ref.current;

  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const vals = useMemo(() => buildVals(store), [state, store]);

  useEffect(() => { store.restoreSession(); }, [store]);

  return <Ctx.Provider value={{ store, vals }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside StoreProvider');
  return v;
}
export const useVals = () => useApp().vals;
