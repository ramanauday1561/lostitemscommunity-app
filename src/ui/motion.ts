import { FadeIn, FadeInDown, ReduceMotion, ZoomIn } from 'react-native-reanimated';

/** Longest stagger step count: past this, rows arrive together so long lists never feel slow. */
const MAX_STEPS = 8;
const STEP_MS = 45;

/**
 * Entrance for the n-th item of a list or stack: a short rise and fade, each one a beat after the last.
 * Honours the system "reduce motion" setting.
 */
export const rise = (i = 0) =>
  FadeInDown.delay(Math.min(i, MAX_STEPS) * STEP_MS).duration(320).springify().damping(20).stiffness(190)
    .reduceMotion(ReduceMotion.System);

/** Whole-screen entrance when the active screen changes. */
export const screenIn = FadeIn.duration(240).reduceMotion(ReduceMotion.System);

/** Small badge / dot pop. */
export const pop = ZoomIn.springify().damping(12).stiffness(220).reduceMotion(ReduceMotion.System);

export const SPRING = { damping: 16, stiffness: 260, mass: 0.7 } as const;
