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
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { StatusBar } from 'expo-status-bar';
import { Community } from '../../types';

export default function OnboardingScreen() {
  const { supabaseUser, refreshProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [block, setBlock] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Community selection
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setCommunities(data as Community[]);
      }
      setLoadingCommunities(false);
    };
    fetchCommunities();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!selectedCommunity) {
      Alert.alert('Required', 'Please select your apartment / community.');
      return;
    }
    if (!block.trim() || !flatNumber.trim()) {
      Alert.alert('Required', 'Please enter your block and flat number.');
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from('users').upsert({
      id: supabaseUser?.id,
      mobile: supabaseUser?.phone ?? '',
      name: name.trim(),
      block: block.trim().toUpperCase(),
      flat_number: flatNumber.trim(),
      is_seller: true, // All users can both buy and sell
      community_id: selectedCommunity.id,
      is_approved: false, // Requires admin approval
    });

    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await refreshProfile();
    // Stay on the pending screen (handled by _layout.tsx auth gate)
    router.replace('/(auth)/pending');
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
          <Text style={styles.title}>Join Your Community</Text>
          <Text style={styles.subtitle}>
            Tell us about yourself to get started
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

          {/* Community Picker */}
          <Text style={styles.label}>Your Apartment / Community</Text>
          {loadingCommunities ? (
            <ActivityIndicator color="#FF6B35" style={{ marginVertical: 12 }} />
          ) : (
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Text style={selectedCommunity ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                  {selectedCommunity ? `🏘️  ${selectedCommunity.name}` : 'Select your apartment...'}
                </Text>
                <Text style={styles.dropdownArrow}>{showDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showDropdown && (
                <View style={styles.dropdownList}>
                  {communities.length === 0 ? (
                    <View style={styles.dropdownEmpty}>
                      <Text style={styles.dropdownEmptyText}>
                        No communities available yet.{'\n'}Please contact your admin.
                      </Text>
                    </View>
                  ) : (
                    communities.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.dropdownItem,
                          selectedCommunity?.id === c.id && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedCommunity(c);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>🏘️  {c.name}</Text>
                        <Text style={styles.dropdownCityText}>{c.city}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          )}

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

          <View style={styles.approvalNotice}>
            <Text style={styles.approvalIcon}>🔐</Text>
            <Text style={styles.approvalText}>
              Your registration will be reviewed by the community admin before you can access the marketplace.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, (isLoading || !selectedCommunity) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isLoading || !selectedCommunity}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit for Approval →</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ORANGE = '#FF6B35';
const BG = '#0F0F1A';
const CARD_BG = '#1A1A2E';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  bgAccent: {
    position: 'absolute',
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: ORANGE, opacity: 0.05, top: -80, right: -80,
  },
  scroll: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 40 },
  wave: { fontSize: 50, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
  form: { gap: 8 },
  label: { color: '#D1D5DB', fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#12121F', borderRadius: 14, borderWidth: 1.5,
    borderColor: BORDER, color: '#FFFFFF', fontSize: 16,
    paddingHorizontal: 16, paddingVertical: 14,
  },

  // Dropdown
  dropdownWrapper: { position: 'relative', zIndex: 10 },
  dropdownBtn: {
    backgroundColor: '#12121F', borderRadius: 14, borderWidth: 1.5,
    borderColor: BORDER, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dropdownPlaceholder: { color: '#6B7280', fontSize: 16 },
  dropdownSelected: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  dropdownArrow: { color: '#9CA3AF', fontSize: 12 },
  dropdownList: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: CARD_BG, borderRadius: 14, borderWidth: 1.5,
    borderColor: ORANGE, marginTop: 4, overflow: 'hidden', zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 12,
  },
  dropdownEmpty: { padding: 20, alignItems: 'center' },
  dropdownEmptyText: { color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  dropdownItem: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  dropdownItemSelected: { backgroundColor: 'rgba(255,107,53,0.1)' },
  dropdownItemText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  dropdownCityText: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },

  toggleRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 12 },
  toggleOption: {
    flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
    borderColor: BORDER, backgroundColor: '#12121F', alignItems: 'center',
  },
  toggleSelected: { borderColor: ORANGE, backgroundColor: '#1E1020' },
  toggleText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  toggleTextSelected: { color: ORANGE },

  approvalNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(255,107,53,0.08)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.25)',
    padding: 14, marginTop: 8, marginBottom: 8,
  },
  approvalIcon: { fontSize: 20 },
  approvalText: { flex: 1, color: '#D1D5DB', fontSize: 13, lineHeight: 20 },

  button: {
    backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4,
    shadowRadius: 12, elevation: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
