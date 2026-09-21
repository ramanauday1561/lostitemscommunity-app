import '../global.css';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HeroUINativeProvider } from 'heroui-native';

const TITLE = 'Lost Items Community';

export default function RootLayout() {
  // React Navigation rewrites document.title from the focused route once it
  // hydrates, which blanks the title set in +html.tsx. This layout is the
  // parent, so its effect runs last and wins; the observer re-asserts the
  // title if navigation sets it again later.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const apply = () => { if (document.title !== TITLE) document.title = TITLE; };
    apply();
    const titleEl = document.querySelector('title');
    if (!titleEl) return;
    const observer = new MutationObserver(apply);
    observer.observe(titleEl, { childList: true });
    return () => observer.disconnect();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HeroUINativeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: TITLE }} />
          </Stack>
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
