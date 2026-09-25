import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useApp } from '../StoreProvider';
import { C, FONTS, SHADOW } from '../theme/tokens';
import { Field } from '../ui/Field';
import { AdSlot } from '../ui/AdSlot';
import { ItemCard } from '../ui/ItemCard';
import { Empty, Pill, Seg } from '../ui/bits';

export function Registry() {
  const { store, vals: v } = useApp();
  const st = store.state;

  // Re-fetch whenever screen/filter changes; debounce the search box so we
  // don't fire a request per keystroke. No-ops in demo mode (see loadRegistry).
  useEffect(() => {
    store.loadRegistry();
  }, [store, st.screen, st.filter, st.authMode]);

  useEffect(() => {
    const id = setTimeout(() => store.loadRegistry(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.q]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        <View style={[{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 24, backgroundColor: C.fill }]}>
          <Seg label="Lost" on={v.regIsLost} onPress={v.goLost} />
          <Seg label="Found" on={v.regIsFound} onPress={v.goFound} />
        </View>
        <Field icon="search" value={v.q} onChange={v.onQuery} placeholder="Search title, place or reference" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 2, paddingBottom: 10 }}>
          {v.filters.map((f) => <Pill key={f.name} label={f.name} on={f.on} onPress={f.pick} />)}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 2, paddingBottom: 28, gap: 10 }}>
        {v.registry.map((it) => (
          <View key={it.id} style={{ gap: 10 }}>
            <ItemCard item={it} onPress={it.open} />
            {it.adAfter ? <AdSlot ad={v.adFeed} /> : null}
          </View>
        ))}
        {v.myPostsEmpty && (
          <Empty icon="inbox" title="You have not posted yet"
            body="Anything you report will show up here so you can track and close it." />
        )}
        {v.registryEmpty && (
          <Empty icon="search_off" title="Nothing matches that"
            body="Try a different word, or clear the filter to see the whole registry." />
        )}
      </ScrollView>
    </View>
  );
}
