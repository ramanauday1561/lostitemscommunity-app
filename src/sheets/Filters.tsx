import { Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { C, FONTS } from '../theme/tokens';
import { Press } from '../ui/Press';
import { Field } from '../ui/Field';
import { Cta, Pill } from '../ui/bits';
import { Sheet } from './SheetHost';

const label = { fontFamily: FONTS[600], fontSize: 12.5, color: C.muted, marginBottom: 10 } as const;

/** Registry filters in one place: status, and where to look (anywhere, near me, or a searched place + radius). */
export function FiltersSheet() {
  const v = useVals();
  return (
    <Sheet
      title="Filters"
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Press style={{ minHeight: 56, paddingHorizontal: 22, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: C.fill }}
            scale={0.97} onPress={v.resetFilters}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>Reset</Text>
          </Press>
          <Cta label="Show results" on onPress={v.closeSheet} style={{ flex: 1 }} />
        </View>
      }
    >
      <Text style={label}>Status</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {v.statusFilters.map((f) => <Pill key={f.name} label={f.name} on={f.on} onPress={f.pick} />)}
      </View>

      {v.nearAvailable && (
        <>
          <Text style={[label, { marginTop: 22 }]}>Where</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Pill label="Anywhere" on={!v.nearActive} onPress={v.nearAnywhere} />
            <Pill label={v.nearLocating ? 'Locating…' : 'Near me'} on={v.nearActive && v.nearIsMe} onPress={v.nearMe} />
          </View>
          <View style={{ marginTop: 10 }}>
            <Field icon="place" value={v.nearQuery} onChange={v.onNearQuery} onSubmit={v.searchNear} placeholder="Or search a street, landmark or area" compact />
          </View>
          {v.nearSearching && <Text style={{ fontFamily: FONTS[500], fontSize: 12, color: C.subtle, marginTop: 8 }}>Searching…</Text>}
          {v.nearResults.length > 0 && (
            <View style={{ marginTop: 8, borderRadius: 16, backgroundColor: C.fillSoft, overflow: 'hidden' }}>
              {v.nearResults.map((r) => (
                <Press key={r.key} style={{ minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' }} scale={0.99} onPress={r.pick}>
                  <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, color: C.ink }}>{r.label}</Text>
                </Press>
              ))}
            </View>
          )}
          {v.nearRadiusShown && (
            <>
              <Text style={[label, { marginTop: 22 }]}>Distance</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {v.nearRadii.map((r) => <Pill key={r.name} label={r.name} on={r.on} onPress={r.pick} />)}
              </View>
              <Text style={{ fontFamily: FONTS[500], fontSize: 12, color: C.subtle, marginTop: 10 }}>{v.nearSummary}</Text>
            </>
          )}
          {v.nearActive && !v.nearRadiusShown && v.isMapView && (
            <Text style={{ fontFamily: FONTS[500], fontSize: 12, color: C.subtle, marginTop: 10 }}>
              The map is centred on {v.nearSummary.replace(/^Within [^ ]+ [^ ]+ of /, '')}. Distance applies in list view.
            </Text>
          )}
        </>
      )}
    </Sheet>
  );
}
