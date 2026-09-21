import type { TextStyle, ViewStyle } from 'react-native';

// Colour tokens transcribed from the literal hex values used throughout
// prototype/Lost Items App v3 (native).dc.html.
export const C = {
  primary: '#0B6BCB',
  primaryDark: '#08529c',
  ink: '#16181F',
  muted: '#6B7280',
  subtle: '#8b8f95',
  faint: '#9a9ea4',
  lighter: '#a8acb2',
  bg: '#F2F2F0',
  shell: '#e7e6e2',
  white: '#ffffff',
  line: '#DEDDD8',
  lineStrong: '#D6D5D0',
  lineSoft: '#d8d6d1',
  fill: '#EDEDEA',
  fillSoft: '#F7F7F5',
  fillFaint: '#EAEAE7',
  success: '#0F7B3D',
  danger: '#B42318',
  warn: '#C98A00',
  warnDeep: '#B4611D',
  chartTrack: '#E6E8EB',
  radio: '#d0d3d7',
  barIdle: '#c6c9ce',
} as const;

export const FONTS = {
  400: 'PublicSans-400', 500: 'PublicSans-500', 600: 'PublicSans-600',
  700: 'PublicSans-700', 800: 'PublicSans-800',
} as const;
export const MONO = { 400: 'IBMPlexMono-400', 500: 'IBMPlexMono-500', 600: 'IBMPlexMono-600' } as const;
export const ICON_FONT = 'MaterialSymbolsRounded';

type W = keyof typeof FONTS;
type MW = keyof typeof MONO;

/** Mirrors the prototype's CSS `font:` shorthand, e.g. font(700, 15.5). */
export const font = (weight: W, size: number, lineHeight?: number): TextStyle => ({
  fontFamily: FONTS[weight],
  fontSize: size,
  ...(lineHeight ? { lineHeight: size * lineHeight } : null),
});

/** Monospace variant, used for kickers, handles and timestamps. */
export const mono = (weight: MW, size: number, letterSpacing?: number): TextStyle => ({
  fontFamily: MONO[weight],
  fontSize: size,
  ...(letterSpacing ? { letterSpacing: size * letterSpacing } : null),
});

/** Elevation is shadow-based in this design -- never borders. */
export const SHADOW = {
  card: { boxShadow: '0 1px 2px rgba(22,24,31,.05), 0 14px 30px -24px rgba(22,24,31,.45)' },
  raised: { boxShadow: '0 1px 2px rgba(22,24,31,.06), 0 6px 16px -8px rgba(22,24,31,.24)' },
  field: { boxShadow: '0 1px 2px rgba(22,24,31,.05), 0 10px 24px -20px rgba(22,24,31,.4)' },
  tile: { boxShadow: '0 1px 2px rgba(22,24,31,.05), 0 12px 26px -20px rgba(22,24,31,.45)' },
  cta: { boxShadow: '0 14px 30px -12px rgba(11,107,203,.85)' },
  send: { boxShadow: '0 10px 22px -10px rgba(11,107,203,.85)' },
  pillOn: { boxShadow: '0 8px 18px -8px rgba(22,24,31,.7)' },
  segOn: { boxShadow: '0 1px 3px rgba(22,24,31,.14)' },
  sheet: { boxShadow: '0 -20px 60px -20px rgba(16,19,25,.6)' },
  slide: { boxShadow: '0 24px 50px -28px rgba(22,24,31,.5)' },
  fab: { boxShadow: '0 10px 24px -16px rgba(22,24,31,.4)' },
} as const satisfies Record<string, ViewStyle>;

export const money = (n: number) => '$' + n.toLocaleString('en-US');
export const compact = (n: number) =>
  n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : String(n);
export const initials = (handle: string) => {
  const parts = String(handle || '').split(/[.@_\-]/).filter(Boolean);
  const s = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : String(handle || '?').slice(0, 2);
  return s.toUpperCase();
};
