import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingScreen() {
  const { supabaseUser, refreshProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [block, setBlock] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [isSeller, setIsSeller] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!block.trim() || !flatNumber.trim()) {
      Alert.alert('Required', 'Please enter your block and flat number.');
      return;
    }

    setIsLoading(true);

    // Fetch default community
    const { data: community } = await supabase
      .from('communities')
      .select('id')
      .limit(1)
      .single();

    const { error } = await supabase.from('users').upsert({
      id: supabaseUser?.id,
      mobile: supabaseUser?.phone ?? '',
      name: name.trim(),
      block: block.trim().toUpperCase(),
      flat_number: flatNumber.trim(),
      is_seller: isSeller,
      community_id: community?.id ?? null,
    });

    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await refreshProfile();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <View style={styles.bgAccent} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.wave}>👋</Text>
          <Text style={styles.title}>Almost there!</Text>
          <Text style={styles.subtitle}>
            Let your neighbors know who you are
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Priya Sharma"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Block / Tower</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. A, B, Tower 1"
            placeholderTextColor="#6B7280"
            value={block}
            onChangeText={setBlock}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Flat Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 403, B-203"
            placeholderTextColor="#6B7280"
            value={flatNumber}
            onChangeText={setFlatNumber}
            autoCapitalize="characters"
          />

          {/* Seller toggle */}
          <Text style={styles.label}>Are you a seller?</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleOption, !isSeller && styles.toggleSelected]}
              onPress={() => setIsSeller(false)}
            >
              <Text style={[styles.toggleText, !isSeller && styles.toggleTextSelected]}>
                🛒  Just Browsing
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, isSeller && styles.toggleSelected]}
              onPress={() => setIsSeller(true)}
            >
              <Text style={[styles.toggleText, isSeller && styles.toggleTextSelected]}>
                🏪  I want to Sell
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enter ApnaMarket 🎉</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ORANGE = '#FF6B35';
const BG = '#0F0F1A';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  bgAccent: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: ORANGE,
    opacity: 0.05,
    top: -80,
    right: -80,
  },
  scroll: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  wave: { fontSize: 50, marginBottom: 12 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
  form: { gap: 8 },
  label: { color: '#D1D5DB', fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#12121F',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 12 },
  toggleOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: '#12121F',
    alignItems: 'center',
  },
  toggleSelected: { borderColor: ORANGE, backgroundColor: '#1E1020' },
  toggleText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  toggleTextSelected: { color: ORANGE },
  button: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
