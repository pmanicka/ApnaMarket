import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useListings } from '../../hooks/useListings';
import { ListingCard } from '../../components/ListingCard';
import { User } from '../../types';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [seller, setSeller] = useState<User | null>(null);
  const [loadingSeller, setLoadingSeller] = useState(true);

  const { listings, isLoading, fetchNextPage } = useListings({
    sellerId: id,
    status: 'active',
  });

  useEffect(() => {
    if (!id) return;
    const fetchSeller = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (data) {
        setSeller(data as User);
      }
      setLoadingSeller(false);
    };
    fetchSeller();
  }, [id]);

  if (loadingSeller) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!seller) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>User not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {seller.name ? seller.name.charAt(0).toUpperCase() : '👤'}
        </Text>
      </View>
      <Text style={styles.name}>{seller.name || 'Anonymous Seller'}</Text>
      <Text style={styles.location}>
        Block {seller.block} • Flat {seller.flat_number}
      </Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{listings.length}</Text>
          <Text style={styles.statLabel}>Active Listings</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {new Date(seller.created_at || Date.now()).getFullYear()}
          </Text>
          <Text style={styles.statLabel}>Joined</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Text style={styles.iconTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle} numberOfLines={1}>Seller Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <ListingCard listing={item} />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        onEndReached={fetchNextPage}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>This seller has no active listings.</Text>
            </View>
          ) : (
            <ActivityIndicator style={{ marginTop: 40 }} color="#FF6B35" />
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },
  errorText: { color: '#FFF', fontSize: 18, marginBottom: 16 },
  backBtn: { padding: 12, backgroundColor: CARD_BG, borderRadius: 8, borderWidth: 1, borderColor: BORDER },
  backBtnText: { color: ORANGE, fontWeight: '600' },
  
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  topHeaderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  iconTxt: {
    fontSize: 16,
    color: '#FFF',
  },

  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E1428',
    borderWidth: 2,
    borderColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, color: '#FFF', fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  location: { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statBox: {
    flex: 1,
    backgroundColor: CARD_BG,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  statNumber: { fontSize: 20, fontWeight: '800', color: ORANGE, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 16 },
});
