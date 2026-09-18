import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
  PublicSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/public-sans';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from '@expo-google-fonts/ibm-plex-mono';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import theme from '@/theme/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Loading } from '@/components/ui';
import { colors } from '@/theme/tokens';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, profile, initialising, profileResolved } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initialising) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      // The role decides the destination, so wait for it. Signing in sets
      // the session synchronously while the profile fetch is still in
      // flight, so routing on `profile` alone sent every admin to the
      // member app - and this effect would not correct it afterwards,
      // because by then the group is no longer (auth).
      if (!profileResolved) return;
      // Admins land in the control app, members in the community app.
      router.replace(profile?.role === 'admin' ? '/(admin)' : '/(tabs)');
    }
  }, [session, profile, profileResolved, initialising, segments, router]);

  if (initialising) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Loading label="Starting up…" />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  // The prototype is set in Public Sans with IBM Plex Mono for codes and
  // eyebrows. Rendering before they load would flash the system font and
  // reflow every headline, so hold the first paint until they are ready.
  const [fontsLoaded] = useFonts({
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
    PublicSans_800ExtraBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <SafeAreaProvider>
        <AuthProvider>
          <AuthGate>
            <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="item/[id]" options={{ headerShown: true, title: 'Item', headerBackTitle: 'Back' }} />
          </Stack>
          </AuthGate>
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
