/**
 * Design tokens measured directly from the interactive prototype
 * (AppDesign/Lost Items App v3 (native).dc.html) by rendering it headlessly
 * and reading computed styles — not eyeballed.
 *
 * React Native does not synthesise weights for custom fonts, so each weight
 * is its own family. Always use `font.*` rather than fontWeight.
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

  bg: '#F2F2F0',
  bgAlt: '#F7F7F5',
  card: '#FFFFFF',
  fieldIdle: '#EDEDEA',

  border: '#E7E7E3',
  borderSoft: '#EDEDEA',
  borderStrong: '#DEDDD8',

  white: '#FFFFFF',
} as const;

/** Font families, one per weight. */
export const font = {
  regular: 'PublicSans_400Regular',
  medium: 'PublicSans_500Medium',
  semibold: 'PublicSans_600SemiBold',
  bold: 'PublicSans_700Bold',
  extrabold: 'PublicSans_800ExtraBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  monoSemibold: 'IBMPlexMono_600SemiBold',
} as const;

/**
 * Type scale, measured. Note the negative tracking on headlines and the
 * wide positive tracking on the mono kickers — both are signature to this
 * design and the screens look wrong without them.
 */
export const text = {
  /** 30/34.2, -1.05 tracking. Screen headline. */
  h1: { fontFamily: font.extrabold, fontSize: 30, lineHeight: 34, letterSpacing: -1.05, color: colors.ink },
  h2: { fontFamily: font.extrabold, fontSize: 22, lineHeight: 26, letterSpacing: -0.6, color: colors.ink },
  /** Section heading, e.g. "Recently handed in". */
  h3: { fontFamily: font.bold, fontSize: 17, lineHeight: 22, letterSpacing: -0.3, color: colors.ink },
  cardTitle: { fontFamily: font.bold, fontSize: 15.5, lineHeight: 20, letterSpacing: -0.2, color: colors.ink },
  /** 15/24 grey body copy. */
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 24, color: colors.muted },
  bodyInk: { fontFamily: font.regular, fontSize: 15, lineHeight: 24, color: colors.ink },
  bodyStrong: { fontFamily: font.semibold, fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 19, color: colors.muted },
  smallStrong: { fontFamily: font.bold, fontSize: 13, lineHeight: 18, color: colors.ink },
  button: { fontFamily: font.bold, fontSize: 15.5, letterSpacing: 0 },
  input: { fontFamily: font.medium, fontSize: 15.5, color: colors.ink },
  /** Uppercase mono eyebrow: 10px, 1.6 tracking. */
  kicker: { fontFamily: font.monoSemibold, fontSize: 10, letterSpacing: 1.6, color: colors.primary },
  kickerMuted: { fontFamily: font.monoSemibold, fontSize: 10, letterSpacing: 1.6, color: colors.mutedLight },
  /** Short codes and dates, e.g. "FOUND-2018 · 11 Jun 2024". */
  meta: { fontFamily: font.monoMedium, fontSize: 11, letterSpacing: 0.3, color: colors.mutedLight },
  brand: { fontFamily: font.bold, fontSize: 14, letterSpacing: -0.14, color: colors.ink },
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;

/** Measured radii — noticeably rounder than a default RN app. */
export const radius = {
  sm: 10,
  field: 18,
  button: 20,
  card: 20,
  cardLarge: 24,
  hero: 28,
  pill: 999,
} as const;

export const size = {
  button: 56,
  field: 57,
  tapTarget: 44,
} as const;

/** Soft, wide, low-opacity — no borders anywhere on cards or fields. */
export const shadow = {
  card: {
    shadowColor: '#16181F',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  field: {
    shadowColor: '#16181F',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  floating: {
    shadowColor: '#16181F',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;
