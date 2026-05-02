import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const formatPhoneNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits}`;
  };

  const handleSendOTP = async () => {
    const trimmed = phone.trim();
    if (trimmed.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const formatted = formatPhoneNumber(trimmed);
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone: formatted,
      options: {
        channel: 'whatsapp',
      }
    });

    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    router.push({ pathname: '/(auth)/otp', params: { phone: formatted } });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      <View style={styles.bgAccent} />
      <View style={styles.bgAccent2} />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🏘️</Text>
          </View>
          <Text style={styles.brandName}>ApnaMarket</Text>
          <Text style={styles.tagline}>Your apartment's own mini-mall</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back!</Text>
          <Text style={styles.cardSubtitle}>
            Enter your mobile number to get started
          </Text>

          <View style={styles.inputWrapper}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇮🇳  +91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor="#6B7280"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              returnKeyType="done"
              onSubmitEditing={handleSendOTP}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP →</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>

        <View style={styles.trustRow}>
          <Text style={styles.trustItem}>🔒 Verified Neighbors</Text>
          <Text style={styles.trustItem}>🏠 Your Community</Text>
          <Text style={styles.trustItem}>⚡ Instant Connect</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const ORANGE = '#FF6B35';
const ORANGE_DARK = '#E85A24';
const BG = '#0F0F1A';
const CARD_BG = '#1A1A2E';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  bgAccent: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: ORANGE, opacity: 0.06, top: -80, right: -80 },
  bgAccent2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#7C3AED', opacity: 0.06, bottom: 120, left: -60 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 36 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: ORANGE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  logoEmoji: { fontSize: 38 },
  brandName: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' },
  card: { backgroundColor: CARD_BG, borderRadius: 24, padding: 28, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12121F', borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, marginBottom: 20, overflow: 'hidden' },
  countryCode: { paddingHorizontal: 14, paddingVertical: 16, borderRightWidth: 1, borderRightColor: BORDER, backgroundColor: '#16162A' },
  countryCodeText: { color: '#D1D5DB', fontSize: 15, fontWeight: '600' },
  input: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 16, letterSpacing: 1.5 },
  button: { backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16, shadowColor: ORANGE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  disclaimer: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  link: { color: ORANGE, fontWeight: '600' },
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, paddingHorizontal: 4 },
  trustItem: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
});
