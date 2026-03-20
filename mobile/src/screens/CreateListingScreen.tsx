import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import productService from '../services/product.service';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

interface Category {
  _id: string;
  name: string;
}

const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor'] as const;
const DELIVERY_OPTIONS = [
  { value: 'pickup', label: 'Pickup Only' },
  { value: 'delivery', label: 'Delivery Only' },
  { value: 'both', label: 'Pickup & Delivery' },
] as const;

const CAMPUS_LOCATIONS = [
  'Main Gate',
  'Esther Hall',
  'Independence Hall',
  'Unity Hall',
  'Queens Hall',
  'Engineering Block',
  'Science Block',
  'Library',
  'Student Center',
  'Cafeteria',
];

const CreateListingScreen = ({ navigation }: any) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<string>('good');
  const [deliveryOption, setDeliveryOption] = useState<string>('pickup');
  const [pickupLocation, setPickupLocation] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  const [images, setImages] = useState<Array<{ uri: string; type?: string; name?: string }>>([]);

  useEffect(() => {
    navigation.setOptions({ headerShown: true, title: 'New Listing', headerBackTitle: 'Back' });
    api.get('/categories/with-counts').then((res) => {
      if (res.data.success) setCategories(res.data.data.categories ?? res.data.data ?? []);
    }).catch(() => {}).finally(() => setCatLoading(false));
  }, [navigation]);

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Required', 'Please enter a title.');
    if (!price || isNaN(Number(price))) return Alert.alert('Required', 'Please enter a valid price.');
    if (!category) return Alert.alert('Required', 'Please select a category.');

    setLoading(true);
    try {
      const res = await productService.createProduct({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        condition,
        deliveryOption,
        pickupLocation: pickupLocation.trim() || 'UMaT Campus',
        status,
        tags: tags.split(',').map((item) => item.trim()).filter(Boolean),
        images,
      });

      if (res.success) {
        Alert.alert('Success', 'Listing created!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to create listing.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert('Permission needed', 'Allow photo library access to upload listing images.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      const picked = result.assets.slice(0, 5).map((asset, idx) => ({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `listing-${Date.now()}-${idx}.jpg`,
      }));
      setImages(picked);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader eyebrow="Seller workspace" title="Create Listing" subtitle="Post a product with web-consistent details and style." />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Images</Text>
        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImages}>
          <Text style={styles.imagePickerBtnText}>{images.length > 0 ? 'Change photos' : 'Add product photos'}</Text>
        </TouchableOpacity>
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
            {images.map((img, idx) => (
              <Image key={`${img.uri}-${idx}`} source={{ uri: img.uri }} style={styles.previewImage} />
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="What are you selling?"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe your item..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={2000}
        />

        <Text style={styles.label}>Price (GHS) *</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Category *</Text>
        {catLoading ? (
          <ActivityIndicator style={{ marginVertical: 12 }} color={colors.accent} />
        ) : categories.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat._id}
                style={[styles.chip, category === cat._id && styles.chipActive]}
                onPress={() => setCategory(cat._id)}
              >
                <Text style={[styles.chipText, category === cat._id && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyCategoryBox}>
            <Text style={styles.emptyCategoryText}>No categories found. Seed categories on server.</Text>
          </View>
        )}

        <Text style={styles.label}>Condition *</Text>
        <View style={styles.chipRow}>
          {CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, condition === c && styles.chipActive]}
              onPress={() => setCondition(c)}
            >
              <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Delivery Option *</Text>
        <View style={styles.chipRow}>
          {DELIVERY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, deliveryOption === opt.value && styles.chipActive]}
              onPress={() => setDeliveryOption(opt.value)}
            >
              <Text style={[styles.chipText, deliveryOption === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {(deliveryOption === 'pickup' || deliveryOption === 'both') && (
          <>
            <Text style={styles.label}>Pickup Location</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {CAMPUS_LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.chip, pickupLocation === loc && styles.chipActive]}
                  onPress={() => setPickupLocation(loc)}
                >
                  <Text style={[styles.chipText, pickupLocation === loc && styles.chipTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Or enter custom pickup location"
              placeholderTextColor="#9a8e7f"
              value={pickupLocation}
              onChangeText={setPickupLocation}
            />
          </>
        )}

        <Text style={styles.label}>Tags</Text>
        <TextInput
          style={styles.input}
          placeholder="phone, hostel, calculator"
          value={tags}
          onChangeText={setTags}
        />

        <Text style={styles.label}>Listing Status</Text>
        <View style={styles.chipRow}>
          {[
            { value: 'active', label: 'Publish Now' },
            { value: 'draft', label: 'Save Draft' },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.chip, status === item.value && styles.chipActive]}
              onPress={() => setStatus(item.value as 'active' | 'draft')}
            >
              <Text style={[styles.chipText, status === item.value && styles.chipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6f6559',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.text,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  chipScroll: { marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emptyCategoryBox: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 10,
    padding: 12,
  },
  emptyCategoryText: {
    color: '#9a3412',
    fontSize: 12,
    fontWeight: '600',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  imagePickerBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fffdf8',
    paddingVertical: 12,
    alignItems: 'center',
  },
  imagePickerBtnText: {
    fontSize: 11,
    color: '#3e352b',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  previewScroll: { marginTop: 8, marginBottom: 8 },
  previewImage: { width: 90, height: 90, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  submitBtn: {
    marginTop: 28,
    backgroundColor: colors.text,
    paddingVertical: 14,
    borderRadius: 0,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default CreateListingScreen;
