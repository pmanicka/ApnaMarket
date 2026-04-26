import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function PendingApprovalScreen() {
  const { signOut, refreshProfile, profile } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    await refreshProfile();
    setIsChecking(false);
    // The auth gate in _layout.tsx will auto-redirect if approved
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.bgAccent} />
      <View style={styles.bgAccent2} />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>⏳</Text>
        </View>

        <Text style={styles.title}>Awaiting Approval</Text>
        <Text style={styles.subtitle}>
          Your registration for{'\n'}
          <Text style={styles.highlight}>
            {profile?.community_id ? 'your community' : 'ApnaMarket'}
          </Text>
          {'\n'}is under review.
        </Text>

        <View style={styles.stepsCard}>
          <View style={styles.step}>
            <View style={[styles.stepDot, styles.stepDotDone]}>
              <Text style={styles.stepDotText}>✓</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Phone Verified</Text>
              <Text style={styles.stepDesc}>Your mobile number is confirmed.</Text>
            </View>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={[styles.stepDot, styles.stepDotDone]}>
              <Text style={styles.stepDotText}>✓</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Profile Submitted</Text>
              <Text style={styles.stepDesc}>Details sent to community admin.</Text>
            </View>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={[styles.stepDot, styles.stepDotPending]}>
              <Text style={styles.stepDotPendingText}>3</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Admin Approval</Text>
              <Text style={styles.stepDesc}>Waiting for your community admin to approve your account.</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.refreshBtn, isChecking && styles.refreshBtnDisabled]}
          onPress={handleCheckStatus}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator color="#FF6B35" />
          ) : (
            <Text style={styles.refreshBtnText}>🔄  Check Approval Status</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          You'll be let in automatically once approved.{'\n'}Tap the button above to refresh.
        </Text>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out & use a different number</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ORANGE = '#FF6B35';
const BG = '#0F0F1A';
const CARD_BG = '#1A1A2E';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  bgAccent: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: ORANGE, opacity: 0.05, top: -80, right: -80,
  },
  bgAccent2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#7C3AED', opacity: 0.05, bottom: 120, left: -60,
  },
  content: {
    flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center',
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: CARD_BG, borderWidth: 2, borderColor: ORANGE,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 28,
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  iconEmoji: { fontSize: 44 },
  title: {
    fontSize: 30, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -0.5, marginBottom: 12, textAlign: 'center',
  },
  subtitle: {
    fontSize: 16, color: '#9CA3AF', textAlign: 'center',
    lineHeight: 26, marginBottom: 36,
  },
  highlight: { color: ORANGE, fontWeight: '700' },

  stepsCard: {
    width: '100%', backgroundColor: CARD_BG, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER, padding: 20, marginBottom: 28,
  },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotDone: { backgroundColor: '#10B981' },
  stepDotText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  stepDotPending: { backgroundColor: 'rgba(255,107,53,0.15)', borderWidth: 2, borderColor: ORANGE },
  stepDotPendingText: { color: ORANGE, fontSize: 14, fontWeight: '800' },
  stepLine: {
    width: 2, height: 20, backgroundColor: BORDER,
    marginLeft: 15, marginVertical: 4,
  },
  stepInfo: { flex: 1, paddingTop: 4 },
  stepTitle: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  stepDesc: { color: '#9CA3AF', fontSize: 12, lineHeight: 18 },

  refreshBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: ORANGE,
    backgroundColor: 'rgba(255,107,53,0.08)',
    alignItems: 'center', marginBottom: 16,
  },
  refreshBtnDisabled: { opacity: 0.6 },
  refreshBtnText: { color: ORANGE, fontSize: 15, fontWeight: '700' },

  note: { color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 28 },

  signOutBtn: { paddingVertical: 10 },
  signOutText: { color: '#4B5563', fontSize: 13, textDecoration: 'underline' } as any,
});
