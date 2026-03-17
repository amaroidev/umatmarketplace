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
} from 'react-native';
import api from '../services/api';
import productService from '../services/product.service';

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

  useEffect(() => {
    navigation.setOptions({ headerShown: true, title: 'New Listing', headerBackTitle: 'Back' });
    api.get('/categories').then((res) => {
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
          <ActivityIndicator style={{ marginVertical: 12 }} color="#2563eb" />
        ) : (
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
            <TextInput
              style={styles.input}
              placeholder="e.g. Gate B, UMaT Campus"
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  chipScroll: { marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  submitBtn: {
    marginTop: 28,
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default CreateListingScreen;
