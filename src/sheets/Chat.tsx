import { useEffect, useRef } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useApp, useVals } from '../StoreProvider';
import { C, FONTS, MONO } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';
import { Avatar } from '../ui/bits';

function Bubble({ m }: { m: { text: string; time: string; mine: boolean } }) {
  return (
    <View style={{ alignItems: m.mine ? 'flex-end' : 'flex-start', gap: 4 }}>
      <View style={{
        maxWidth: '78%', paddingVertical: 12, paddingHorizontal: 15,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        borderBottomRightRadius: m.mine ? 6 : 20, borderBottomLeftRadius: m.mine ? 20 : 6,
        backgroundColor: m.mine ? C.primary : C.bg,
      }}>
        <Text style={{ fontFamily: FONTS[500], fontSize: 14, lineHeight: 22, color: m.mine ? C.white : C.ink }}>{m.text}</Text>
      </View>
      <Text style={{ fontFamily: MONO[500], fontSize: 10, color: C.lighter, paddingHorizontal: 4 }}>{m.time}</Text>
    </View>
  );
}

function Composer({ value, onChange, onSend, placeholder }: {
  value: string; onChange: (v: string) => void; onSend: () => void; placeholder: string;
}) {
  const on = !!value.trim();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, minHeight: 52, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.fillSoft }}>
        <TextInput
          value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.faint}
          onSubmitEditing={onSend} returnKeyType="send"
          style={{ fontFamily: FONTS[500], fontSize: 14, color: C.ink, outlineStyle: 'none' } as object}
        />
      </View>
      <Press style={{
        width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        backgroundColor: on ? C.primary : C.fill,
        ...(on ? { boxShadow: '0 10px 22px -10px rgba(11,107,203,.85)' } : null),
      }} scale={0.94} disabled={!on} onPress={onSend}>
        <Icon name="send" size={21} color={on ? C.white : C.lighter} />
      </Press>
    </View>
  );
}

/** Shared sheet frame for the three conversation-style sheets. */
function ChatFrame({ header, children, footer }: {
  header: React.ReactNode; children: React.ReactNode; footer: React.ReactNode;
}) {
  const { store } = useApp();
  const v = useVals();
  const ref = useRef<ScrollView>(null);
  useEffect(() => { store.chatRef = ref; return () => { store.chatRef = null; }; }, [store]);

  return (
    <>
      <Press style={{ position: 'absolute', inset: 0, zIndex: 45, backgroundColor: 'rgba(16,19,25,.42)' } as object}
        scale={1} onPress={v.closeSheet} />
      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: 60, zIndex: 50,
        backgroundColor: C.white, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        boxShadow: '0 -20px 60px -20px rgba(16,19,25,.6)',
      }}>
        <View style={{ padding: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.fill }}>{header}</View>
        <ScrollView ref={ref} contentContainerStyle={{ padding: 18, gap: 14 }}>{children}</ScrollView>
        <View style={{ padding: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.fill, gap: 10 }}>{footer}</View>
      </View>
    </>
  );
}

export function ChatSheet() {
  const v = useVals();
  return (
    <ChatFrame
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <Avatar text={v.chatIni} size={40} bg={C.bg} color={C.ink} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 14.5, color: C.ink }}>{v.chatWith}</Text>
            <Text numberOfLines={1} style={{ fontFamily: FONTS[400], fontSize: 11.5, color: C.subtle, marginTop: 2 }}>
              {v.chatItem} · {v.chatItemId}
            </Text>
          </View>
          <Press style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
            scale={0.92} activeBg={C.fill} onPress={v.closeSheet}>
            <Icon name="close" size={22} color={C.ink} />
          </Press>
        </View>
      }
      footer={
        <>
          {v.showQuickReplies && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {v.quickReplies.map((r) => (
                <Press key={r.label} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 40,
                  paddingHorizontal: 13, borderRadius: 999, backgroundColor: C.fillSoft,
                }} scale={0.95} onPress={r.send}>
                  <Icon name={r.icon} size={16} color={C.muted} />
                  <Text style={{ fontFamily: FONTS[600], fontSize: 12, color: C.muted }}>{r.label}</Text>
                </Press>
              ))}
            </ScrollView>
          )}
          <Composer value={v.draft} onChange={v.onDraft} onSend={v.sendMessage} placeholder="Write a message" />
        </>
      }
    >
      {v.messages.map((m, i) => <Bubble key={i} m={m} />)}
    </ChatFrame>
  );
}

