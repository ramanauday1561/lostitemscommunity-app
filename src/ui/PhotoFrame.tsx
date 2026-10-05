import type { ReactNode } from 'react';
import { Image, View } from 'react-native';
import { C, SHADOW } from '../theme/tokens';
import { Icon } from './Icon';

/** The welcome pictures' look, at any size: soft blue tint behind, a light rim, rounded corners and the same drop
 *  shadow. Every item picture in a list or sheet goes through this, so they read as one family. */
export const FRAME_TINT = '#E2ECF7';

export function PhotoFrame({ width, height = width, uri, icon, label, children }: {
  width: number; height?: number; uri?: string; icon?: string; label?: string; children?: ReactNode;
}) {
  const base = Math.min(width, height);
  return (
    <View style={[{
      width, height, maxWidth: '100%', borderRadius: Math.min(36, Math.max(16, Math.round(base * 0.14))), backgroundColor: FRAME_TINT,
      overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.7)', alignItems: 'center', justifyContent: 'center',
    }, SHADOW.slide]}>
      {uri
        ? <Image source={{ uri }} resizeMode="cover" accessibilityLabel={label} style={{ width: '100%', height: '100%' }} />
        : icon ? <Icon name={icon} size={Math.round(base * 0.44)} color={C.primary} /> : null}
      {children}
    </View>
  );
}
