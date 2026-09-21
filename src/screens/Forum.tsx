import { ScrollView, Text, View } from 'react-native';
import { useVals } from '../StoreProvider';
import { C, FONTS, SHADOW } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { AdSlot } from '../ui/AdSlot';
import { Avatar, Chip, Empty } from '../ui/bits';
import { Pill } from '../ui/bits';

export function Forum() {
  const v = useVals();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 2, paddingBottom: 14 }}>
          {v.topics.map((t) => <Pill key={t.name} label={t.name} on={t.on} onPress={t.pick} />)}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 14, paddingBottom: 28, gap: 12 }}>
        <AdSlot ad={v.adForum} />
        {v.threads.map((t) => (
          <View key={t.id} style={[{
            backgroundColor: C.white, borderRadius: 26, padding: 18,
            opacity: t.suspended ? 0.72 : 1,
          }, t.suspended ? { boxShadow: 'inset 0 0 0 1px rgba(180,35,24,.25), 0 1px 2px rgba(22,24,31,.05)' } : SHADOW.card]}>
            <Press scale={0.995} onPress={t.open}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar text={t.ini} size={38} bg={C.bg} color={C.ink} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.ink }}>{t.user}</Text>
                  <Text style={{ fontFamily: FONTS[400], fontSize: 11, color: C.subtle, marginTop: 2 }}>{t.meta}</Text>
                </View>
                <Chip status={t.tag} />
              </View>
              <Text style={{ fontFamily: FONTS[700], fontSize: 15, lineHeight: 21, color: C.ink, marginTop: 12 }}>{t.title}</Text>
              <Text style={{ fontFamily: FONTS[400], fontSize: 13, lineHeight: 20, color: C.muted, marginTop: 6 }}>{t.text}</Text>
            </Press>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <Press style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingRight: 10 }} scale={0.96} onPress={t.open}>
                <Icon name="forum" size={17} color={C.subtle} />
                <Text style={{ fontFamily: FONTS[600], fontSize: 12, color: C.subtle }}>{t.replyLabel}</Text>
              </Press>
              {!t.isAdmin && (
                <Press style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 10 }} scale={0.96} onPress={t.helpful}>
                  <Icon name="thumb_up" size={16} color={C.subtle} />
                  <Text style={{ fontFamily: FONTS[600], fontSize: 12, color: C.subtle }}>Helpful</Text>
                </Press>
              )}
              {t.isAdmin && (
                <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
                  <Press style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.fillSoft, justifyContent: 'center' }}
                    scale={0.96} onPress={t.suspend}>
                    <Text style={{ fontFamily: FONTS[700], fontSize: 11.5, color: C.ink }}>{t.suspendLabel}</Text>
                  </Press>
                  <Press style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(180,35,24,.1)', justifyContent: 'center' }}
                    scale={0.96} onPress={t.remove}>
                    <Text style={{ fontFamily: FONTS[700], fontSize: 11.5, color: C.danger }}>Delete</Text>
                  </Press>
                </View>
              )}
            </View>
          </View>
        ))}
        {v.threadsEmpty && (
          <Empty icon="forum" title="No posts in this topic" body="Switch topic, or start the conversation yourself." />
        )}
      </ScrollView>

      {v.canPost && (
        <Press style={[{
          position: 'absolute', right: 20, bottom: 20, height: 52, paddingHorizontal: 18,
          borderRadius: 18, backgroundColor: C.ink, flexDirection: 'row', alignItems: 'center', gap: 8,
        }, SHADOW.pillOn]} scale={0.96} onPress={v.openNewThread}>
          <Icon name="edit" size={19} color={C.white} />
          <Text style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.white }}>New post</Text>
        </Press>
      )}
    </View>
  );
}
