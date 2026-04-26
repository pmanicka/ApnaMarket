import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
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
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [isVegOnly, setIsVegOnly] = useState(false);

  const { listings, isLoading, isRefreshing, refetch, error, isFetchingNextPage, fetchNextPage } = useListings({
    communityId: profile?.community_id || process.env.EXPO_PUBLIC_DEFAULT_COMMUNITY_ID,
    category,
    searchQuery,
    sortBy,
    isVegOnly,
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
        <View style={styles.filtersRow}>
          <View style={styles.sortRow}>
            <TouchableOpacity 
              style={[styles.sortBtn, sortBy === 'latest' && styles.sortBtnActive]}
              onPress={() => setSortBy('latest')}
            >
              <Text style={[styles.sortBtnText, sortBy === 'latest' && styles.sortBtnTextActive]}>Latest</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortBtn, sortBy === 'oldest' && styles.sortBtnActive]}
              onPress={() => setSortBy('oldest')}
            >
              <Text style={[styles.sortBtnText, sortBy === 'oldest' && styles.sortBtnTextActive]}>Oldest</Text>
            </TouchableOpacity>
          </View>
          {category === 'food' && (
            <TouchableOpacity 
              style={[styles.vegToggle, isVegOnly && styles.vegToggleActive]}
              onPress={() => setIsVegOnly(!isVegOnly)}
            >
              <Text style={styles.vegToggleText}>🟢 Veg Only</Text>
            </TouchableOpacity>
          )}
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
            onEndReached={fetchNextPage}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#FF6B35" />
                </View>
              ) : null
            }
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
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#12121F',
  },
  sortBtnActive: {
    borderColor: ORANGE,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  sortBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  sortBtnTextActive: {
    color: ORANGE,
  },
  vegToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#12121F',
  },
  vegToggleActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  vegToggleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
