import { createTheme } from '@shopify/restyle';
import { colors as c, font, radius, spacing as sp } from './tokens';

/**
 * Restyle theme. Values come from tokens.ts, which was measured off the
 * prototype — this file only reshapes them into Restyle's contract so
 * screens can use typed variants instead of ad-hoc StyleSheet objects.
 */
const CARD_SHADOW = {
  shadowColor: 'ink',
  shadowOpacity: 0.06,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;

const theme = createTheme({
  colors: {
    ink: c.ink,
    inkSoft: c.inkSoft,
    muted: c.muted,
    mutedLight: c.mutedLight,
    mutedFaint: c.mutedFaint,
    brand: c.primary,
    brandSoft: c.primarySoft,
    danger: c.danger,
    dangerSoft: c.dangerSoft,
    ok: c.success,
    okSoft: c.successSoft,
    canvas: c.bg,
    surface: c.card,
    tile: c.bgAlt,
    line: c.border,
    white: c.white,
    transparent: 'transparent',
  },
  spacing: { none: 0, xs: sp.xs, sm: sp.sm, md: sp.md, lg: sp.lg, xl: sp.xl, xxl: sp.xxl, xxxl: sp.xxxl },
  borderRadii: {
    none: 0,
    sm: radius.sm,
    field: radius.field,
    btn: radius.button,
    card: radius.card,
    cardLarge: radius.cardLarge,
    hero: radius.hero,
    pill: radius.pill,
  },
  breakpoints: { phone: 0 },

  textVariants: {
    defaults: { fontFamily: font.regular, fontSize: 15, lineHeight: 24, color: 'muted' },
    /** Uppercase mono eyebrow above a screen title. */
    kicker: { fontFamily: font.monoSemibold, fontSize: 10, letterSpacing: 1.6, color: 'brand' },
    kickerMuted: { fontFamily: font.monoSemibold, fontSize: 10, letterSpacing: 1.6, color: 'mutedLight' },
    h1: { fontFamily: font.extrabold, fontSize: 30, lineHeight: 34, letterSpacing: -1.05, color: 'ink' },
    h2: { fontFamily: font.extrabold, fontSize: 22, lineHeight: 26, letterSpacing: -0.6, color: 'ink' },
    /** Section heading, e.g. "Recently handed in". */
    section: { fontFamily: font.bold, fontSize: 19, lineHeight: 24, letterSpacing: -0.4, color: 'ink' },
    cardTitle: { fontFamily: font.bold, fontSize: 16, lineHeight: 21, letterSpacing: -0.2, color: 'ink' },
    body: { fontFamily: font.regular, fontSize: 15, lineHeight: 24, color: 'muted' },
    bodyInk: { fontFamily: font.regular, fontSize: 15, lineHeight: 24, color: 'ink' },
    small: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 19, color: 'muted' },
    smallStrong: { fontFamily: font.bold, fontSize: 13, lineHeight: 18, color: 'ink' },
    button: { fontFamily: font.bold, fontSize: 15.5, color: 'white' },
    link: { fontFamily: font.bold, fontSize: 13.5, color: 'brand' },
    /** Short codes and dates: FOUND-2018 · 11 Jun 2024 */
    meta: { fontFamily: font.monoMedium, fontSize: 11, letterSpacing: 0.3, color: 'mutedLight' },
    brand: { fontFamily: font.bold, fontSize: 14, letterSpacing: -0.14, color: 'ink' },
  },

  cardVariants: {
    // Restyle resolves shadowColor through the theme palette, so it must be
    // a colour KEY here — passing the raw hex from tokens throws at render.
    defaults: { backgroundColor: 'surface', borderRadius: 'card', padding: 'xl', ...CARD_SHADOW },
    /** Carousel item card — tighter padding, rounder corners. */
    item: { backgroundColor: 'surface', borderRadius: 'cardLarge', padding: 'md', ...CARD_SHADOW },
    /** Quick-action row. */
    row: { backgroundColor: 'surface', borderRadius: 'card', padding: 'lg', ...CARD_SHADOW },
    flat: { backgroundColor: 'surface', borderRadius: 'field', padding: 'lg' },
  },
});

export type Theme = typeof theme;
export default theme;
