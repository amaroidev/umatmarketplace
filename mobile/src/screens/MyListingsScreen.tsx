import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../services/api';
import productService from '../services/product.service';
import { Product } from '../types';
import { colors } from '../theme';

const MyListingsScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchListings = useCallback(async (withLoader = true) => {
    if (withLoader) setLoading(true);
    try {
      const response = await api.get('/products/my/listings', { params: { limit: 30 } });
      if (response.data.success) setProducts(response.data.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleDuplicate = async (id: string) => {
    try {
      await productService.duplicateProduct(id);
      Alert.alert('Success', 'Listing duplicated.');
      fetchListings(false);
    } catch {
      Alert.alert('Error', 'Failed to duplicate listing.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
      <FlatList
        style={styles.container}
      contentContainerStyle={styles.content}
      data={products}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchListings(false); }} />}
      ListHeaderComponent={<Text style={styles.header}>My Listings</Text>}
      ListEmptyComponent={<Text style={styles.empty}>No listings yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Image
            source={{ uri: item.images?.[0]?.url || 'https://placehold.co/160x160/e2e8f0/64748b?text=Item' }}
            style={styles.image}
          />
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.price}>GHS {item.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</Text>
            <Text style={styles.status}>{item.status.toUpperCase()} · {item.views} views</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}>
                <Text style={styles.secondaryBtnText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => handleDuplicate(item._id)}>
                <Text style={styles.primaryBtnText}>Duplicate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { fontSize: 28, fontWeight: '900', color: '#1f1a14', marginBottom: 16, textTransform: 'uppercase' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
  card: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: '#fffdf8', borderWidth: 1, borderColor: colors.border, borderRadius: 0, marginBottom: 12 },
  image: { width: 88, height: 88, borderRadius: 10, backgroundColor: '#e5e7eb' },
  meta: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  price: { marginTop: 6, fontSize: 14, fontWeight: '700', color: '#111827' },
  status: { marginTop: 4, fontSize: 11, color: '#7b6f61', textTransform: 'uppercase', letterSpacing: 0.8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primaryBtn: { backgroundColor: '#1f1a14', paddingVertical: 10, paddingHorizontal: 14 },
  primaryBtnText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, paddingVertical: 10, paddingHorizontal: 14 },
  secondaryBtnText: { color: '#463d31', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
});

export default MyListingsScreen;
