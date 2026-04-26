import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Listing } from '../types';
import { supabase } from '../lib/supabase';

interface Props {
  listing: Listing;
  onRefresh: () => void;
}

export function DashboardListingCard({ listing, onRefresh }: Props) {
  const router = useRouter();

  const handleToggleStatus = async () => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_available: !listing.is_available })
        .eq('id', listing.id);

      if (error) throw error;
      onRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Listing', 'Are you sure you want to permanently delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('listings')
              .delete()
              .eq('id', listing.id);

            if (error) throw error;
            onRefresh();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        }
      }
    ]);
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/listing/${listing.id}`)}
    >
      <View style={styles.contentRow}>
        <Image 
          source={{ uri: listing.primary_photo_url || 'https://via.placeholder.com/100' }} 
          style={styles.image} 
        />
        <View style={styles.info}>
          <View style={styles.badgeRow}>
            <Text style={styles.categoryBadge}>{listing.category.toUpperCase()}</Text>
            <View style={[styles.statusBadge, !listing.is_available && styles.statusBadgePaused]}>
              <Text style={[styles.statusText, !listing.is_available && styles.statusTextPaused]}>
                {listing.is_available ? 'Active' : 'Paused'}
              </Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
          <Text style={styles.date}>
            Posted on {new Date(listing.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/listing/edit/${listing.id}`)}>
          <Text style={styles.actionBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.borderBtn]} onPress={handleToggleStatus}>
          <Text style={styles.actionBtnText}>
            {listing.is_available ? '⏸ Pause' : '▶️ Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.borderBtn]} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const ORANGE = '#FF6B35';
const BG = '#1A1A2E';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  card: {
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    padding: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#12121F',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: ORANGE,
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgePaused: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  statusTextPaused: {
    color: '#EF4444',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 14,
  },
  borderBtn: {
    borderLeftWidth: 1,
    borderLeftColor: BORDER,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
});
