import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { ImagePickerGrid } from '../../components/ImagePickerGrid';
import { uploadListingImage } from '../../lib/uploadImage';
import { Category, ContactPreference } from '../../types';

// Types for Clothes
type ClothVariant = { id: string; size: string; price: string; stock: string };
type ClothItem = { id: string; name: string; material: string; variants: ClothVariant[] };

export default function SellFormScreen() {
  const { category } = useLocalSearchParams<{ category: Category }>();
  const router = useRouter();
  const { profile } = useAuth();

  // Common fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactPref, setContactPref] = useState<ContactPreference>('whatsapp');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Food specific fields
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('per_plate');
  const [minOrder, setMinOrder] = useState('1');
  const [isVeg, setIsVeg] = useState(false);
  const [preOrder, setPreOrder] = useState(true);
  const [orderByTime, setOrderByTime] = useState('');

  // General specific fields
  const [stock, setStock] = useState('10');

  // Tuition specific fields
  const [subjects, setSubjects] = useState('');
  const [grades, setGrades] = useState('');
  const [board, setBoard] = useState('CBSE');
  const [tuitionFee, setTuitionFee] = useState('');
  const [maxStudents, setMaxStudents] = useState('5');
  const [mode, setMode] = useState('home'); // home, online, both
  const [experience, setExperience] = useState('');
  const [batchTimings, setBatchTimings] = useState('');

  // Services specific fields
  const [serviceType, setServiceType] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [priceType, setPriceType] = useState('fixed'); // fixed, starting_from, on_inspection
  const [availability, setAvailability] = useState('');
  const [serviceExperience, setServiceExperience] = useState('');

  // Clothes specific fields
  const [clothItems, setClothItems] = useState<ClothItem[]>([
    { id: '1', name: '', material: '', variants: [{ id: 'v1', size: '', price: '', stock: '1' }] }
  ]);

  const handleAddClothItem = () => {
    if (clothItems.length >= 20) {
      Alert.alert('Limit Reached', 'You can only add up to 20 items per listing.');
      return;
    }
    setClothItems([...clothItems, { id: Math.random().toString(), name: '', material: '', variants: [{ id: Math.random().toString(), size: '', price: '', stock: '1' }] }]);
  };

  const handleRemoveClothItem = (id: string) => {
    setClothItems(clothItems.filter(item => item.id !== id));
  };

  const handleAddVariant = (itemId: string) => {
    setClothItems(clothItems.map(item => {
      if (item.id === itemId) {
        if (item.variants.length >= 10) {
          Alert.alert('Limit Reached', 'You can only add up to 10 variants per item.');
          return item;
        }
        return { ...item, variants: [...item.variants, { id: Math.random().toString(), size: '', price: '', stock: '1' }] };
      }
      return item;
    }));
  };

  const handleRemoveVariant = (itemId: string, variantId: string) => {
    setClothItems(clothItems.map(item => {
      if (item.id === itemId) {
        return { ...item, variants: item.variants.filter(v => v.id !== variantId) };
      }
      return item;
    }));
  };

  const updateClothItem = (itemId: string, field: keyof ClothItem, value: string) => {
    setClothItems(clothItems.map(item => item.id === itemId ? { ...item, [field]: value } : item));
  };

  const updateVariant = (itemId: string, variantId: string, field: keyof ClothVariant, value: string) => {
    setClothItems(clothItems.map(item => {
      if (item.id === itemId) {
        return { ...item, variants: item.variants.map(v => v.id === variantId ? { ...v, [field]: value } : v) };
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert('Required Fields', 'Please fill in title and description.');
      return;
    }
    if (category !== 'clothes' && !price) {
      Alert.alert('Required Fields', 'Please fill in the price.');
      return;
    }
    if (category === 'clothes') {
      for (const item of clothItems) {
        if (!item.name) {
          Alert.alert('Required Fields', 'Please name all cloth items.');
          return;
        }
        for (const v of item.variants) {
          if (!v.size || !v.price) {
            Alert.alert('Required Fields', 'Please fill in size and price for all variants.');
            return;
          }
        }
      }
    }
    if (category === 'tuition') {
      if (!subjects || !grades || !tuitionFee) {
        Alert.alert('Required Fields', 'Please fill in subjects, grades, and fee.');
        return;
      }
    }
    if (category === 'services') {
      if (!serviceType || !startingPrice) {
        Alert.alert('Required Fields', 'Please fill in service type and starting price.');
        return;
      }
    }
    if (!profile) {
      Alert.alert('Error', 'You must be logged in to post.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Photos Required', 'Please add at least one photo.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload Images
      const uploadedUrls = [];
      for (const uri of images) {
        const publicUrl = await uploadListingImage(uri, profile.id);
        uploadedUrls.push(publicUrl);
      }

      // 2. Insert Listing
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .insert({
          seller_id: profile.id,
          community_id: profile.community_id || process.env.EXPO_PUBLIC_DEFAULT_COMMUNITY_ID,
          category: category,
          title: title,
          description: description,
          primary_photo_url: uploadedUrls[0],
          contact_preference: contactPref,
          is_available: true,
          delivery_available: false,
        })
        .select()
        .single();

      if (listingError) throw listingError;
      const newListingId = listingData.id;

      // 2.5 Insert Additional Photos
      if (uploadedUrls.length > 0) {
        const photosToInsert = uploadedUrls.map((url, index) => ({
          listing_id: newListingId,
          photo_url: url,
          sort_order: index,
        }));
        const { error: photosError } = await supabase.from('listing_photos').insert(photosToInsert);
        if (photosError) throw photosError;
      }

      // 3. Insert Category Details
      if (category === 'food') {
        const { error: foodError } = await supabase.from('food_details').insert({
          listing_id: newListingId,
          price: parseInt(price, 10),
          unit: unit,
          min_order: parseInt(minOrder, 10),
          pre_order_required: preOrder,
          order_by_time: preOrder ? orderByTime : null,
          is_veg: isVeg,
          available_days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        });
        if (foodError) throw foodError;
      } else if (category === 'clothes') {
        // Insert cloth items
        for (let i = 0; i < clothItems.length; i++) {
          const item = clothItems[i];
          const { data: insertedItem, error: itemError } = await supabase.from('cloth_items').insert({
            listing_id: newListingId,
            item_name: item.name,
            material: item.material,
            sort_order: i
          }).select().single();
          
          if (itemError) throw itemError;

          // Insert variants for this item
          if (item.variants.length > 0) {
            const variantsToInsert = item.variants.map(v => ({
              cloth_item_id: insertedItem.id,
              size: v.size,
              price: parseInt(v.price, 10),
              stock_count: parseInt(v.stock, 10) || 1
            }));
            const { error: variantError } = await supabase.from('cloth_variants').insert(variantsToInsert);
            if (variantError) throw variantError;
          }
        }
      } else if (category === 'tuition') {
        const { error: tuitionError } = await supabase.from('tuition_details').insert({
          listing_id: newListingId,
          subjects: subjects.split(',').map(s => s.trim()).filter(Boolean),
          grades: grades.split(',').map(s => s.trim()).filter(Boolean),
          board: board,
          fee_per_month: parseInt(tuitionFee, 10),
          max_students: parseInt(maxStudents, 10) || 5,
          mode: mode,
          experience: experience,
          batch_timings: batchTimings.split(',').map(s => s.trim()).filter(Boolean),
        });
        if (tuitionError) throw tuitionError;
      } else if (category === 'services') {
        const { error: serviceError } = await supabase.from('service_details').insert({
          listing_id: newListingId,
          service_type: serviceType,
          starting_price: parseInt(startingPrice, 10),
          price_type: priceType,
          availability: availability,
          experience: serviceExperience,
        });
        if (serviceError) throw serviceError;
      }

      Alert.alert('Success', 'Listing published!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFoodFields = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Food Details</Text>
      
      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price (₹)</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="e.g. 250" placeholderTextColor="#6B7280" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Unit</Text>
          <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="e.g. per_plate" placeholderTextColor="#6B7280" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Min Order Qty</Text>
          <TextInput style={styles.input} value={minOrder} onChangeText={setMinOrder} keyboardType="numeric" />
        </View>
        <View style={[styles.inputGroup, styles.switchGroup]}>
          <Text style={styles.label}>Pure Veg 🟢</Text>
          <Switch value={isVeg} onValueChange={setIsVeg} trackColor={{ false: '#2D2D44', true: '#10B981' }} />
        </View>
      </View>

      <View style={[styles.switchGroup, { marginBottom: 12 }]}>
        <Text style={styles.label}>Pre-order Required?</Text>
        <Switch value={preOrder} onValueChange={setPreOrder} trackColor={{ false: '#2D2D44', true: '#FF6B35' }} />
      </View>

      {preOrder && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Order By Time</Text>
          <TextInput style={styles.input} value={orderByTime} onChangeText={setOrderByTime} placeholder="e.g. Saturday 8 PM" placeholderTextColor="#6B7280" />
        </View>
      )}
    </View>
  );

  const renderClothesFields = () => (
    <View style={styles.clothesContainer}>
      <Text style={styles.sectionTitle}>Clothing Items</Text>
      {clothItems.map((item, index) => (
        <View key={item.id} style={styles.clothItemCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.itemTitle}>Item {index + 1}</Text>
            {clothItems.length > 1 && (
              <TouchableOpacity onPress={() => handleRemoveClothItem(item.id)}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.label}>Item Name</Text>
          <TextInput style={styles.input} value={item.name} onChangeText={(val) => updateClothItem(item.id, 'name', val)} placeholder="e.g. Cotton Kurti" placeholderTextColor="#6B7280" />
          
          <Text style={[styles.label, { marginTop: 12 }]}>Material</Text>
          <TextInput style={styles.input} value={item.material} onChangeText={(val) => updateClothItem(item.id, 'material', val)} placeholder="e.g. 100% Cotton" placeholderTextColor="#6B7280" />

          <View style={styles.variantsHeader}>
            <Text style={styles.label}>Sizes & Pricing</Text>
          </View>
          
          {item.variants.map((v, vIndex) => (
            <View key={v.id} style={styles.variantRow}>
              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                {vIndex === 0 && <Text style={styles.subLabel}>Size</Text>}
                <TextInput style={styles.inputSmall} value={v.size} onChangeText={(val) => updateVariant(item.id, v.id, 'size', val)} placeholder="M, L, XL" placeholderTextColor="#6B7280" />
              </View>
              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                {vIndex === 0 && <Text style={styles.subLabel}>Price (₹)</Text>}
                <TextInput style={styles.inputSmall} value={v.price} onChangeText={(val) => updateVariant(item.id, v.id, 'price', val)} keyboardType="numeric" placeholder="500" placeholderTextColor="#6B7280" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                {vIndex === 0 && <Text style={styles.subLabel}>Stock</Text>}
                <TextInput style={styles.inputSmall} value={v.stock} onChangeText={(val) => updateVariant(item.id, v.id, 'stock', val)} keyboardType="numeric" placeholder="1" placeholderTextColor="#6B7280" />
              </View>
              <View style={styles.variantActions}>
                {vIndex === 0 && <Text style={styles.subLabel}> </Text>}
                <TouchableOpacity style={styles.delBtn} onPress={() => handleRemoveVariant(item.id, v.id)}>
                  <Text style={styles.delBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addSizeBtn} onPress={() => handleAddVariant(item.id)}>
            <Text style={styles.addSizeBtnText}>+ Add Size</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addItemBtn} onPress={handleAddClothItem}>
        <Text style={styles.addItemBtnText}>+ Add Another Item</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTuitionFields = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tuition Details</Text>

      <Text style={styles.label}>Subjects (comma separated)</Text>
      <TextInput style={[styles.input, { marginBottom: 16 }]} value={subjects} onChangeText={setSubjects} placeholder="e.g. Math, Physics, Chemistry" placeholderTextColor="#6B7280" />

      <Text style={styles.label}>Grades / Classes (comma separated)</Text>
      <TextInput style={[styles.input, { marginBottom: 16 }]} value={grades} onChangeText={setGrades} placeholder="e.g. Class 8, Class 9, Class 10" placeholderTextColor="#6B7280" />

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Board</Text>
          <TextInput style={styles.input} value={board} onChangeText={setBoard} placeholder="CBSE, State Board" placeholderTextColor="#6B7280" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monthly Fee (₹)</Text>
          <TextInput style={styles.input} value={tuitionFee} onChangeText={setTuitionFee} keyboardType="numeric" placeholder="1500" placeholderTextColor="#6B7280" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Max Students/Batch</Text>
          <TextInput style={styles.input} value={maxStudents} onChangeText={setMaxStudents} keyboardType="numeric" placeholder="5" placeholderTextColor="#6B7280" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mode</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity onPress={() => setMode('home')} style={[styles.radioBtn, mode === 'home' && styles.radioBtnActive]}>
              <Text style={styles.radioText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('online')} style={[styles.radioBtn, mode === 'online' && styles.radioBtnActive]}>
              <Text style={styles.radioText}>Online</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('both')} style={[styles.radioBtn, mode === 'both' && styles.radioBtnActive]}>
              <Text style={styles.radioText}>Both</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Text style={styles.label}>Experience</Text>
      <TextInput style={[styles.input, { marginBottom: 16 }]} value={experience} onChangeText={setExperience} placeholder="e.g. 5 years teaching experience" placeholderTextColor="#6B7280" />

      <Text style={styles.label}>Batch Timings (comma separated)</Text>
      <TextInput style={styles.input} value={batchTimings} onChangeText={setBatchTimings} placeholder="e.g. Mon-Wed-Fri 5PM-6PM" placeholderTextColor="#6B7280" />
    </View>
  );

  const renderServicesFields = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Service Details</Text>

      <Text style={styles.label}>Service Type</Text>
      <TextInput style={[styles.input, { marginBottom: 16 }]} value={serviceType} onChangeText={setServiceType} placeholder="e.g. AC Servicing, Plumber" placeholderTextColor="#6B7280" />

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Starting Price (₹)</Text>
          <TextInput style={styles.input} value={startingPrice} onChangeText={setStartingPrice} keyboardType="numeric" placeholder="500" placeholderTextColor="#6B7280" />
        </View>
      </View>

      <Text style={styles.label}>Price Type</Text>
      <View style={[styles.radioGroup, { marginBottom: 16 }]}>
        <TouchableOpacity onPress={() => setPriceType('fixed')} style={[styles.radioBtn, priceType === 'fixed' && styles.radioBtnActive]}>
          <Text style={styles.radioText}>Fixed</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPriceType('starting_from')} style={[styles.radioBtn, priceType === 'starting_from' && styles.radioBtnActive]}>
          <Text style={styles.radioText}>Starts From</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPriceType('on_inspection')} style={[styles.radioBtn, priceType === 'on_inspection' && styles.radioBtnActive]}>
          <Text style={styles.radioText}>On Inspect</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Availability</Text>
      <TextInput style={[styles.input, { marginBottom: 16 }]} value={availability} onChangeText={setAvailability} placeholder="e.g. Weekends only, 24/7" placeholderTextColor="#6B7280" />

      <Text style={styles.label}>Experience / Qualifications</Text>
      <TextInput style={styles.input} value={serviceExperience} onChangeText={setServiceExperience} placeholder="e.g. Certified Electrician with 10 years exp." placeholderTextColor="#6B7280" />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New {category} Listing</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Main Photos</Text>
        <ImagePickerGrid images={images} onChange={setImages} maxImages={4} />

        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          <TextInput 
            style={styles.input} 
            value={title} 
            onChangeText={setTitle} 
            placeholder="What are you selling?" 
            placeholderTextColor="#6B7280" 
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={description} 
            onChangeText={setDescription} 
            placeholder="Add details about your listing..." 
            placeholderTextColor="#6B7280" 
            multiline 
            numberOfLines={4} 
          />
        </View>

        {category === 'food' ? renderFoodFields() : 
         category === 'clothes' ? renderClothesFields() : 
         category === 'tuition' ? renderTuitionFields() : 
         category === 'services' ? renderServicesFields() : (
          <View style={styles.section}>
            <Text style={styles.label}>Price (₹)</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="e.g. 500" placeholderTextColor="#6B7280" />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Preference</Text>
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.prefBtn, contactPref === 'whatsapp' && styles.prefBtnActive]}
              onPress={() => setContactPref('whatsapp')}
            >
              <Text style={[styles.prefBtnText, contactPref === 'whatsapp' && styles.prefBtnTextActive]}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.prefBtn, contactPref === 'phone' && styles.prefBtnActive]}
              onPress={() => setContactPref('phone')}
            >
              <Text style={[styles.prefBtnText, contactPref === 'phone' && styles.prefBtnTextActive]}>Phone Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmit} 
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Publish Listing</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const BG = '#0F0F1A';
const CARD_BG = '#1A1A2E';
const BORDER = '#2D2D44';
const ORANGE = '#FF6B35';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn: { padding: 8, marginLeft: -8 },
  backBtnText: { color: '#9CA3AF', fontSize: 16 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
  scroll: { padding: 20, paddingBottom: 100 },
  section: { backgroundColor: CARD_BG, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: BORDER, marginTop: 24 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { color: '#D1D5DB', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  subLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 4 },
  input: { backgroundColor: '#12121F', borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 14, color: '#FFF', fontSize: 16 },
  inputSmall: { backgroundColor: '#12121F', borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 10, color: '#FFF', fontSize: 14 },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  inputGroup: { flex: 1 },
  switchGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#12121F', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: BORDER },
  prefBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: BORDER, backgroundColor: '#12121F' },
  prefBtnActive: { borderColor: ORANGE, backgroundColor: 'rgba(255, 107, 53, 0.1)' },
  prefBtnText: { color: '#9CA3AF', fontWeight: '600' },
  prefBtnTextActive: { color: ORANGE, fontWeight: '700' },
  submitBtn: { backgroundColor: ORANGE, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 32 },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  radioGroup: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  radioBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: BORDER, backgroundColor: '#12121F' },
  radioBtnActive: { borderColor: ORANGE, backgroundColor: 'rgba(255, 107, 53, 0.1)' },
  radioText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  
  clothesContainer: { marginTop: 24 },
  clothItemCard: { backgroundColor: CARD_BG, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  itemTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  removeText: { color: '#EF4444', fontSize: 16, fontWeight: '600', padding: 4 },
  variantsHeader: { marginTop: 16, marginBottom: 4 },
  variantRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  variantActions: { justifyContent: 'flex-end', paddingBottom: 4 },
  delBtn: { width: 36, height: 40, backgroundColor: '#2D2D44', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  delBtnText: { color: '#FFF', fontSize: 14 },
  addSizeBtn: { marginTop: 8, paddingVertical: 8 },
  addSizeBtnText: { color: ORANGE, fontWeight: '600', fontSize: 14 },
  addItemBtn: { backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: ORANGE, borderStyle: 'dashed', padding: 16, borderRadius: 16, alignItems: 'center' },
  addItemBtnText: { color: ORANGE, fontWeight: '700', fontSize: 16 },
});
