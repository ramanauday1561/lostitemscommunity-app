import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { C, FONTS, SHADOW } from '../theme/tokens';
import { Icon } from './Icon';
import { Press } from './Press';

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromIso(iso: string): Date {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function label(iso: string): string {
  return iso ? fromIso(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
}

/** iOS/Android date picker with the Field look. iOS shows the system's compact date button in the row (it opens a
 *  calendar); Android opens its own dialog on tap. The value is an ISO date, 'YYYY-MM-DD'. The web build has its own
 *  version (DateField.web.tsx). */
export function DateField({ icon, value, onChange, placeholder }: {
  icon: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const shown = label(value);
  const max = new Date();

  const onPicked = (_e: DateTimePickerEvent, date?: Date) => {
    setOpen(false);
    if (date) onChange(toIso(date));
  };

  return (
    <View>
      <Press
        style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 16, minHeight: 56 }, SHADOW.field]}
        scale={0.99}
        onPress={() => {
          if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({ value: fromIso(value), mode: 'date', maximumDate: max, onChange: onPicked });
          } else {
            setOpen((o) => !o);
          }
        }}
      >
        <Icon name={icon} size={21} color={C.faint} />
        <Text style={{ flex: 1, fontFamily: FONTS[500], fontSize: 15.5, color: shown ? C.ink : C.faint }}>{shown || placeholder}</Text>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={22} color={C.faint} />
      </Press>
      {open && Platform.OS === 'ios' && (
        <View style={{ marginTop: 8, borderRadius: 18, backgroundColor: C.white, alignItems: 'center', paddingVertical: 6 }}>
          <DateTimePicker value={fromIso(value)} mode="date" display="inline" maximumDate={max} onChange={onPicked} accentColor={C.primary} />
        </View>
      )}
    </View>
  );
}
