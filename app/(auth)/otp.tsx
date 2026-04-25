import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { StatusBar } from 'expo-status-bar';

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && newDigits.every((d) => d !== '')) {
      verifyOTP(newDigits.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (otp: string) => {
    if (isVerifying) return;
    setIsVerifying(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone ?? '',
      token: otp,
      type: 'sms',
    });

    if (error) {
      setIsVerifying(false);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      Alert.alert('Wrong OTP', 'The code you entered is incorrect. Please try again.');
      return;
    }

    setIsVerifying(false);

    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('name')
        .eq('id', data.user.id)
        .single();

      if (!profile?.name) {
        router.replace('/(auth)/onboarding');
      }
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone: phone ?? '',
    });

    setIsResending(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setCountdown(30);
    setDigits(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    Alert.alert('OTP Sent', 'A new code has been sent to your phone.');
  };

  const maskedPhone = phone
    ? phone.replace(/(\+\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 *** $4')
    : '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      <View style={styles.bgAccent} />

      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>💬</Text>
          </View>
          <Text style={styles.title}>Verify Your Number</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
          </Text>
        </View>

        <View style={styles.otpRow}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              style={[
                styles.otpBox,
                digits[i] ? styles.otpBoxFilled : null,
              ]}
              maxLength={1}
              keyboardType="number-pad"
              value={digits[i]}
              onChangeText={(text) => handleDigitChange(text, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              selectTextOnFocus
              caretHidden
              autoFocus={i === 0}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (isVerifying || digits.some((d) => !d)) && styles.buttonDisabled,
          ]}
          onPress={() => verifyOTP(digits.join(''))}
          disabled={isVerifying || digits.some((d) => !d)}
          activeOpacity={0.85}
        >
          {isVerifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive the code? </Text>
          {countdown > 0 ? (
            <Text style={styles.countdown}>Resend in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isResending}>
              {isResending ? (
                <ActivityIndicator size="small" color="#FF6B35" />
              ) : (
                <Text style={styles.resendLink}>Resend OTP</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.note}>
          💡 Check your SMS inbox. The code expires in 10 minutes.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const ORANGE = '#FF6B35';
const BG = '#0F0F1A';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  bgAccent: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: ORANGE, opacity: 0.05, top: -60, left: -60 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 32 },
  backText: { color: '#9CA3AF', fontSize: 15, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1A1A2E', borderWidth: 1.5, borderColor: ORANGE, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  iconEmoji: { fontSize: 32 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  phoneHighlight: { color: ORANGE, fontWeight: '700', fontSize: 15 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 8 },
  otpBox: { flex: 1, height: 58, borderRadius: 14, backgroundColor: '#12121F', borderWidth: 1.5, borderColor: BORDER, color: '#FFFFFF', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  otpBoxFilled: { borderColor: ORANGE, backgroundColor: '#1E1428' },
  button: { backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20, shadowColor: ORANGE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  resendLabel: { color: '#6B7280', fontSize: 14 },
  resendLink: { color: ORANGE, fontSize: 14, fontWeight: '700' },
  countdown: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  note: { color: '#4B5563', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
