import { useEffect, useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { C, FONTS, SHADOW } from '../theme/tokens';
import { installMode, isIos, isSnoozed, type InstallMode } from '../lib/installLogic';
import { Icon } from './Icon';
import { Press } from './Press';

const DISMISSED_KEY = 'install-banner-dismissed';

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

function dismissedAt(): number | null {
  try { return Number(window.localStorage.getItem(DISMISSED_KEY)) || null; } catch { return null; }
}

function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Offers to install the app as soon as someone visits: a one-tap Install where the browser allows it (Android,
 *  desktop Chrome/Edge), and the "Share -> Add to Home Screen" steps on iPhone, where no browser can install for you.
 *  Never shown inside the installed app, and a dismissal keeps it away for a week. */
export function InstallBanner({ bottom, top }: { bottom?: number; top?: number }) {
  const [mode, setMode] = useState<InstallMode>(null);
  const [steps, setSteps] = useState(false);
  const deferred = useRef<PromptEvent | null>(null);

  useEffect(() => {
    // The service worker is what makes Chrome treat the site as installable (and is where web push will live).
    navigator.serviceWorker?.register('/sw.js').catch(() => {});

    const evaluate = () => setMode(installMode({
      standalone: isStandalone(),
      snoozed: isSnoozed(dismissedAt(), Date.now()),
      ios: isIos(navigator.userAgent, navigator.platform, navigator.maxTouchPoints ?? 0),
      canPrompt: !!deferred.current,
    }));
    const onPrompt = (e: Event) => { e.preventDefault(); deferred.current = e as PromptEvent; evaluate(); };
    const onInstalled = () => { deferred.current = null; setMode(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const t = setTimeout(evaluate, 1500); // let the first screen settle before asking
    return () => {
      clearTimeout(t);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!mode) return null;

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch { /* the banner just returns next visit */ }
    setMode(null);
  };
  const install = async () => {
    if (mode === 'ios') { setSteps((s) => !s); return; }
    const evt = deferred.current;
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice.catch(() => undefined);
    deferred.current = null;
    setMode(null);
  };

  return (
    <View
      accessibilityRole="alert"
      style={[{
        position: 'absolute', left: 12, right: 12, ...(top != null ? { top } : { bottom }), zIndex: 40, backgroundColor: C.white, borderRadius: 22, padding: 14,
      }, SHADOW.card]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Image source={{ uri: '/icon-192.png' }} style={{ width: 44, height: 44, borderRadius: 12 }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONTS[700], fontSize: 14, color: C.ink }}>Add Lost Items to your Home Screen</Text>
          <Text style={{ fontFamily: FONTS[400], fontSize: 12, lineHeight: 17, color: C.subtle, marginTop: 2 }}>
            Opens full screen, one tap away.
          </Text>
        </View>
        <Press
          style={{ minHeight: 40, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}
          scale={0.96} onPress={install} accessibilityLabel={mode === 'ios' ? 'Show how to add to Home Screen' : 'Install the app'}
        >
          <Text style={{ fontFamily: FONTS[700], fontSize: 13, color: C.white }}>{mode === 'ios' ? 'How' : 'Install'}</Text>
        </Press>
        <Press style={{ width: 32, height: 40, alignItems: 'center', justifyContent: 'center' }} scale={0.9} onPress={dismiss} accessibilityLabel="Not now">
          <Icon name="close" size={18} color={C.subtle} />
        </Press>
      </View>
      {mode === 'ios' && steps && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line, gap: 8 }}>
          <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, lineHeight: 18, color: C.ink }}>1. Tap the Share button (the square with an arrow) in your browser's bar.</Text>
          <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, lineHeight: 18, color: C.ink }}>2. Scroll down and tap “Add to Home Screen”.</Text>
          <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, lineHeight: 18, color: C.ink }}>3. Tap Add. The icon appears on your Home Screen.</Text>
        </View>
      )}
    </View>
  );
}
