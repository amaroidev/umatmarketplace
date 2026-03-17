import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import productService from '../services/product.service';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';

const formatPrice = (n: number) =>
  `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;

const ProductCard = ({
  item,
  onPress,
}: {
  item: Product;
  onPress: () => void;
}) => {
  const image = item.images?.[0]?.url;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: image || 'https://placehold.co/200x160/e2e8f0/64748b?text=Item' }}
        style={styles.cardImage}
      />
      {item.isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>FEATURED</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {item.condition} · {item.pickupLocation || 'UMaT'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (withLoader = true) => {
    if (withLoader) setLoading(true);
    try {
      const [featuredRes, recentRes] = await Promise.all([
        productService.getProducts({ limit: 8, sort: 'featured' }),
        productService.getProducts({ limit: 20, sort: 'newest' }),
      ]);
      if (featuredRes.success) setFeatured(featuredRes.data.filter((p) => p.isFeatured).slice(0, 6));
      if (recentRes.success) setRecent(recentRes.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    navigation.navigate('ProductsTab', { screen: 'ProductsHome', params: { search } });
  };

  const openBrowse = () => navigation.navigate('ProductsTab', { screen: 'ProductsHome' });

  const goToProduct = (productId: string) =>
    navigation.navigate('ProductsTab', { screen: 'ProductDetail', params: { productId } });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(false); }} />
      }
    >
      {/* Hero / Search */}
      <View style={styles.hero}>
        <Text style={styles.heroGreeting}>
          {user ? `Hey, ${user.name.split(' ')[0]} 👋` : 'UMaT Marketplace'}
        </Text>
        <Text style={styles.heroSubtitle}>Find great deals on campus.</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Go</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.secondaryHeroBtn} onPress={openBrowse}>
          <Text style={styles.secondaryHeroBtnText}>Browse all listings</Text>
        </TouchableOpacity>
      </View>

      {/* Featured */}
      {featured.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>SPOTLIGHT</Text>
            <Text style={styles.sectionTitle}>Featured Listings</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {featured.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={styles.featuredCard}
                onPress={() => goToProduct(item._id)}
              >
                <Image
                  source={{ uri: item.images?.[0]?.url || 'https://placehold.co/240x160/e2e8f0/64748b?text=Item' }}
                  style={styles.featuredImage}
                />
                <View style={styles.featuredOverlay} />
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.featuredPrice}>{formatPrice(item.price)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>LATEST</Text>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
        </View>
        <FlatList
          data={recent}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ProductCard item={item} onPress={() => goToProduct(item._id)} />
          )}
          numColumns={2}
          columnWrapperStyle={styles.grid}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No listings yet. Be the first to post!</Text>
          }
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  // Hero
  hero: {
    backgroundColor: '#111827',
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  heroGreeting: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 20 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#fff',
  },
  searchBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryHeroBtn: { marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', paddingVertical: 12, alignItems: 'center' },
  secondaryHeroBtnText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  // Sections
  section: { paddingTop: 24, paddingBottom: 8 },
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.5 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 2 },
  // Featured horizontal scroll
  hScroll: { paddingHorizontal: 16, gap: 12 },
  featuredCard: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  featuredImage: { width: '100%', height: '100%', position: 'absolute' },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  featuredInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  featuredTitle: { fontSize: 13, fontWeight: '700', color: '#fff', lineHeight: 16 },
  featuredPrice: { marginTop: 3, fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  // Grid
  grid: { paddingHorizontal: 12, gap: 10, marginBottom: 10 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardImage: { width: '100%', height: 120, backgroundColor: '#e5e7eb' },
  featuredBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  cardBody: { padding: 8 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
  cardPrice: { marginTop: 4, fontSize: 14, fontWeight: '700', color: '#2563eb' },
  cardMeta: { marginTop: 2, fontSize: 11, color: '#9ca3af' },
  emptyText: { textAlign: 'center', color: '#9ca3af', padding: 24 },
});

export default HomeScreen;
