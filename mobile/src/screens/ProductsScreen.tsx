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
import AsyncStorage from '@react-native-async-storage/async-storage';
import productService from '../services/product.service';
import { Product } from '../types';
import { colors } from '../theme';

const PRODUCTS_CACHE_KEY = 'products_cache_v1';

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
      if (res.success) {
        setProducts(res.data);
        await AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(res.data));
      }
    } catch {
      const cached = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
      if (cached) {
        setProducts(JSON.parse(cached));
      }
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
      <View style={styles.heroTop}>
        <Text style={styles.heroLabel}>Campus marketplace</Text>
        <Text style={styles.heroTitle}>Browse Listings</Text>
      </View>
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
  container: { flex: 1, backgroundColor: colors.bg },
  heroTop: {
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#f4ecdd',
  },
  heroLabel: { fontSize: 10, color: '#7c6f60', textTransform: 'uppercase', letterSpacing: 1.6, fontWeight: '800' },
  heroTitle: { marginTop: 4, fontSize: 22, color: colors.text, fontWeight: '900', textTransform: 'uppercase' },
  searchWrap: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchBtn: {
    backgroundColor: colors.text,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  filterChipText: { fontSize: 10, fontWeight: '800', color: '#6f6559', letterSpacing: 1.1 },
  filterChipTextActive: { color: '#fff' },
  listContent: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#fffdf8',
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: '100%', height: 160, backgroundColor: '#e5e7eb' },
  cardContent: { padding: 10 },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  price: { marginTop: 4, fontSize: 16, fontWeight: '800', color: '#2f5d4f' },
  meta: { marginTop: 4, fontSize: 11, color: '#7b6f61', textTransform: 'uppercase', letterSpacing: 0.8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  emptyText: { textAlign: 'center', color: '#7b6f61', marginTop: 40, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11, fontWeight: '700' },
});

export default ProductsScreen;
