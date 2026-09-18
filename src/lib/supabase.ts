import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = String(extra.supabaseUrl ?? '');
const supabaseKey = String(extra.supabasePublishableKey ?? '');

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase config missing. Check the `extra` block in app.config.ts, ' +
      'or set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Native has no URL to parse, and leaving this on causes a startup
    // warning. On web it is required: after an OAuth redirect the session
    // arrives in the URL, and with this off the sign-in silently does
    // nothing.
    detectSessionInUrl: Platform.OS === 'web',
    // PKCE is what makes exchangeCodeForSession work for the native OAuth
    // flow, where the redirect comes back to the app's own scheme.
    flowType: 'pkce',
  },
});

// Supabase only refreshes tokens while the app is in the foreground. Without
// this the session can silently go stale after the app has been backgrounded.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});

