import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ─── Platform-aware storage adapter for Supabase session persistence ──────────
// Uses expo-secure-store on native (iOS/Android) and localStorage on web
const ExpoSecureStoreAdapter = Platform.OS === 'web'
  ? {
      getItem: (key: string) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch {
          return Promise.resolve(null);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {}
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {}
        return Promise.resolve();
      },
    }
  : {
      getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
      },
      setItem: (key: string, value: string) => {
        SecureStore.setItemAsync(key, value);
      },
      removeItem: (key: string) => {
        SecureStore.deleteItemAsync(key);
      },
    };


// ─── Supabase client ──────────────────────────────────────────────────────────
// Replace these with your actual Supabase project values
// See .env.example for instructions
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  Supabase env vars missing. Copy .env.example → .env and fill in your project URL and anon key.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
