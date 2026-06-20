import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface SupabaseExtra {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

function readSupabaseConfig(): { url: string; anonKey: string } | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as Partial<SupabaseExtra>;
  const url = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const anonKey = extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

/**
 * Whether account-based sync is configured. When false, the app runs fully
 * offline with local-only history/favourites and no auth UI should be shown.
 */
export function isSupabaseConfigured(): boolean {
  return readSupabaseConfig() !== null;
}

// SecureStore values are capped at ~2KB; Supabase sessions fit comfortably.
// On web (not a target, but keeps types/SSR-safe) fall back to in-memory.
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

let client: SupabaseClient | null = null;

/**
 * Returns the shared Supabase client, or null when Supabase is not configured.
 * Callers should guard on null (or use `isSupabaseConfigured`).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (client) {
    return client;
  }

  const config = readSupabaseConfig();
  if (!config) {
    return null;
  }

  client = createClient(config.url, config.anonKey, {
    auth: {
      storage: Platform.OS === 'web' ? undefined : secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      // We use native Sign in with Apple + email OTP, not URL-based magic links,
      // so there is no session to detect in an inbound URL.
      detectSessionInUrl: false,
    },
  });

  return client;
}
