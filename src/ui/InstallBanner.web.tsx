import { useEffect, useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { C, FONTS, SHADOW, GLASS } from '../theme/tokens';
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
export function InstallBanner() {
  const [mode, setMode] = useState<InstallMode>(null);
  const [steps, setSteps] = useState(false);
  const [copied, setCopied] = useState(false);
  const deferred = useRef<PromptEvent | null>(null);

  useEffect(() => {
    // The service worker is what makes Chrome treat the site as installable (and is where web push will live).
    navigator.serviceWorker?.register('/sw.js').catch(() => {});

    // ?install=1 on the address forces the banner (ignores a past dismissal), to see it or check it on a device.
    const forced = new URLSearchParams(window.location.search).has('install');
    const evaluate = () => setMode(installMode({
      standalone: isStandalone(),
      snoozed: !forced && isSnoozed(dismissedAt(), Date.now()),
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

  const ios = mode === 'ios';
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.origin); setCopied(true); } catch { /* the link is in the address bar anyway */ }
  };

  // In the page flow, above the header, so it pushes the app down instead of covering it.
  return (
    <View
      accessibilityRole="alert"
      style={[{ marginHorizontal: 12, marginBottom: 8, ...GLASS, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 12 }, SHADOW.card]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Image source={{ uri: '/icon-192.png' }} style={{ width: 38, height: 38, borderRadius: 10 }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: FONTS[700], fontSize: 13.5, color: C.ink }}>Install Lost Items</Text>
          <Text numberOfLines={1} style={{ fontFamily: FONTS[400], fontSize: 11.5, color: C.subtle, marginTop: 1 }}>
            {ios ? 'Add it to your Home Screen' : 'One tap, opens full screen'}
          </Text>
        </View>
        <Press
          style={{ minHeight: 36, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}
          scale={0.96} onPress={install} accessibilityLabel={ios ? 'Show how to add to Home Screen' : 'Install the app'}
        >
          <Text style={{ fontFamily: FONTS[700], fontSize: 12.5, color: C.white }}>{ios ? 'How' : 'Install'}</Text>
        </Press>
        <Press style={{ width: 30, height: 36, alignItems: 'center', justifyContent: 'center' }} scale={0.9} onPress={dismiss} accessibilityLabel="Not now">
          <Icon name="close" size={18} color={C.subtle} />
        </Press>
      </View>
      {ios && steps && (
        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line, gap: 7 }}>
          <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, lineHeight: 18, color: C.ink }}>
            1. Open this page in Safari. In Brave, Chrome, Firefox or an app's built-in browser, tap the ⋯ menu and choose “Open in Safari”, or copy the link and paste it into Safari.
          </Text>
          <Press
            style={{ alignSelf: 'flex-start', minHeight: 34, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.fillSoft, justifyContent: 'center' }}
            scale={0.97} onPress={copyLink} accessibilityLabel="Copy the link"
          >
            <Text style={{ fontFamily: FONTS[600], fontSize: 12, color: C.primary }}>{copied ? 'Link copied' : 'Copy link'}</Text>
          </Press>
          <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, lineHeight: 18, color: C.ink }}>2. In Safari, tap the Share button (the square with an arrow).</Text>
          <Text style={{ fontFamily: FONTS[600], fontSize: 12.5, lineHeight: 18, color: C.ink }}>3. Scroll down, tap “Add to Home Screen”, then Add.</Text>
        </View>
      )}
    </View>
  );
}
