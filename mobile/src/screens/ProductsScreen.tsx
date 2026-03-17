import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import productService from '../services/product.service';
import { Product } from '../types';

const ProductsScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'popular' | 'featured'>('newest');

  const fetchProducts = async (withLoader = true) => {
    if (withLoader) setLoading(true);
    try {
      const res = await productService.getProducts({ limit: 30, search: search || undefined, sort });
      if (res.success) setProducts(res.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const renderItem = ({ item }: { item: Product }) => {
    const image = item.images?.[0]?.url;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
      >
        <Image source={{ uri: image || 'https://placehold.co/200x160/e2e8f0/64748b?text=Product' }} style={styles.image} />
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.price}>
            GHS {item.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {item.category?.name || 'Category'} • {item.pickupLocation || 'UMaT Campus'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products"
          value={search}
          onChangeText={(value: string) => setSearch(value)}
          onSubmitEditing={() => fetchProducts()}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => fetchProducts()}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(['newest', 'popular', 'featured'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.filterChip, sort === option && styles.filterChipActive]}
            onPress={() => {
              setSort(option);
              setTimeout(() => fetchProducts(false), 0);
            }}
          >
            <Text style={[styles.filterChipText, sort === option && styles.filterChipTextActive]}>{option.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchProducts(false);
              }}
            />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchWrap: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff' },
  searchInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 10, backgroundColor: '#fff' },
  filterChip: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterChipText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  filterChipTextActive: { color: '#fff' },
  listContent: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  image: { width: '100%', height: 160, backgroundColor: '#e5e7eb' },
  cardContent: { padding: 10 },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  price: { marginTop: 4, fontSize: 16, fontWeight: '700', color: '#2563eb' },
  meta: { marginTop: 4, fontSize: 12, color: '#6b7280' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
});

export default ProductsScreen;
