import {
  createBox,
  createRestyleComponent,
  createText,
  createVariant,
  type VariantProps,
} from '@shopify/restyle';
import type { Theme } from '../theme/theme';

export const Box = createBox<Theme>();
export const Text = createText<Theme>();

/**
 * Card surface. `variant` picks the measured padding/radius/shadow set,
 * so screens never hand-roll a white rounded box again.
 */
export const Card = createRestyleComponent<
  VariantProps<Theme, 'cardVariants'> & React.ComponentProps<typeof Box>,
  Theme
>([createVariant({ themeKey: 'cardVariants' })], Box);

export type { Theme };
