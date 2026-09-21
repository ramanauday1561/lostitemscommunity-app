import { Pressable, ScrollView, Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { C, FONTS } from '../theme/tokens';

/**
 * Reproduces the prototype's single sheet container (line 1994): a scrim plus a
 * panel pinned to the bottom, capped at 88% height, with a separate footer
 * action bar below the scrolling body.
 */
export function Sheet({ title, children, footer }: {
  title?: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  const v = useVals();
  return (
    <>
      <Pressable
        onPress={v.closeSheet}
        style={{ position: 'absolute', inset: 0, zIndex: 45, backgroundColor: 'rgba(16,19,25,.42)' } as object}
      />
      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50, maxHeight: '88%',
        backgroundColor: C.white, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        boxShadow: '0 -20px 60px -20px rgba(16,19,25,.6)',
      }}>
        <View style={{ alignItems: 'center', paddingTop: 10 }}>
          <View style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: C.line }} />
        </View>
        {title ? (
          <Text style={{ fontFamily: FONTS[800], fontSize: 20, letterSpacing: -0.4, color: C.ink, paddingHorizontal: 22, paddingTop: 14 }}>
            {title}
          </Text>
        ) : null}
        <ScrollView contentContainerStyle={{ padding: 22, paddingTop: title ? 12 : 16 }}>
          {children}
        </ScrollView>
        {footer ? (
          <View style={{ padding: 18, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.fill, gap: 10 }}>
            {footer}
          </View>
        ) : null}
      </View>
    </>
  );
}
