import { Text, View } from 'react-native';
import { C, FONTS, SHADOW, GLASS } from '../theme/tokens';
import { Icon } from './Icon';

/** 'YYYY-MM-DD' for today in the viewer's time zone (the picker's upper limit: nothing is lost in the future). */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function label(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** The Field look, but tapping opens the device's own date picker (a wheel on iPhone, a calendar elsewhere) instead of
 *  asking people to type a date. The value is an ISO date, 'YYYY-MM-DD'. */
export function DateField({ icon, value, onChange, placeholder }: {
  icon: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const shown = label(value);
  return (
    <View style={[{
      flexDirection: 'row', alignItems: 'center', gap: 12, ...GLASS, borderRadius: 18,
      paddingHorizontal: 16, paddingVertical: 16, minHeight: 56,
    }, SHADOW.field]}>
      <Icon name={icon} size={21} color={C.faint} />
      <Text style={{ flex: 1, fontFamily: FONTS[500], fontSize: 15.5, color: shown ? C.ink : C.faint }}>{shown || placeholder}</Text>
      {/* The real input sits invisibly over the whole row so a tap anywhere opens the picker. */}
      <input
        type="date"
        value={value}
        max={today()}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch { /* the browser opens it on its own */ } }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', border: 0, fontSize: 16 }}
      />
    </View>
  );
}
