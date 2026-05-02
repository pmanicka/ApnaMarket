import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useListing } from '../../../hooks/useListing';
import { StatusBar } from 'expo-status-bar';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { listing, isLoading, error } = useListing(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Category specific edit state
  const [foodItemsState, setFoodItemsState] = useState<Record<string, { price: string }>>({});
  const [tuitionFee, setTuitionFee] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  
  // For clothes: { variantId: { price: string, stock: string } }
  const [clothVariants, setClothVariants] = useState<Record<string, { price: string; stock: string }>>({});

  useEffect(() => {
    if (listing) {
      setTitle(listing.title || '');
      setDescription(listing.description || '');

      if (listing.category === 'food' && listing.food_items) {
        const itemsState: Record<string, { price: string }> = {};
        listing.food_items.forEach(item => {
          itemsState[item.id] = { price: item.price.toString() };
        });
        setFoodItemsState(itemsState);
      } else if (listing.category === 'tuition' && listing.tuition_details) {
        setTuitionFee(listing.tuition_details.fee_per_month.toString());
      } else if (listing.category === 'services' && listing.service_details) {
        setServicePrice(listing.service_details.starting_price.toString());
      } else if (listing.category === 'clothes' && listing.cloth_items) {
        const variantsState: Record<string, { price: string; stock: string }> = {};
        listing.cloth_items.forEach(item => {
          item.variants?.forEach(v => {
            variantsState[v.id] = {
              price: v.price.toString(),
              stock: v.stock_count.toString()
            };
          });
        });
        setClothVariants(variantsState);
      }
    }
  }, [listing]);

  const handleSave = async () => {
    if (!listing) return;
    setIsSaving(true);
    try {
      // 1. Update listings table
      const { error: listingError } = await supabase
        .from('listings')
        .update({ title, description })
        .eq('id', listing.id);
      if (listingError) throw listingError;

      // 2. Update category specific tables
      if (listing.category === 'food') {
        for (const [fId, fData] of Object.entries(foodItemsState)) {
          const { error: fError } = await supabase
            .from('food_items')
            .update({ price: parseFloat(fData.price) })
            .eq('id', fId);
          if (fError) throw fError;
        }
      } else if (listing.category === 'tuition') {
        const { error: tError } = await supabase
          .from('tuition_details')
          .update({ fee_per_month: parseFloat(tuitionFee) })
          .eq('listing_id', listing.id);
        if (tError) throw tError;
      } else if (listing.category === 'services') {
        const { error: sError } = await supabase
          .from('service_details')
          .update({ starting_price: parseFloat(servicePrice) })
          .eq('listing_id', listing.id);
        if (sError) throw sError;
      } else if (listing.category === 'clothes') {
        // Update all variants
        for (const [vId, vData] of Object.entries(clothVariants)) {
          const { error: cError } = await supabase
            .from('cloth_variants')
            .update({ 
              price: parseFloat(vData.price),
              stock_count: parseInt(vData.stock, 10)
            })
            .eq('id', vId);
          if (cError) throw cError;
        }
      }

      Alert.alert('Success', 'Listing updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      console.error('Update error:', err);
      Alert.alert('Error', err.message || 'Failed to update listing.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateClothVariant = (vId: string, field: 'price' | 'stock', value: string) => {
    setClothVariants(prev => ({
      ...prev,
      [vId]: { ...prev[vId], [field]: value }
    }));
  };

  const updateFoodItem = (fId: string, field: 'price', value: string) => {
    setFoodItemsState(prev => ({
      ...prev,
      [fId]: { ...prev[fId], [field]: value }
    }));
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Failed to load listing for editing.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Text style={styles.iconTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Listing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#6B7280"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Category Specific Edits */}
        {listing.category === 'food' && listing.food_items && (
          <View style={styles.clothesSection}>
            <Text style={styles.sectionTitle}>Food Prices</Text>
            {listing.food_items.map(item => (
              <View key={item.id} style={styles.clothItemBlock}>
                <Text style={styles.clothItemName}>{item.item_name}</Text>
                <View style={styles.variantRow}>
                  <Text style={styles.variantSize}>Price (₹)</Text>
                  <View style={styles.variantInputs}>
                    <TextInput
                      style={styles.variantInput}
                      value={foodItemsState[item.id]?.price}
                      onChangeText={(val) => updateFoodItem(item.id, 'price', val)}
                      keyboardType="numeric"
                      placeholder="Price"
                      placeholderTextColor="#6B7280"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {listing.category === 'tuition' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Fee Per Month (₹)</Text>
            <TextInput
              style={styles.input}
              value={tuitionFee}
              onChangeText={setTuitionFee}
              keyboardType="numeric"
              placeholderTextColor="#6B7280"
            />
          </View>
        )}

        {listing.category === 'services' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Starting Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={servicePrice}
              onChangeText={setServicePrice}
              keyboardType="numeric"
              placeholderTextColor="#6B7280"
            />
          </View>
        )}

        {listing.category === 'clothes' && listing.cloth_items && (
          <View style={styles.clothesSection}>
            <Text style={styles.sectionTitle}>Prices & Stock</Text>
            {listing.cloth_items.map(item => (
              <View key={item.id} style={styles.clothItemBlock}>
                <Text style={styles.clothItemName}>{item.item_name}</Text>
                {item.variants?.map(variant => (
                  <View key={variant.id} style={styles.variantRow}>
                    <Text style={styles.variantSize}>Size: {variant.size}</Text>
                    <View style={styles.variantInputs}>
                      <TextInput
                        style={styles.variantInput}
                        value={clothVariants[variant.id]?.price}
                        onChangeText={(val) => updateClothVariant(variant.id, 'price', val)}
                        keyboardType="numeric"
                        placeholder="Price"
                        placeholderTextColor="#6B7280"
                      />
                      <TextInput
                        style={styles.variantInput}
                        value={clothVariants[variant.id]?.stock}
                        onChangeText={(val) => updateClothVariant(variant.id, 'stock', val)}
                        keyboardType="numeric"
                        placeholder="Qty"
                        placeholderTextColor="#6B7280"
                      />
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} 
          onPress={handleSave} 
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ORANGE = '#FF6B35';
const BG = '#0F0F1A';
const CARD_BG = '#1A1A2E';
const BORDER = '#2D2D44';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
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
  iconTxt: { fontSize: 16, color: '#FFF' },
  content: { padding: 16, paddingBottom: 100 },
  formGroup: { marginBottom: 20 },
  label: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    color: '#FFF',
    padding: 16,
    fontSize: 16,
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  errorText: { color: '#EF4444', fontSize: 16 },
  
  clothesSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 16,
  },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  clothItemBlock: {
    backgroundColor: CARD_BG,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  clothItemName: { color: ORANGE, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#2D2D44',
    paddingTop: 8,
  },
  variantSize: { color: '#FFF', fontSize: 14, fontWeight: '600', flex: 1 },
  variantInputs: { flexDirection: 'row', gap: 8, flex: 2, justifyContent: 'flex-end' },
  variantInput: {
    backgroundColor: '#12121F',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    color: '#FFF',
    padding: 8,
    width: 70,
    textAlign: 'center',
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
  },
  saveBtn: {
    backgroundColor: ORANGE,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
