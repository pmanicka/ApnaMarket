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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { useListing } from '../../hooks/useListing';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { listing, isLoading, error } = useListing(id);
  const { profile } = useAuth();
  const { refetch } = useListing(id);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Local Cart for WhatsApp orders
  const [cart, setCart] = useState<Record<string, {name: string, price: number, qty: number}>>({});

  const updateCart = (id: string, name: string, price: number, delta: number) => {
    setCart(prev => {
      const currentQty = prev[id]?.qty || 0;
      // Round to 2 decimals to prevent floating point issues
      const rawQty = Math.max(0, currentQty + delta);
      const newQty = Math.round(rawQty * 100) / 100;
      if (newQty === 0) {
        const newCart = { ...prev };
        delete newCart[id];
        return newCart;
      }
      return { ...prev, [id]: { name, price, qty: newQty } };
    });
  };

  const handleSubmitReview = async () => {
    if (!profile) { Alert.alert("Login Required", "You must be logged in to review."); return; }
    if (!reviewComment.trim()) { Alert.alert("Missing Input", "Please write a comment."); return; }
    setIsSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({
      listing_id: id,
      reviewer_id: profile.id,
      seller_id: listing!.seller_id,
      rating: reviewRating,
      comment: reviewComment.trim(),
    });
    setIsSubmittingReview(false);
    if (error) { Alert.alert("Error", error.message); return; }
    setReviewModalVisible(false);
    setReviewComment("");
    refetch();
    Alert.alert("Success", "Review added!");
  };


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
    const formatted = mobile.startsWith('+') ? mobile : `+91${mobile}`;
    
    let message = `Hi ${listing.seller.name}, I saw your listing "${listing.title}" on ApnaMarket and I'm interested!`;

    // Make the message specific based on what they are looking at
    if (Object.keys(cart).length > 0) {
      let total = 0;
      const itemsList = Object.values(cart).map(i => {
        total += i.price * i.qty;
        return `${i.qty}x ${i.name} (₹${i.price * i.qty})`;
      }).join('\n- ');
      
      const address = profile ? `Deliver to: Block ${profile.block}, Flat ${profile.flat_number}` : '';
      message = `Hi ${listing.seller.name}, I'd like to order from "${listing.title}":\n\n- ${itemsList}\n\nTotal: ₹${total}\n${address}`;
    } else if (listing.category === 'clothes' && listing.cloth_items && listing.cloth_items.length > 0) {
      const item = listing.cloth_items[selectedClothItemIndex];
      const variant = item?.variants?.[selectedVariantIndex];
      if (item && variant) {
        message = `Hi ${listing.seller.name}, I'd like to buy the "${item.item_name}" (Size: ${variant.size}) for ₹${variant.price} from your ApnaMarket listing "${listing.title}". Is it available?`;
      }
    } else if (listing.category === 'food') {
      message = `Hi ${listing.seller.name}, I'd like to place an order from your ApnaMarket listing "${listing.title}". What is the process?`;
    } else if (listing.category === 'tuition' && listing.tuition_details) {
      message = `Hi ${listing.seller.name}, I saw your tuition listing "${listing.title}" on ApnaMarket. I'm interested in classes for ${listing.tuition_details.subjects.join(', ')}.`;
    } else if (listing.category === 'services' && listing.service_details) {
      message = `Hi ${listing.seller.name}, I need your ${listing.service_details.service_type} services as listed on ApnaMarket ("${listing.title}"). Are you available?`;
    }

    if (profile) {
      let totalAmount = 0;
      let orderItems = { ...cart };

      if (Object.keys(orderItems).length === 0) {
        // Fallback for single item ordering without cart
        if (listing.category === 'clothes' && listing.cloth_items && listing.cloth_items.length > 0) {
          const item = listing.cloth_items[selectedClothItemIndex];
          const variant = item?.variants?.[selectedVariantIndex];
          if (item && variant) {
            orderItems[variant.id || 'single'] = { name: `${item.item_name} (${variant.size})`, price: variant.price, qty: 1 };
            totalAmount = variant.price;
          }
        } else if (listing.category === 'tuition' && listing.tuition_details) {
          totalAmount = listing.tuition_details.fee_per_month || 0;
          orderItems['tuition'] = { name: `Tuition: ${listing.tuition_details.subjects.join(', ')}`, price: totalAmount, qty: 1 };
        } else if (listing.category === 'services' && listing.service_details) {
          totalAmount = listing.service_details.starting_price || 0;
          orderItems['service'] = { name: `Service: ${listing.service_details.service_type}`, price: totalAmount, qty: 1 };
        } else {
          // Generic fallback (e.g., food without specific items)
          orderItems['generic'] = { name: 'General Order Inquiry', price: 0, qty: 1 };
        }
      } else {
        Object.values(orderItems).forEach(i => { totalAmount += i.price * i.qty; });
      }

      supabase.from("orders").insert({
        buyer_id: profile.id,
        seller_id: listing!.seller_id,
        listing_id: id,
        items_json: orderItems,
        total_amount: totalAmount,
        payment_status: "pending",
        order_status: "pending",
      }).then(({error}) => { 
        if (error) {
          Alert.alert("Order save error", error.message); 
          console.log("Order save error:", error);
        }
      });
    }

    const text = encodeURIComponent(message);
    Linking.openURL(`whatsapp://send?phone=${formatted}&text=${text}`).then(() => {
      // Clear the cart
      setCart({});
      setSelectedClothItemIndex(0);
      setSelectedVariantIndex(0);
      
      // Navigate directly to the orders history tab!
      router.push('/(tabs)/orders');
    }).catch(() => {
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
    if (listing.category === 'food' && listing.food_items && listing.food_items.length > 0) {
      const minPrice = Math.min(...listing.food_items.map(i => i.price));
      return `Starts from ₹${minPrice}`;
    }
    if (listing.category === 'groceries' && listing.grocery_items && listing.grocery_items.length > 0) {
      const minPrice = Math.min(...listing.grocery_items.map(i => i.price_per_unit));
      return `Starts from ₹${minPrice}`;
    }
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
        const settings = listing.food_menu_settings?.[0] || listing.food_menu_settings; // Depending on how Supabase returns it (sometimes array for 1:1 if not set up correctly, but should be object if .single() equivalent, however our select is `food_menu_settings(*)`)
        // Ensure settings is just an object if it came back as array
        const foodSettings = Array.isArray(settings) ? settings[0] : settings;
        const foodItems = listing.food_items;
        
        if (!foodItems || foodItems.length === 0) return null;
        
        return (
          <View>
            {foodSettings && foodSettings.pre_order_required && (
              <View style={styles.specsBox}>
                <Text style={styles.specItem}>⏳ Pre-order by: {foodSettings.order_by_time}</Text>
              </View>
            )}
            
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Menu</Text>
            {foodItems.map((item, index) => {
              const qty = cart[item.id]?.qty || 0;
              return (
                <View key={item.id} style={styles.clothesContainer}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Text style={{color: '#FFF', fontSize: 16, fontWeight: '700', flex: 1}}>{item.item_name}</Text>
                      <Text style={{color: '#FF6B35', fontSize: 16, fontWeight: '700'}}>₹{item.price}</Text>
                  </View>
                  {item.description ? <Text style={{color: '#9CA3AF', marginTop: 4, marginBottom: 8}}>{item.description}</Text> : null}
                  
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8}}>
                    <Text style={{color: '#D1D5DB', fontSize: 14}}>
                      🏷️ {item.unit.replace('_', ' ')} | 📦 Min: {item.min_order} | {item.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}
                    </Text>
                    {/* Add to Cart Controls */}
                    <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 20, borderWidth: 1, borderColor: '#2D2D44'}}>
                      <TouchableOpacity onPress={() => updateCart(item.id, item.item_name, item.price, -1)} style={{padding: 8, paddingHorizontal: 12}}>
                        <Text style={{color: qty > 0 ? '#FF6B35' : '#4B5563', fontSize: 16, fontWeight: '800'}}>-</Text>
                      </TouchableOpacity>
                      <Text style={{color: '#FFF', paddingHorizontal: 4, fontWeight: '700'}}>{qty}</Text>
                      <TouchableOpacity onPress={() => updateCart(item.id, item.item_name, item.price, 1)} style={{padding: 8, paddingHorizontal: 12}}>
                        <Text style={{color: '#FF6B35', fontSize: 16, fontWeight: '800'}}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        );

      case 'groceries':
        const groceryItems = listing.grocery_items;
        if (!groceryItems || groceryItems.length === 0) return null;
        
        return (
          <View>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Items Available</Text>
            {groceryItems.map((item) => {
              const qty = cart[item.id]?.qty || 0;
              const step = item.step_qty || 0.25;
              const min = item.min_order_qty || 0.25;
              return (
                <View key={item.id} style={styles.clothesContainer}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Text style={{color: '#FFF', fontSize: 16, fontWeight: '700', flex: 1}}>{item.item_name}</Text>
                      <Text style={{color: '#FF6B35', fontSize: 16, fontWeight: '700'}}>₹{item.price_per_unit}/{item.unit_type}</Text>
                  </View>
                  {item.description ? <Text style={{color: '#9CA3AF', marginTop: 4, marginBottom: 8}}>{item.description}</Text> : null}
                  
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8}}>
                    <Text style={{color: '#D1D5DB', fontSize: 14}}>
                      🏷️ {item.unit_type} | 📦 Min: {min}
                    </Text>
                    {/* Add to Cart Controls */}
                    <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 20, borderWidth: 1, borderColor: '#2D2D44'}}>
                      <TouchableOpacity onPress={() => {
                        // If going down to 0, subtract the current qty
                        if (qty <= min) updateCart(item.id, item.item_name, item.price_per_unit, -qty);
                        else updateCart(item.id, item.item_name, item.price_per_unit, -step);
                      }} style={{padding: 8, paddingHorizontal: 12}}>
                        <Text style={{color: qty > 0 ? '#FF6B35' : '#4B5563', fontSize: 16, fontWeight: '800'}}>-</Text>
                      </TouchableOpacity>
                      <Text style={{color: '#FFF', paddingHorizontal: 4, fontWeight: '700'}}>{qty}</Text>
                      <TouchableOpacity onPress={() => {
                        if (qty === 0) updateCart(item.id, item.item_name, item.price_per_unit, min);
                        else updateCart(item.id, item.item_name, item.price_per_unit, step);
                      }} style={{padding: 8, paddingHorizontal: 12}}>
                        <Text style={{color: '#FF6B35', fontSize: 16, fontWeight: '800'}}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
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
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8}}>
                    <Text style={styles.variantPrice}>
                      Price for {currentVariant.size}: <Text style={{ color: '#FF6B35' }}>₹{currentVariant.price}</Text>
                    </Text>
                    {/* Add to Cart Controls */}
                    <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A2E', borderRadius: 20, borderWidth: 1, borderColor: '#2D2D44'}}>
                      <TouchableOpacity onPress={() => updateCart(currentVariant.id, `${currentItem.item_name} (${currentVariant.size})`, currentVariant.price, -1)} style={{padding: 8, paddingHorizontal: 12}}>
                        <Text style={{color: cart[currentVariant.id]?.qty > 0 ? '#FF6B35' : '#4B5563', fontSize: 16, fontWeight: '800'}}>-</Text>
                      </TouchableOpacity>
                      <Text style={{color: '#FFF', paddingHorizontal: 4, fontWeight: '700'}}>{cart[currentVariant.id]?.qty || 0}</Text>
                      <TouchableOpacity onPress={() => updateCart(currentVariant.id, `${currentItem.item_name} (${currentVariant.size})`, currentVariant.price, 1)} style={{padding: 8, paddingHorizontal: 12}}>
                        <Text style={{color: '#FF6B35', fontSize: 16, fontWeight: '800'}}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
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

          {/* Reviews Section */}
          <View style={{ marginTop: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Reviews ({listing.reviews?.length || 0})</Text>
              {profile?.id !== listing.seller_id && (
                <TouchableOpacity onPress={() => setReviewModalVisible(true)} style={{ backgroundColor: '#2D2D44', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>Write Review</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {listing.reviews && listing.reviews.length > 0 ? (
              listing.reviews.map(review => (
                <View key={review.id} style={{ backgroundColor: '#12121F', borderWidth: 1, borderColor: '#2D2D44', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#2D2D44', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                      <Text style={{ fontSize: 14 }}>{review.reviewer?.name?.charAt(0).toUpperCase() || '?'}</Text>
                    </View>
                    <View>
                      <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>{review.reviewer?.name || 'Anonymous'}</Text>
                      <Text style={{ color: '#FF6B35', fontSize: 12 }}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#D1D5DB', fontSize: 14, lineHeight: 20 }}>{review.comment}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: '#9CA3AF', fontStyle: 'italic', marginBottom: 16 }}>No reviews yet.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {profile?.id === listing.seller_id ? (
          <View style={[styles.contactBtn, { backgroundColor: '#2D2D44' }]}>
            <Text style={styles.contactBtnText}>This is your listing</Text>
          </View>
        ) : Object.keys(cart).length > 0 ? (
          <TouchableOpacity 
            style={[styles.contactBtn, { backgroundColor: '#25D366' }]} 
            onPress={handleWhatsApp}
            activeOpacity={0.8}
          >
            <Text style={styles.contactBtnText}>Order {Object.values(cart).reduce((a,b)=>a+b.qty, 0)} items via WhatsApp</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.contactBtn} 
            onPress={() => setContactModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.contactBtnText}>Contact Seller</Text>
          </TouchableOpacity>
        )}
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

      {/* Review Modal */}
      <Modal
        visible={isReviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <TouchableOpacity 
              style={styles.modalDismiss} 
              activeOpacity={1} 
              onPress={() => setReviewModalVisible(false)} 
            />
            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Write a Review</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginVertical: 24 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                    <Text style={{ fontSize: 40, color: star <= reviewRating ? '#FF6B35' : '#2D2D44' }}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={{ backgroundColor: '#12121F', borderWidth: 1, borderColor: '#2D2D44', borderRadius: 12, padding: 16, color: '#FFF', height: 100, textAlignVertical: 'top', marginBottom: 24 }}
                placeholder="Share your experience..."
                placeholderTextColor="#6B7280"
                multiline
                value={reviewComment}
                onChangeText={setReviewComment}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
                blurOnSubmit={true}
              />

              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: '#FF6B35' }]} 
                onPress={handleSubmitReview}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Submit Review</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2D2D44' }]} 
                onPress={() => setReviewModalVisible(false)}
              >
                <Text style={[styles.actionBtnText, { color: '#9CA3AF' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
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
