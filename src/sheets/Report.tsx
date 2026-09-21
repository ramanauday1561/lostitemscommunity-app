import { Text, TextInput, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { C, FONTS, MONO } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Field } from '../ui/Field';
import { Cta, Pill, Seg } from '../ui/bits';
import { Sheet } from './SheetHost';

export function ReportSheet() {
  const v = useVals();
  return (
    <Sheet
      title={v.reportTitle}
      footer={<Cta label={v.reportBtnLabel} on={v.reportBtnEnabled} onPress={v.reportNext} />}
    >
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 18 }}>
        <View style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: C.primary }} />
        <View style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: v.isStep2 ? C.primary : C.fillFaint }} />
      </View>

      {v.isStep1 && (
        <>
          <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 24, backgroundColor: C.fill }}>
            <Seg label="I lost this" on={v.rType === 'Lost'} onPress={v.setLost} />
            <Seg label="I found this" on={v.rType === 'Found'} onPress={v.setFound} />
          </View>
          <View style={{ marginTop: 14 }}>
            <Field icon="label" value={v.rTitle} onChange={v.onRTitle} placeholder="What is it? e.g. Blue backpack" />
          </View>
          <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, color: C.muted, marginTop: 18, marginBottom: 10 }}>Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {v.categories.map((c) => <Pill key={c.name} label={c.name} on={c.on} onPress={c.pick} />)}
          </View>
        </>
      )}

      {v.isStep2 && (
        <>
          <Field icon="place" value={v.rPlace} onChange={v.onRPlace} placeholder="Where? e.g. Central Station platform 3" />
          <View style={{ marginTop: 8 }}>
            <Field icon="event" value={v.rDate} onChange={v.onRDate} placeholder="When? e.g. 12 Jun 2024" />
          </View>

          <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, color: C.muted, marginTop: 18, marginBottom: 8 }}>Drop a pin</Text>
          <Press
            style={{ height: 150, borderRadius: 20, backgroundColor: '#E4E9EF', overflow: 'hidden' }}
            scale={1}
            onPress={(e) => {
              const { locationX, locationY } = e.nativeEvent;
              v.onMapTap((locationX / 330) * 100, (locationY / 150) * 100);
            }}
          >
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="map" size={30} color="#B9C2CD" />
            </View>
            {v.pin && (
              <View style={{
                position: 'absolute', left: `${v.pin.x}%`, top: `${v.pin.y}%`, width: 22, height: 22,
                marginLeft: -11, marginTop: -11, borderRadius: 11, backgroundColor: C.danger,
                borderWidth: 4, borderColor: C.white,
              }} />
            )}
          </Press>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Text style={{ flex: 1, fontFamily: MONO[500], fontSize: 10.5, color: C.lighter }}>{v.pinLabel}</Text>
            <Press style={{ minHeight: 36, paddingHorizontal: 10, justifyContent: 'center' }} scale={0.96} onPress={v.useMyLocation}>
              <Text style={{ fontFamily: FONTS[600], fontSize: 12, color: C.primary }}>Use my location</Text>
            </Press>
            {v.hasPin && (
              <Press style={{ minHeight: 36, paddingHorizontal: 10, justifyContent: 'center' }} scale={0.96} onPress={v.clearPin}>
                <Text style={{ fontFamily: FONTS[600], fontSize: 12, color: C.subtle }}>Clear</Text>
              </Press>
            )}
          </View>

          <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, color: C.muted, marginTop: 18, marginBottom: 8 }}>Anything else?</Text>
          <TextInput
            value={v.rDesc}
            onChangeText={v.onRDesc}
            placeholder="Marks, contents, colour — details only the owner would know."
            placeholderTextColor={C.faint}
            multiline
            style={{
              minHeight: 92, padding: 16, borderRadius: 18, backgroundColor: C.fillSoft,
              fontFamily: FONTS[500], fontSize: 14, lineHeight: 21, color: C.ink,
              textAlignVertical: 'top', outlineStyle: 'none',
            } as object}
          />
          <Press style={{ flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48, marginTop: 8 }} scale={0.98} onPress={v.addPhoto}>
            <Icon name="add_a_photo" size={20} color={C.primary} />
            <Text style={{ fontFamily: FONTS[600], fontSize: 13, color: C.primary }}>Add a photo</Text>
          </Press>
        </>
      )}
    </Sheet>
  );
}

export function SentSheet() {
  const v = useVals();
  return (
    <Sheet footer={<Cta label="View it in the registry" on onPress={v.goRegistryFromSent} />}>
      <View style={{ alignItems: 'center', paddingVertical: 10 }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(15,123,61,.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="task_alt" size={40} color={C.success} />
        </View>
        <Text style={{ fontFamily: FONTS[800], fontSize: 22, letterSpacing: -0.5, color: C.ink, marginTop: 16 }}>Report submitted</Text>
        <Text style={{ fontFamily: FONTS[400], fontSize: 13.5, lineHeight: 21, color: C.muted, textAlign: 'center', marginTop: 8 }}>
          It is live in the registry now. We will notify you the moment something matches.
        </Text>
        <View style={{ marginTop: 14, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: C.fillSoft }}>
          <Text style={{ fontFamily: MONO[600], fontSize: 12, color: C.ink }}>{v.newId}</Text>
        </View>
      </View>
      <View style={{ marginTop: 16 }}>
        <AdInline />
      </View>
    </Sheet>
  );
}

function AdInline() {
  const v = useVals();
  const ad = v.adSlots.find((a) => a.screen === 'Report success');
  if (!ad?.live) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: C.fillSoft }}>
      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={ad.icon} size={20} color={C.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: MONO[600], fontSize: 9, letterSpacing: 1.2, color: C.lighter }}>SPONSORED</Text>
        <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.ink, marginTop: 3 }}>{ad.campaign}</Text>
      </View>
    </View>
  );
}