export function SupportSheet() {
  const v = useVals();
  return (
    <ChatFrame
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(11,107,203,.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="support_agent" size={22} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 14.5, color: C.ink }}>Community Assistant</Text>
            <Text style={{ fontFamily: FONTS[400], fontSize: 11.5, color: C.success, marginTop: 2 }}>
              {v.botTyping ? 'Typing…' : 'Online'}
            </Text>
          </View>
          <Press style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
            scale={0.92} activeBg={C.fill} onPress={v.closeSheet}>
            <Icon name="close" size={22} color={C.ink} />
          </Press>
        </View>
      }
      footer={
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {v.faqChips.map((f) => (
              <Press key={f.q} style={{ minHeight: 40, paddingHorizontal: 13, borderRadius: 999, backgroundColor: C.fillSoft, justifyContent: 'center' }}
                scale={0.95} onPress={f.ask}>
                <Text style={{ fontFamily: FONTS[600], fontSize: 12, color: C.muted }}>{f.q}</Text>
              </Press>
            ))}
          </ScrollView>
          <Composer value={v.supportDraft} onChange={v.onSupportDraft} onSend={v.sendSupport} placeholder="Ask anything" />
          <Press style={{ minHeight: 40, alignItems: 'center', justifyContent: 'center' }} scale={0.98} onPress={v.escalate}>
            <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, color: C.primary }}>Talk to a human instead</Text>
          </Press>
        </>
      }
    >
      {v.supportMessages.map((m, i) => <Bubble key={i} m={m} />)}
      {v.botTyping && (
        <View style={{ alignSelf: 'flex-start', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 20, backgroundColor: C.bg }}>
          <Text style={{ fontFamily: FONTS[500], fontSize: 14, color: C.subtle }}>…</Text>
        </View>
      )}
    </ChatFrame>
  );
}

export function ThreadSheet() {
  const v = useVals();
  const t = v.thread as { title?: string; text?: string; user?: string; ini?: string; meta?: string; tag?: string; replyLabel?: string; suspendLabel?: string };
  return (
    <ChatFrame
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <Avatar text={t.ini || '?'} size={40} bg={C.bg} color={C.ink} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: FONTS[700], fontSize: 14.5, color: C.ink }}>{t.user}</Text>
            <Text style={{ fontFamily: FONTS[400], fontSize: 11.5, color: C.subtle, marginTop: 2 }}>{t.meta}</Text>
          </View>
          <Press style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
            scale={0.92} activeBg={C.fill} onPress={v.closeSheet}>
            <Icon name="close" size={22} color={C.ink} />
          </Press>
        </View>
      }
      footer={
        <>
          {v.isAdmin ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Press style={{ flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: C.fillSoft, alignItems: 'center', justifyContent: 'center' }}
                scale={0.97} onPress={v.suspendThread}>
                <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.ink }}>{t.suspendLabel}</Text>
              </Press>
              <Press style={{ flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: 'rgba(180,35,24,.1)', alignItems: 'center', justifyContent: 'center' }}
                scale={0.97} onPress={v.deleteThread}>
                <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.danger }}>Delete post</Text>
              </Press>
            </View>
          ) : (
            <Composer value={v.replyDraft} onChange={v.onReplyDraft} onSend={v.sendReply} placeholder="Write a reply" />
          )}
        </>
      }
    >
      <Text style={{ fontFamily: FONTS[800], fontSize: 19, lineHeight: 25, letterSpacing: -0.4, color: C.ink }}>{t.title}</Text>
      <Text style={{ fontFamily: FONTS[400], fontSize: 14, lineHeight: 22, color: C.muted }}>{t.text}</Text>
      <Text style={{ fontFamily: FONTS[600], fontSize: 11.5, color: C.subtle }}>{t.replyLabel}</Text>
      {v.threadReplies.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 11 }}>
          <Avatar text={r.ini} size={34} bg={C.bg} color={C.ink} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Text style={{ fontFamily: FONTS[700], fontSize: 12.5, color: C.ink }}>{r.user}</Text>
              <Text style={{ fontFamily: MONO[500], fontSize: 10, color: C.lighter }}>{r.time}</Text>
            </View>
            <Text style={{ fontFamily: FONTS[400], fontSize: 13, lineHeight: 20, color: C.muted, marginTop: 4 }}>{r.text}</Text>
          </View>
        </View>
      ))}
      {v.noReplies && (
        <Text style={{ fontFamily: FONTS[400], fontSize: 12.5, color: C.subtle }}>No replies yet — be the first.</Text>
      )}
    </ChatFrame>
  );
}
