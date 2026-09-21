import { TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { C, FONTS, SHADOW } from '../theme/tokens';
import { Icon } from './Icon';

/** The prototype's white rounded input row: icon, then a borderless field. */
export function Field({
  icon, value, onChange, placeholder, secure, keyboardType, onSubmit, maxLength, style, compact,
}: {
  icon: string; value: string; onChange: (v: string) => void; placeholder: string;
  secure?: boolean; keyboardType?: KeyboardTypeOptions; onSubmit?: () => void;
  maxLength?: number; style?: object;
  /** Shorter variant for search bars, where the full 56px row is too heavy. */
  compact?: boolean;
}) {
  return (
    <View style={[{
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.white,
      gap: compact ? 10 : 12,
      borderRadius: compact ? 16 : 18,
      paddingHorizontal: compact ? 14 : 16,
      paddingVertical: compact ? 0 : 16,
      minHeight: compact ? 46 : 56,
    }, SHADOW.field, style]}>
      <Icon name={icon} size={compact ? 19 : 21} color={C.faint} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.faint}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
        style={{
          flex: 1, minWidth: 0, fontFamily: FONTS[500],
          fontSize: compact ? 14 : 15.5, color: C.ink, outlineStyle: 'none',
        } as object}
      />
    </View>
  );
}
