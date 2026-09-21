import type { TextStyle, ViewStyle } from 'react-native';
import { C, FONTS, SHADOW, MONO } from './tokens';
import { STATUS } from '../data/constants';

/** Status chip -- prototype line 1334. */
export const chip = (s: string): ViewStyle & { color: string } => {
  const c = STATUS[s] || '#8b8f95';
  return {
    flexShrink: 0, alignSelf: 'flex-start', color: c, backgroundColor: c + '1A',
    paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999,
  };
};
export const chipText = (s: string): TextStyle => ({
  fontFamily: FONTS[700], fontSize: 11, color: STATUS[s] || '#8b8f95',
});

/** Filter pill -- prototype line 1338. */
export const pill = (on: boolean): ViewStyle => ({
  flexShrink: 0, minHeight: 44, paddingHorizontal: 18, borderRadius: 999,
  alignItems: 'center', justifyContent: 'center',
  backgroundColor: on ? C.ink : C.white,
  ...(on ? SHADOW.pillOn : { boxShadow: '0 1px 2px rgba(22,24,31,.06)' }),
});
export const pillText = (on: boolean): TextStyle => ({
  fontFamily: on ? FONTS[700] : FONTS[600], fontSize: 13, color: on ? C.white : C.muted,
});

/** Segmented control -- prototype line 1341. */
export const seg = (on: boolean): ViewStyle => ({
  flex: 1, minHeight: 44, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  backgroundColor: on ? C.white : 'transparent',
  ...(on ? SHADOW.segOn : null),
});
export const segText = (on: boolean): TextStyle => ({
  fontFamily: on ? FONTS[700] : FONTS[600], fontSize: 13.5, color: on ? C.ink : C.subtle,
});

/** Primary call to action -- prototype line 1343. */
export const cta = (on: boolean, dark = false): ViewStyle => ({
  width: '100%', minHeight: 56, marginTop: dark ? 16 : 0, borderRadius: 20,
  alignItems: 'center', justifyContent: 'center',
  backgroundColor: on ? C.primary : dark ? 'rgba(255,255,255,.1)' : C.fill,
  ...(on ? SHADOW.cta : null),
});
export const ctaText = (on: boolean, dark = false): TextStyle => ({
  fontFamily: FONTS[700], fontSize: 15.5,
  color: on ? C.white : dark ? 'rgba(255,255,255,.35)' : C.lighter,
});

export const kicker: TextStyle = {
  fontFamily: MONO[600], fontSize: 10, letterSpacing: 1.4, color: C.faint,
};
