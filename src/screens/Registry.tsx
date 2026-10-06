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

/** 46px round icon button; `badge` shows a count when something is switched on. */
function RoundButton({ icon, label, onPress, badge = 0 }: { icon: string; label: string; onPress: () => void; badge?: number }) {
  return (
    <Press style={[{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', ...GLASS }, SHADOW.card]}
      scale={0.93} onPress={onPress} accessibilityLabel={label}>
      <Icon name={icon} size={22} color={C.ink} />
      {badge > 0 && (
        <View style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 10, color: C.white }}>{badge}</Text>
        </View>
      )}
    </Press>
  );
}

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
      <View style={{ paddingHorizontal: 20, gap: 10, paddingBottom: 10 }}>
        <View style={[{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 24, backgroundColor: C.fill }]}>
          <Seg label="Lost" on={v.regIsLost} onPress={v.goLost} />
          <Seg label="Found" on={v.regIsFound} onPress={v.goFound} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Field icon="search" value={v.q} onChange={v.onQuery} placeholder="Search items or places" compact />
          </View>
          <RoundButton icon="tune" label="Filters" onPress={v.openFilters} badge={v.filterCount} />
          <RoundButton icon={v.isMapView ? 'view_list' : 'map'} label={v.isMapView ? 'Show list' : 'Show map'} onPress={v.isMapView ? v.showList : v.showMap} />
        </View>
        {v.filterChips.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {v.filterChips.map((c) => (
              <Press key={c.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 34, paddingLeft: 14, paddingRight: 10, borderRadius: 17, backgroundColor: 'rgba(11,107,203,.1)' }}
                scale={0.96} onPress={c.clear} accessibilityLabel={`Remove filter ${c.label}`}>
                <Text numberOfLines={1} style={{ maxWidth: 220, fontFamily: FONTS[600], fontSize: 12.5, color: C.primary }}>{c.label}</Text>
                <Icon name="close" size={15} color={C.primary} />
              </Press>
            ))}
          </ScrollView>
        )}
      </View>

      {v.isMapView ? (
        <View style={{ flex: 1, minHeight: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
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
