import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useListings } from '../../hooks/useListings';
import { CategoryPills, FilterCategory } from '../../components/CategoryPills';
import { ListingCard } from '../../components/ListingCard';

export default function FeedScreen() {
  const { profile } = useAuth();
  const [category, setCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { listings, isLoading, isRefreshing, refetch, error } = useListings({
    communityId: profile?.community_id || process.env.EXPO_PUBLIC_DEFAULT_COMMUNITY_ID,
    category,
    searchQuery,
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Search */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search listings..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Category Filter */}
      <CategoryPills selected={category} onSelect={setCategory} />

      {/* Listings Feed */}
      <View style={styles.feedContainer}>
        {isLoading && !isRefreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Failed to load listings</Text>
            <Text style={styles.errorSub}>{error}</Text>
          </View>
        ) : listings.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No listings found</Text>
            <Text style={styles.emptySub}>
              Try changing the category or search term
            </Text>
          </View>
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ListingCard listing={item} />}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refetch}
                tintColor="#FF6B35"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const ORANGE = '#FF6B35';
const BG = '#0F0F1A';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  feedContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorSub: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySub: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});
