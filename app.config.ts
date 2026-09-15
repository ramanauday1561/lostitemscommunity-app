import type { ExpoConfig } from 'expo/config';

// The Supabase URL and publishable key are safe to commit: the publishable
// key only ever grants what Row Level Security allows. Override them with
// EXPO_PUBLIC_* environment variables for a different environment.
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://rxplhljuaqdpghvarjbb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_jyjxzLjsC4GZfGrnfup4Sw_Nu1gscpS';

const config: ExpoConfig = {
  name: 'Lost Items Community',
  slug: 'lostitemscommunity-app',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'lostitems',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.lostitemscommunity.app',
  },
  android: {
    package: 'com.lostitemscommunity.app',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#F7F7F5',
    },
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    [
      'expo-image-picker',
      {
        photosPermission:
          'Lost Items Community uses your photos so you can add pictures to a lost or found report.',
        cameraPermission:
          'Lost Items Community uses your camera so you can photograph an item you have found.',
      },
    ],
  ],
  extra: {
    supabaseUrl: SUPABASE_URL,
    supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY,
  },
};

export default config;
