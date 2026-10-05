import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View, type KeyboardTypeOptions, type ReturnKeyTypeOptions } from 'react-native';
import Animated, {
  FadeIn, FadeOut, interpolateColor, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { C, FONTS, GLASS, SHADOW } from '../theme/tokens';
import { inputFont } from '../theme/input';
import { Icon } from './Icon';
import { Press } from './Press';

/**
 * Focus + error feedback shared by every text input: the rim eases to the brand colour on focus, to red on
 * error (with a short shake when the error appears), and the glow under the field lifts a little.
 */
export function useRing(rest: string, error?: boolean) {
  const f = useSharedValue(0);
  const e = useSharedValue(0);
  const x = useSharedValue(0);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    e.value = withTiming(error ? 1 : 0, { duration: 180 });
    if (error) {
      x.value = withSequence(withTiming(-6, { duration: 50 }), withRepeat(withTiming(6, { duration: 80 }), 4, true), withTiming(0, { duration: 50 }));
    }
  }, [error, e, x]);

  const style = useAnimatedStyle(() => ({
    borderColor: interpolateColor(e.value, [0, 1], [interpolateColor(f.value, [0, 1], [rest, C.primary]), C.danger]),
    transform: [{ translateX: x.value }],
  }));

  return {
    focused,
    style,
    onFocus: () => { setFocused(true); f.value = withTiming(1, { duration: 160 }); },
    onBlur: () => { setFocused(false); f.value = withTiming(0, { duration: 200 }); },
  };
}

/**
 * The prototype's white rounded input row: icon, then a borderless field.
 * `glass` is the translucent variant for the sign-in screens, which sit over a soft coloured backdrop.
 */
export function Field({
  icon, value, onChange, placeholder, secure, keyboardType, onSubmit, maxLength, style, compact, glass, error,
  returnKeyType, autoComplete,
}: {
  icon: string; value: string; onChange: (v: string) => void; placeholder: string;
  secure?: boolean; keyboardType?: KeyboardTypeOptions; onSubmit?: () => void;
  maxLength?: number; style?: object;
  /** Shorter variant for search bars, where the full 56px row is too heavy. */
  compact?: boolean;
  glass?: boolean;
  /** Turns the rim red and shakes the field when it flips to true. */
  error?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  autoComplete?: 'username' | 'email' | 'password' | 'new-password' | 'off';
}) {
  const ref = useRef<TextInput>(null);
  const [reveal, setReveal] = useState(false);
  const ring = useRing('#FFFFFF', error);
  const h = compact ? 46 : 56;
  const hidden = !!secure && !reveal;

  return (
    <Animated.View style={[{
      ...(glass ? { backgroundColor: 'rgba(255,255,255,.62)' } : { backgroundColor: GLASS.backgroundColor }),
      borderRadius: compact ? 16 : 18, borderWidth: 1.5, minHeight: h,
    }, glass ? SHADOW.raised : SHADOW.field, ring.style, style]}>
      <Pressable
        onPress={() => ref.current?.focus()} accessible={false}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: compact ? 10 : 12, minHeight: h - 3,
          paddingHorizontal: compact ? 12.5 : 14.5,
        }}
      >
        <Icon name={icon} size={compact ? 19 : 21} color={error ? C.danger : ring.focused ? C.primary : C.faint} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={C.faint}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onSubmitEditing={onSubmit}
          returnKeyType={returnKeyType}
          autoComplete={autoComplete}
          onFocus={ring.onFocus}
          onBlur={ring.onBlur}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            flex: 1, minWidth: 0, fontFamily: FONTS[500],
            fontSize: inputFont(compact ? 14 : 15.5), color: C.ink, outlineStyle: 'none',
          } as object}
        />
        {secure ? (
          <Press style={{ width: 36, height: 36, marginRight: -6, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
            scale={0.88} onPress={() => setReveal((r) => !r)} accessibilityLabel={reveal ? 'Hide password' : 'Show password'}>
            <Icon name={reveal ? 'visibility_off' : 'visibility'} size={20} color={C.faint} />
          </Press>
        ) : ring.focused && value ? (
          <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)}>
            <Press style={{ width: 36, height: 36, marginRight: -6, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
              scale={0.88} onPress={() => { onChange(''); ref.current?.focus(); }} accessibilityLabel="Clear">
              <Icon name="cancel" size={19} color={C.lighter} />
            </Press>
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/** Multi-line input with the same focus ring, for descriptions and posts. */
export function TextArea({ value, onChange, placeholder, minHeight = 92, style }: {
  value: string; onChange: (v: string) => void; placeholder: string; minHeight?: number; style?: object;
}) {
  const ring = useRing('rgba(11,107,203,0)');
  return (
    <Animated.View style={[{ borderRadius: 18, borderWidth: 1.5, backgroundColor: C.fillSoft }, ring.style, style]}>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.faint} multiline
        onFocus={ring.onFocus} onBlur={ring.onBlur}
        style={{
          minHeight, padding: 14.5, fontFamily: FONTS[500], fontSize: inputFont(14), lineHeight: 22, color: C.ink,
          textAlignVertical: 'top', outlineStyle: 'none',
        } as object}
      />
    </Animated.View>
  );
}

/** Chat / reply composer input row (the field only; the send button lives with the caller). */
export function ComposerField({ value, onChange, onSend, placeholder }: {
  value: string; onChange: (v: string) => void; onSend: () => void; placeholder: string;
}) {
  const ring = useRing('rgba(11,107,203,0)');
  return (
    <Animated.View style={[{ flex: 1, minHeight: 52, justifyContent: 'center', paddingHorizontal: 14.5, borderRadius: 18, borderWidth: 1.5, backgroundColor: C.fillSoft }, ring.style]}>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.faint}
        onSubmitEditing={onSend} returnKeyType="send" onFocus={ring.onFocus} onBlur={ring.onBlur}
        style={{ fontFamily: FONTS[500], fontSize: inputFont(14), color: C.ink, outlineStyle: 'none' } as object}
      />
    </Animated.View>
  );
}
