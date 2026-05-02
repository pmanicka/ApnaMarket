import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Listing } from '../types';

interface ListingCardProps {
  listing: Listing;
}

const CATEGORY_STYLES: Record<string, { color: string; bg: string; emoji: string }> = {
  food: { color: '#F59E0B', bg: '#291F11', emoji: '🍱' },
  clothes: { color: '#EC4899', bg: '#2B1424', emoji: '👗' },
  tuition: { color: '#8B5CF6', bg: '#201633', emoji: '📚' },
  services: { color: '#3B82F6', bg: '#101B33', emoji: '🔧' },
  groceries: { color: '#10B981', bg: '#0D2319', emoji: '🥦' },
  handmade: { color: '#F43F5E', bg: '#2C131B', emoji: '🎨' },
};

export function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter();
  const catStyle = CATEGORY_STYLES[listing.category] || CATEGORY_STYLES.food;

  // Derive starting price
  let displayPrice = '₹---';
  let isStartingFrom = false;

  if (listing.category === 'food' && listing.food_items && listing.food_items.length > 0) {
    const minPrice = Math.min(...listing.food_items.map(i => i.price));
    displayPrice = `₹${minPrice}`;
    isStartingFrom = listing.food_items.length > 1;
  } else if (listing.category === 'tuition' && listing.tuition_details) {
    displayPrice = `₹${listing.tuition_details.fee_per_month}/mo`;
  } else if (listing.category === 'services' && listing.service_details) {
    displayPrice = `₹${listing.service_details.starting_price}`;
    isStartingFrom = listing.service_details.price_type === 'starting_from';
  } else if (listing.category === 'clothes' && listing.cloth_items?.[0]?.variants?.[0]) {
    displayPrice = `₹${listing.cloth_items[0].variants[0].price}`;
    isStartingFrom = true; // Often true for clothes
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/listing/${listing.id}`)}
      activeOpacity={0.8}
    >
      {/* Thumbnail */}
      <View style={styles.imageContainer}>
        {listing.primary_photo_url ? (
          <Image source={{ uri: listing.primary_photo_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Text style={styles.noImageEmoji}>{catStyle.emoji}</Text>
          </View>
        )}
        
        {/* Category Badge */}
        <View style={[styles.badge, { backgroundColor: catStyle.bg, borderColor: catStyle.color }]}>
          <Text style={[styles.badgeText, { color: catStyle.color }]}>
            {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
          </Text>
        </View>

        {!listing.is_available && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>UNAVAILABLE</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        <View style={styles.sellerRow}>
          <Text style={styles.sellerAvatar}>
            {listing.seller?.name ? listing.seller.name.charAt(0).toUpperCase() : '👤'}
          </Text>
          <Text style={styles.sellerName} numberOfLines={1}>
            {listing.seller?.name || 'Neighbor'}
          </Text>
          <Text style={styles.sellerBlock}>
            • Block {listing.seller?.block}-{listing.seller?.flat_number}
          </Text>
        </View>

        <View style={styles.footer}>
          <View>
            {isStartingFrom && <Text style={styles.startsFrom}>Starts from</Text>}
            <Text style={styles.price}>{displayPrice}</Text>
          </View>

          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => router.push(`/listing/${listing.id}`)}
          >
            <Text style={styles.contactBtnText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ORANGE = '#FF6B35';
const CARD_BG = '#1A1A2E';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#12121F',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageEmoji: {
    fontSize: 50,
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 24,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2D2D44',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    marginRight: 8,
    overflow: 'hidden',
  },
  sellerName: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  sellerBlock: {
    color: '#6B7280',
    fontSize: 13,
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#2D2D44',
    paddingTop: 16,
  },
  startsFrom: {
    color: '#6B7280',
    fontSize: 11,
    marginBottom: 2,
  },
  price: {
    color: ORANGE,
    fontSize: 20,
    fontWeight: '800',
  },
  contactBtn: {
    backgroundColor: ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
