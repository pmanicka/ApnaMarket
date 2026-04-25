import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { profile, signOut, supabaseUser } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : '👤'}
          </Text>
        </View>

        {/* Name */}
        <Text style={styles.name}>{profile?.name ?? 'Setting up...'}</Text>
        <Text style={styles.location}>
          {profile ? `Block ${profile.block} • Flat ${profile.flat_number}` : ''}
        </Text>
        <Text style={styles.phone}>{supabaseUser?.phone ?? ''}</Text>

        {/* Tags */}
        <View style={styles.tagRow}>
          {profile?.is_seller && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>🏪 Seller</Text>
            </View>
          )}
          {profile?.is_admin && (
            <View style={[styles.tag, styles.adminTag]}>
              <Text style={styles.tagText}>⭐ Admin</Text>
            </View>
          )}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ORANGE = '#FF6B35';
const BG = '#0F0F1A';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1E1428',
    borderWidth: 2,
    borderColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 36, color: '#FFFFFF', fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  location: { fontSize: 14, color: '#9CA3AF', marginBottom: 4 },
  phone: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  tagRow: { flexDirection: 'row', gap: 10, marginBottom: 40 },
  tag: {
    backgroundColor: '#1E1428',
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  adminTag: { borderColor: '#F59E0B', backgroundColor: '#1C1A10' },
  tagText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  signOutBtn: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
