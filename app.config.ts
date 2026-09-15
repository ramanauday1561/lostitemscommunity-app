import type { ExpoConfig } from 'expo/config';

// The Supabase URL and publishable key are safe to commit: the publishable
// key only ever grants what Row Level Security allows. Override them with
// EXPO_PUBLIC_* environment variables for a different environment.
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://rxplhljuaqdpghvarjbb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_jyjxzLjsC4GZfGrnfup4Sw_Nu1gscpS';

// Set once the Expo project exists (expo.dev -> project -> Overview -> ID).
// EAS_PROJECT_ID overrides it in CI.
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? '';

const config: ExpoConfig = {
  name: 'Lost Items Community',
  slug: 'lostitemscommunity-app',
  // The EAS project lives under an organisation account, so owner must be
  // set explicitly or the CLI resolves against a personal account instead.
  owner: 'ramanauday1561s-team',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'lostitems',
  userInterfaceStyle: 'light',
  // Fingerprint means EAS derives the runtime version from the native
  // dependency set, so an update can never land on a build it is
  // incompatible with. Adding a native module simply requires a new build.
  runtimeVersion: { policy: 'fingerprint' },
  updates: EAS_PROJECT_ID
    ? { url: `https://u.expo.dev/${EAS_PROJECT_ID}` }
    : undefined,
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
    'expo-updates',
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
  // Set only for the web preview, which is served from a subdirectory on
  // GitHub Pages. Native builds leave it unset and use absolute paths.
  experiments: process.env.EXPO_WEB_BASE_URL
    ? { baseUrl: process.env.EXPO_WEB_BASE_URL }
    : undefined,
  extra: {
    supabaseUrl: SUPABASE_URL,
    supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY,
    eas: EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined,
  },
};

export default config;
