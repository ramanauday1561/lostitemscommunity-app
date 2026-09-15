/**
 * Design tokens lifted from the interactive prototype
 * (AppDesign/Lost Items App v3 (native).dc.html) in the management repo.
 * Every screen should pull colour/spacing/type from here — never hard-code.
 */

export const colors = {
  ink: '#16181F',
  inkSoft: '#101319',
  muted: '#6B7280',
  mutedLight: '#8B8F95',
  mutedFaint: '#A8ACB2',

  primary: '#0B6BCB',
  primarySoft: '#E8F1FB',
  accent: '#00E39B',

  danger: '#B42318',
  dangerSoft: '#FDECEA',
  success: '#0F7B3D',
  successSoft: '#ECF7F0',

  bg: '#F7F7F5',
  bgAlt: '#F2F2F0',
  card: '#FFFFFF',

  border: '#E7E7E3',
  borderSoft: '#EDEDEA',
  borderStrong: '#DEDDD8',

  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const type = {
  h1: { fontSize: 26, fontWeight: '800' },
  h2: { fontSize: 20, fontWeight: '800' },
  h3: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyStrong: { fontSize: 15, fontWeight: '600' },
  small: { fontSize: 13, fontWeight: '400' },
  tiny: { fontSize: 11, fontWeight: '600' },
} as const;

export const shadow = {
  card: {
    shadowColor: '#16181F',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
