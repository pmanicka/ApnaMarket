import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useListings } from '../../hooks/useListings';
import { DashboardListingCard } from '../../components/DashboardListingCard';

type TabStatus = 'active' | 'paused' | 'all';

export default function ProfileScreen() {
  const { profile, signOut, supabaseUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabStatus>('active');

  const { listings, isLoading, refetch } = useListings({
    sellerId: profile?.id,
    status: activeTab,
  });

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      // Alert.alert callbacks don't work on web — use window.confirm instead
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) signOut();
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.profileInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : '👤'}
          </Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{profile?.name ?? 'Setting up...'}</Text>
          <Text style={styles.location}>
            {profile ? `Block ${profile.block} • Flat ${profile.flat_number}` : ''}
          </Text>
          <Text style={styles.phone}>{supabaseUser?.phone ?? ''}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Admin Panel shortcut */}
      {profile?.is_admin && (
        <TouchableOpacity style={styles.adminBanner} onPress={() => router.push('/admin')}>
          <Text style={styles.adminBannerText}>🛡️ Admin Panel — Approve Users</Text>
          <Text style={styles.adminBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>My Shop</Text>
      
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'paused' && styles.tabActive]}
          onPress={() => setActiveTab('paused')}
        >
          <Text style={[styles.tabText, activeTab === 'paused' && styles.tabTextActive]}>Paused</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DashboardListingCard listing={item} onRefresh={refetch} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {activeTab} listings found.</Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(tabs)/sell')}>
                <Text style={styles.createText}>+ Create New Listing</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const ORANGE = '#FF6B35';
const BG = '#0F0F1A';
const CARD_BG = '#1A1A2E';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  listContent: { padding: 16, paddingBottom: 100 },
  headerContainer: { marginBottom: 24 },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E1428',
    borderWidth: 2,
    borderColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 24, color: '#FFFFFF', fontWeight: '800' },
  details: { flex: 1, marginLeft: 16 },
  name: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  location: { fontSize: 13, color: '#9CA3AF', marginBottom: 2 },
  phone: { fontSize: 12, color: '#6B7280' },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#EF4444', fontWeight: '600' },
  
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 16 },
  adminBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.12)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.4)',
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24,
  },
  adminBannerText: { color: '#C4B5FD', fontWeight: '700', fontSize: 14 },
  adminBannerArrow: { color: '#C4B5FD', fontSize: 18, fontWeight: '700' },
  tabsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  tabActive: { backgroundColor: 'rgba(255, 107, 53, 0.1)', borderColor: ORANGE },
  tabText: { color: '#9CA3AF', fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: ORANGE },
  
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 16, marginBottom: 20 },
  createBtn: { backgroundColor: ORANGE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  createText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
