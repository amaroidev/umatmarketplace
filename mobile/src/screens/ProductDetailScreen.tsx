import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import productService from '../services/product.service';
import savedService from '../services/saved.service';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';

const ProductDetailScreen = ({ route }: any) => {
  const { productId } = route.params;
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productService.getProductById(productId);
        if (res.success) setProduct(res.data.product);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!product || !user) return;
    if (product.seller?._id === user._id) return;
    savedService.isSaved(product._id).then((res) => {
      if (res.success) setIsSaved(res.data.isSaved);
    }).catch(() => {});
  }, [product, user]);

  const handleToggleSaved = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const res = await savedService.toggleSavedItem(product._id);
      if (res.success) setIsSaved(res.data.saved);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !product) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: product.images?.[0]?.url || 'https://placehold.co/800x480/e2e8f0/64748b?text=Product' }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.price}>
          GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.badge}>{product.condition}</Text>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.desc}>{product.description}</Text>

        <Text style={styles.sectionTitle}>Seller</Text>
        <Text style={styles.meta}>{product.seller?.name || 'Seller'}</Text>
        <Text style={styles.meta}>{product.pickupLocation || 'UMaT Campus'}</Text>

        {user && user._id !== product.seller?._id && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleToggleSaved}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{isSaved ? 'Remove from Saved' : 'Save Item'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  image: { width: '100%', height: 260, backgroundColor: '#e5e7eb' },
  content: { padding: 16 },
  price: { fontSize: 24, fontWeight: '800', color: '#2563eb' },
  title: { marginTop: 8, fontSize: 20, fontWeight: '700', color: '#111827' },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    color: '#3730a3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    textTransform: 'capitalize',
  },
  sectionTitle: { marginTop: 18, fontSize: 16, fontWeight: '700', color: '#111827' },
  desc: { marginTop: 8, fontSize: 14, lineHeight: 21, color: '#374151' },
  meta: { marginTop: 6, fontSize: 14, color: '#4b5563' },
  saveBtn: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default ProductDetailScreen;
