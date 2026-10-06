import { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useApp } from '../StoreProvider';
import { rise } from '../ui/motion';
import { C, FONTS, SHADOW, GLASS } from '../theme/tokens';
import { Field } from '../ui/Field';
import { AdSlot } from '../ui/AdSlot';
import { ItemCard } from '../ui/ItemCard';
import { Press } from '../ui/Press';
import { Empty, LoadGate, Pill, Seg } from '../ui/bits';
import { Icon } from '../ui/Icon';
import { Loader } from '../ui/Loader';
import { ItemsMap } from '../ui/ItemsMap';

export function Registry() {
  const { store, vals: v } = useApp();
  const st = store.state;

  // Re-fetch whenever screen/filter changes; debounce the search box so we
  // don't fire a request per keystroke.
  useEffect(() => {
    store.loadRegistry();
  }, [store, st.screen, st.filter]);

  // Debounced search. Skips the first run: the effect above already loads on mount, and a second load 300 ms
  // later is what made the loader appear twice.
  const firstQuery = useRef(true);
  useEffect(() => {
    if (firstQuery.current) { firstQuery.current = false; return; }
    const id = setTimeout(() => store.loadRegistry(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.q]);

  // While the list is (re)loading, show only the loader: the rows still in memory belong to the previous
  // tab/filter and would sit under the spinner looking like the new results.
  const reloading = v.loads.registry === 'loading';

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        <View style={[{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 24, backgroundColor: C.fill }]}>
          <Seg label="Lost" on={v.regIsLost} onPress={v.goLost} />
          <Seg label="Found" on={v.regIsFound} onPress={v.goFound} />
        </View>
        <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 24, backgroundColor: C.fill }}>
          <Seg label="List" on={!v.isMapView} onPress={v.showList} />
          <Seg label="Map" on={v.isMapView} onPress={v.showMap} />
        </View>
        <Field icon="search" value={v.q} onChange={v.onQuery} placeholder="Search title, place or reference" />
        {v.nearAvailable && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 2 }}>
              <Pill label="Anywhere" on={!v.nearActive} onPress={v.nearAnywhere} />
              <Pill label={v.nearLocating ? 'Locating…' : 'Near me'} on={v.nearActive && v.nearIsMe} onPress={v.nearMe} />
              <Pill label="Search a place" on={v.nearPanel || (v.nearActive && !v.nearIsMe)} onPress={v.toggleNearPanel} />
            </ScrollView>
            {v.nearPanel && (
              <View style={{ gap: 8 }}>
                <Field icon="place" value={v.nearQuery} onChange={v.onNearQuery} onSubmit={v.searchNear} placeholder="Street, landmark or area" compact />
                {v.nearSearching && <Text style={{ fontFamily: FONTS[500], fontSize: 12, color: C.subtle }}>Searching…</Text>}
                {v.nearResults.length > 0 && (
                  <View style={{ borderRadius: 16, backgroundColor: C.fillSoft, overflow: 'hidden' }}>
                    {v.nearResults.map((r) => (
                      <Press key={r.key} style={{ minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' }} scale={0.99} onPress={r.pick}>
                        <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, color: C.ink }}>{r.label}</Text>
                      </Press>
                    ))}
                  </View>
                )}
              </View>
            )}
            {v.nearRadiusShown && (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {v.nearRadii.map((r) => <Pill key={r.name} label={r.name} on={r.on} onPress={r.pick} />)}
                </ScrollView>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="near_me" size={14} color={C.primary} />
                  <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONTS[600], fontSize: 12, color: C.muted }}>{v.nearSummary}</Text>
                </View>
              </>
            )}
          </>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 2, paddingBottom: 10 }}>
          {v.filters.map((f) => <Pill key={f.name} label={f.name} on={f.on} onPress={f.pick} />)}
        </ScrollView>
      </View>

      {v.isMapView ? (
        <View style={{ flex: 1, margin: 20, marginTop: 2, borderRadius: 24, overflow: 'hidden' }}>
          <ItemsMap
            pins={v.mapPins} selectedKey={v.mapSelectedKey} color={v.mapColor} center={v.mapCenter}
            onSelect={v.mapSelect} onBoundsChange={v.mapMoved} onLocate={v.nearMe} locating={v.nearLocating}
          />
          <View pointerEvents="none" style={{ position: 'absolute', left: 12, top: 12, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, ...GLASS }}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 11.5, color: C.ink }}>
              {v.mapLoading ? 'Loading…' : `${v.mapCount}${v.mapCount >= 200 ? '+' : ''} in view${v.mapCount >= 200 ? ' · zoom in for more' : ''}`}
            </Text>
          </View>
          {v.mapCard && (
            <Animated.View entering={rise(0)} style={[{ position: 'absolute', left: 12, right: 12, bottom: 12, padding: 12, paddingTop: 8, borderRadius: 28, ...GLASS, backgroundColor: 'rgba(255,255,255,.96)' }, SHADOW.card]}>
              <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: C.fill, marginBottom: 8 }} />
              <ItemCard item={v.mapCard} onPress={v.mapCard.open} />
              <Press style={{ minHeight: 46, borderRadius: 23, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}
                scale={0.97} onPress={v.mapCard.open}>
                <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.white }}>View details</Text>
              </Press>
            </Animated.View>
          )}
        </View>
      ) : (
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 2, paddingBottom: 28, gap: 10 }}>
        <LoadGate status={v.loads.registry} onRetry={v.retry.registry} what="items" />
        {!reloading && v.registry.map((it, n) => (
          <Animated.View key={it.id} entering={rise(n)} style={{ gap: 10 }}>
            <ItemCard item={it} onPress={it.open} />
            {it.adAfter ? <AdSlot ad={v.adFeed} /> : null}
          </Animated.View>
        ))}
        {!reloading && v.registryHasMore && (
          <Press style={{ minHeight: 48, borderRadius: 24, ...GLASS, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
            scale={0.97} onPress={v.loadMoreRegistry}>
            {v.registryLoadingMore
              ? <Loader size={10} />
              : <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.primary }}>Load more</Text>}
          </Press>
        )}
        {v.myPostsEmpty && (
          <Empty icon="inbox" title="You have not posted yet"
            body="Anything you report will show up here so you can track and close it." />
        )}
        {v.registryEmpty && (
          <Empty icon="search_off" title={v.nearActive ? `Nothing ${v.nearSummary.toLowerCase()}` : 'Nothing matches that'}
            body={v.nearActive ? 'Try a bigger radius, another place, or switch to Anywhere.' : 'Try a different word, or clear the filter to see the whole registry.'} />
        )}
      </ScrollView>
      )}
    </View>
  );
}
