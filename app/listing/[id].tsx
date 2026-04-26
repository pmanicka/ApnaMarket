import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Linking,
  Alert,
  SafeAreaView,
  Share,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { useListing } from '../../hooks/useListing';
import { StatusBar } from 'expo-status-bar';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { listing, isLoading, error } = useListing(id);

  const [isContactModalVisible, setContactModalVisible] = useState(false);
  
  // For clothes category variant selection
  const [selectedClothItemIndex, setSelectedClothItemIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (activePhotoIndex !== roundIndex) {
      setActivePhotoIndex(roundIndex);
    }
  };

  const handleShare = async () => {
    if (!listing) return;
    try {
      await Share.share({
        message: `Check out "${listing.title}" on ApnaMarket!\nCategory: ${listing.category}\nOpen app to view details.`,
      });
    } catch (err: any) {
      console.log(err.message);
    }
  };

  const handleWhatsApp = () => {
    if (!listing?.seller?.mobile) {
      Alert.alert('Error', 'Seller phone number not found');
      return;
    }
    const mobile = listing.seller.mobile;
    // Add country code if missing
    const formatted = mobile.startsWith('+') ? mobile : `+91${mobile}`;
    const text = encodeURIComponent(`Hi ${listing.seller.name}, I saw your listing "${listing.title}" on ApnaMarket and I'm interested!`);
    Linking.openURL(`whatsapp://send?phone=${formatted}&text=${text}`).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed on your device');
    });
  };

  const handleCall = () => {
    if (!listing?.seller?.mobile) {
      Alert.alert('Error', 'Seller phone number not found');
      return;
    }
    Linking.openURL(`tel:${listing.seller.mobile}`);
  };

  const displayPrice = useMemo(() => {
    if (!listing) return '₹---';
    if (listing.category === 'food' && listing.food_details) return `₹${listing.food_details.price}`;
    if (listing.category === 'tuition' && listing.tuition_details) return `₹${listing.tuition_details.fee_per_month}/mo`;
    if (listing.category === 'services' && listing.service_details) {
      return listing.service_details.price_type === 'starting_from' 
        ? `Starts ₹${listing.service_details.starting_price}`
        : `₹${listing.service_details.starting_price}`;
    }
    if (listing.category === 'clothes') {
      const v = listing.cloth_items?.[selectedClothItemIndex]?.variants?.[selectedVariantIndex];
      if (v) return `₹${v.price}`;
    }
    return '₹---';
  }, [listing, selectedClothItemIndex, selectedVariantIndex]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>Failed to load listing</Text>
        <Text style={styles.errorSub}>{error || 'Listing not found'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderCategorySpecificDetails = () => {
    switch (listing.category) {
      case 'food':
        const food = listing.food_details;
        if (!food) return null;
        return (
          <View style={styles.specsBox}>
            <Text style={styles.specItem}>🏷️ Unit: {food.unit.replace('_', ' ')}</Text>
            <Text style={styles.specItem}>📦 Min Order: {food.min_order}</Text>
            <Text style={styles.specItem}>
              {food.is_veg ? '🟢 Pure Veg' : '🔴 Non-Veg'}
            </Text>
            {food.pre_order_required && (
              <Text style={styles.specItem}>⏳ Pre-order by: {food.order_by_time}</Text>
            )}
          </View>
        );

      case 'tuition':
        const t = listing.tuition_details;
        if (!t) return null;
        return (
          <View style={styles.specsBox}>
            <Text style={styles.specItem}>📚 Subjects: {t.subjects.join(', ')}</Text>
            <Text style={styles.specItem}>🎓 Grades: {t.grades.join(', ')}</Text>
            <Text style={styles.specItem}>🏫 Board: {t.board}</Text>
            <Text style={styles.specItem}>⏱️ Mode: {t.mode.toUpperCase()}</Text>
            <Text style={styles.specItem}>🧑‍🏫 Experience: {t.experience}</Text>
            <Text style={styles.specItem}>⏰ Timings: {t.batch_timings.join(', ')}</Text>
          </View>
        );

      case 'services':
        const s = listing.service_details;
        if (!s) return null;
        return (
          <View style={styles.specsBox}>
            <Text style={styles.specItem}>🔧 Service: {s.service_type}</Text>
            <Text style={styles.specItem}>🕒 Availability: {s.availability}</Text>
            <Text style={styles.specItem}>⭐ Experience: {s.experience}</Text>
          </View>
        );

      case 'clothes':
        const items = listing.cloth_items;
        if (!items || items.length === 0) return null;
        const currentItem = items[selectedClothItemIndex];
        const variants = currentItem?.variants || [];
        const currentVariant = variants[selectedVariantIndex];

        return (
          <View style={styles.clothesContainer}>
            <Text style={styles.sectionTitle}>Items Available</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemScroll}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.clothItemPill, selectedClothItemIndex === index && styles.clothItemPillActive]}
                  onPress={() => {
                    setSelectedClothItemIndex(index);
                    setSelectedVariantIndex(0);
                  }}
                >
                  <Text style={[styles.clothItemPillText, selectedClothItemIndex === index && styles.clothItemPillTextActive]}>
                    {item.item_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {currentItem && (
              <View style={styles.variantContainer}>
                <Text style={styles.itemMaterial}>Material: {currentItem.material || 'N/A'}</Text>
                <Text style={styles.sectionTitle}>Select Size</Text>
                <View style={styles.sizeGrid}>
                  {variants.map((v, index) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.sizeBtn, selectedVariantIndex === index && styles.sizeBtnActive]}
                      onPress={() => setSelectedVariantIndex(index)}
                    >
                      <Text style={[styles.sizeBtnText, selectedVariantIndex === index && styles.sizeBtnTextActive]}>
                        {v.size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {currentVariant && (
                  <Text style={styles.variantPrice}>
                    Price for {currentVariant.size}: <Text style={{ color: '#FF6B35' }}>₹{currentVariant.price}</Text>
                  </Text>
                )}
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Text style={styles.iconTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Details</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
          <Text style={styles.iconTxt}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Photo Area */}
        <View style={styles.imageWrapper}>
          {listing.photos && listing.photos.length > 0 ? (
            <>
              <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false} 
                style={styles.heroScroll}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {listing.photos.sort((a, b) => a.sort_order - b.sort_order).map((photo, index) => (
                  <Image key={index} source={{ uri: photo.photo_url }} style={styles.heroImageCarousel} />
                ))}
              </ScrollView>
              {listing.photos.length > 1 && (
                <View style={styles.paginationWrapper}>
                  {listing.photos.map((_, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.dot, 
                        activePhotoIndex === index ? styles.dotActive : styles.dotInactive
                      ]} 
                    />
                  ))}
                </View>
              )}
            </>
          ) : listing.primary_photo_url ? (
            <Image source={{ uri: listing.primary_photo_url }} style={styles.heroImage} />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}
          {!listing.is_available && (
            <View style={styles.soldOutOverlay}>
              <Text style={styles.soldOutText}>UNAVAILABLE</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{displayPrice}</Text>

          {/* Seller Profile Row */}
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarTxt}>
                {listing.seller?.name ? listing.seller.name.charAt(0).toUpperCase() : '👤'}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{listing.seller?.name || 'Neighbor'}</Text>
              <Text style={styles.sellerBlock}>Block {listing.seller?.block}-{listing.seller?.flat_number}</Text>
            </View>
            <TouchableOpacity style={styles.viewProfileBtn} onPress={() => router.push(`/profile/${listing.seller_id}`)}>
              <Text style={styles.viewProfileTxt}>View Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>

          {/* Category Details */}
          {renderCategorySpecificDetails()}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.contactBtn} 
          onPress={() => setContactModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.contactBtnText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Bottom Sheet (Modal) */}
      <Modal
        visible={isContactModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismiss} 
            activeOpacity={1} 
            onPress={() => setContactModalVisible(false)} 
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Contact {listing.seller?.name}</Text>
            <Text style={styles.sheetSub}>Choose how you want to reach out</Text>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
              <Text style={styles.actionBtnIcon}>💬</Text>
              <Text style={styles.actionBtnText}>WhatsApp Message</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]} onPress={handleCall}>
              <Text style={styles.actionBtnIcon}>📞</Text>
              <Text style={styles.actionBtnText}>Phone Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2D2D44' }]} 
              onPress={() => setContactModalVisible(false)}
            >
              <Text style={[styles.actionBtnText, { color: '#9CA3AF' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const ORANGE = '#FF6B35';
const { width } = Dimensions.get('window');
const BG = '#0F0F1A';
const CARD_BG = '#1A1A2E';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: BG,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconTxt: {
    color: '#FFF',
    fontSize: 20,
    lineHeight: 24,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageWrapper: {
    width: '100%',
    height: 300,
    backgroundColor: '#12121F',
    position: 'relative',
  },
  heroScroll: {
    width: '100%',
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroImageCarousel: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  paginationWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  noImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#6B7280',
    fontSize: 18,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
  body: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 32,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: ORANGE,
    marginBottom: 24,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 24,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2D2D44',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerAvatarTxt: {
    fontSize: 20,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sellerBlock: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  viewProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2D2D44',
    borderRadius: 8,
  },
  viewProfileTxt: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  description: {
    color: '#D1D5DB',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  specsBox: {
    backgroundColor: '#12121F',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  specItem: {
    color: '#D1D5DB',
    fontSize: 15,
  },
  clothesContainer: {
    backgroundColor: '#12121F',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  itemScroll: {
    marginBottom: 20,
  },
  clothItemPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    marginRight: 12,
  },
  clothItemPillActive: {
    borderColor: ORANGE,
    backgroundColor: '#1E1428',
  },
  clothItemPillText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  clothItemPillTextActive: {
    color: ORANGE,
  },
  variantContainer: {
    marginTop: 8,
  },
  itemMaterial: {
    color: '#9CA3AF',
    marginBottom: 16,
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  sizeBtn: {
    minWidth: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    alignItems: 'center',
  },
  sizeBtnActive: {
    borderColor: ORANGE,
    backgroundColor: '#1E1428',
  },
  sizeBtnText: {
    color: '#9CA3AF',
    fontWeight: '700',
  },
  sizeBtnTextActive: {
    color: ORANGE,
  },
  variantPrice: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    padding: 16,
    paddingBottom: 32, // for safe area on newer iPhones if not using SafeAreaView wrapper strictly
  },
  contactBtn: {
    backgroundColor: ORANGE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  contactBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorSub: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 24,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2D2D44',
    borderRadius: 12,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
  // Modal Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: BORDER,
    borderBottomWidth: 0,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#4B5563',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  sheetSub: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  actionBtnIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
