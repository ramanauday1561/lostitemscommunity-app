import { createTheme } from '@shopify/restyle';
import { colors, radius, spacing, text } from './tokens';

/**
 * Restyle theme for the Box / Text / Card primitives.
 *
 * Two rules keep this file from becoming a second, competing design system:
 *
 * 1. Colour keys are named exactly as in tokens.ts. Restyle needs a key
 *    where StyleSheet needs a value, but there is one vocabulary either
 *    way, so `colors.primary` and <Box backgroundColor="primary"> mean the
 *    same thing and nobody has to learn a translation table.
 * 2. Text variants spread a scale from tokens.ts and restate only the
 *    colour, which Restyle requires as a key. Sizes and line heights exist
 *    in exactly one place, so the two systems cannot drift apart.
 *
 * Entries are added when a screen needs them rather than up front - an
 * unused variant is a thing to read and wonder about.
 */
const CARD_SHADOW = {
  // Restyle resolves shadowColor through the palette, so this must be a
  // colour KEY. Passing the raw hex from tokens throws at render.
  shadowColor: 'ink',
  shadowOpacity: 0.06,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;

const theme = createTheme({
  colors: {
    ink: colors.ink,
    muted: colors.muted,
    mutedLight: colors.mutedLight,
    primary: colors.primary,
    success: colors.success,
    danger: colors.danger,
    card: colors.card,
    bgAlt: colors.bgAlt,
    white: colors.white,
    transparent: 'transparent',
  },
  spacing: { none: 0, ...spacing },
  borderRadii: { none: 0, sm: radius.sm, field: radius.field, card: radius.card, cardLarge: radius.cardLarge },
  breakpoints: { phone: 0 },

  textVariants: {
    defaults: { ...text.body, color: 'muted' },
    h1: { ...text.h1, color: 'ink' },
    h2: { ...text.h2, color: 'ink' },
    h3: { ...text.h3, color: 'ink' },
    cardTitle: { ...text.cardTitle, color: 'ink' },
    body: { ...text.body, color: 'muted' },
    small: { ...text.small, color: 'muted' },
    smallStrong: { ...text.smallStrong, color: 'ink' },
    link: { ...text.link, color: 'primary' },
    /** Uppercase mono eyebrow above a screen title. */
    kickerMuted: { ...text.kickerMuted, color: 'mutedLight' },
    /** Short codes and dates: FOUND-2018 · 11 Jun 2024 */
    meta: { ...text.meta, color: 'mutedLight' },
  },

  cardVariants: {
    defaults: { backgroundColor: 'card', borderRadius: 'card', padding: 'xl', ...CARD_SHADOW },
    /** Carousel item card - tighter padding, rounder corners. */
    item: { backgroundColor: 'card', borderRadius: 'cardLarge', padding: 'md', ...CARD_SHADOW },
    /** Quick-action row. */
    row: { backgroundColor: 'card', borderRadius: 'card', padding: 'lg', ...CARD_SHADOW },
  },
});

export type Theme = typeof theme;
export default theme;
