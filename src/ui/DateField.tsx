import { Field } from './Field';

/** Native fallback: no date picker is installed for iOS/Android yet, so the date is typed (any format a person
 *  would write; it is parsed loosely when the report is sent). The web build uses DateField.web.tsx. */
export function DateField({ icon, value, onChange, placeholder }: {
  icon: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return <Field icon={icon} value={value} onChange={onChange} placeholder={placeholder} />;
}
