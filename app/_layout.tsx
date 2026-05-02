import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// ─── Auth Guard ───────────────────────────────────────────────────────────────
function AuthGate() {
  const { session, profile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  // Initialize Push Notifications once authenticated
  usePushNotifications();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';
    const inAdmin = segments[0] === 'admin';

    if (!session && !inAuthGroup) {
      // Not signed in → go to login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Signed in — check profile state
      if (!profile) return; // still loading profile

      const seg = segments as string[];
      if (!profile.name) {
        // New user — needs to complete onboarding
        if (seg[1] !== 'onboarding') router.replace('/(auth)/onboarding');
      } else if (!profile.is_approved) {
        // Registered but not yet approved
        if (seg[1] !== 'pending') router.replace('/(auth)/pending');
      } else {
        // Fully approved — go to main app
        router.replace('/(tabs)');
      }
    } else if (session && !inAuthGroup && !inAdmin) {
      // Signed in, in the app — verify they are still approved
      if (profile && !profile.is_approved) {
        router.replace('/(auth)/pending');
      }
    }
  }, [session, profile, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return null;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="listing/[id]"
          options={{ headerShown: true, title: '' }}
        />
      </Stack>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
