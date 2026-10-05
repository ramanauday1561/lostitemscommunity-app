import { Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn, SlideInDown, interpolate, useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useVals } from '../StoreProvider';
import { C, FONTS } from '../theme/tokens';
import { Glass } from '../ui/Glass';
import { useTopInset } from '../ui/Shell';

/** Drag the grabber down this far (or flick it) and the sheet closes. */
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 900;

/**
 * Reproduces the prototype's single sheet container (line 1994): a scrim plus a
 * panel pinned to the bottom, capped at 88% height, with a separate footer
 * action bar below the scrolling body. The panel is frosted glass over the dimmed page, springs up when it
 * opens, and can be dragged down by its grabber to dismiss.
 */
export function Sheet({ title, children, footer }: {
  title?: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  const v = useVals();
  const close = v.closeSheet;
  const top = useTopInset(); // the dimmed scrim covers the status-bar strip too
  const y = useSharedValue(0);

  const drag = Gesture.Pan()
    .onUpdate((e) => { y.value = Math.max(0, e.translationY); })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(close);
      } else {
        y.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [0, 320], [1, 0.35], 'clamp') }));

  return (
    <>
      <Animated.View entering={FadeIn.duration(200)} style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, top: -top, zIndex: 45 } as object, scrim]}>
        <Pressable onPress={close} style={{ flex: 1, backgroundColor: 'rgba(16,19,25,.42)' }} />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.springify().damping(22).stiffness(200).mass(0.9)}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50, maxHeight: '88%' }}
      >
        <Animated.View style={[{ flexShrink: 1 }, panel]}>
          <Glass blur intensity={60} radius={32} style={{
            backgroundColor: 'rgba(255,255,255,.9)', borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
            borderBottomWidth: 0, flexShrink: 1, boxShadow: '0 -20px 60px -20px rgba(16,19,25,.6)',
          }}>
            <GestureDetector gesture={drag}>
              <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6, cursor: 'grab' } as object}>
                <View style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: C.line }} />
              </View>
            </GestureDetector>
            {title ? (
              <Text style={{ fontFamily: FONTS[800], fontSize: 20, letterSpacing: -0.4, color: C.ink, paddingHorizontal: 22, paddingTop: 8 }}>
                {title}
              </Text>
            ) : null}
            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ padding: 22, paddingTop: title ? 12 : 12 }}>
              {children}
            </ScrollView>
            {footer ? (
              <View style={{ padding: 18, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.fill, gap: 10 }}>
                {footer}
              </View>
            ) : null}
          </Glass>
        </Animated.View>
      </Animated.View>
    </>
  );
}
