import { TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { C, FONTS, SHADOW } from '../theme/tokens';
import { Icon } from './Icon';

/** The prototype's white rounded input row: icon, then a borderless field. */
export function Field({
  icon, value, onChange, placeholder, secure, keyboardType, onSubmit, maxLength, style,
}: {
  icon: string; value: string; onChange: (v: string) => void; placeholder: string;
  secure?: boolean; keyboardType?: KeyboardTypeOptions; onSubmit?: () => void;
  maxLength?: number; style?: object;
}) {
  return (
    <View style={[{
      flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white,
      borderRadius: 18, padding: 16, minHeight: 56,
    }, SHADOW.field, style]}>
      <Icon name={icon} size={21} color={C.faint} />
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
        style={{ flex: 1, minWidth: 0, fontFamily: FONTS[500], fontSize: 15.5, color: C.ink, outlineStyle: 'none' } as object}
      />
    </View>
  );
}
