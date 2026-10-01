import { Platform } from 'react-native';

/**
 * Font size for a text input. iOS Safari zooms the whole page when an input under 16px is focused (and the zoom
 * can stick, leaving the layout scrolled sideways), so on the web inputs are never smaller than 16px.
 */
export const inputFont = (size: number) => (Platform.OS === 'web' ? Math.max(16, size) : size);
