import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import productService from '../services/product.service';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const CURATED_HERO_CARDS = [
  { id: 'study', title: 'Study essentials', subtitle: 'Textbooks, calculators, and practical kits', filter: 'books' },
  { id: 'hostel', title: 'Hostel upgrades', subtitle: 'Fans, mini-fridges, storage and comfort picks', filter: 'hostel' },
  { id: 'gadgets', title: 'Gadgets', subtitle: 'Phones, laptops, and accessories from students', filter: 'electronics' },
];

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
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSearch = () => {
    navigation.navigate('ProductsTab', { screen: 'ProductsHome', params: { search } });
  };

  const openBrowse = () => navigation.navigate('ProductsTab', { screen: 'ProductsHome', params: { search } });

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(false); }} />
        }
      >
        <ScreenHeader
          eyebrow="Campus marketplace"
          title="Home"
          subtitle="Curated highlights, featured drops, and fresh campus listings."
        />
        {/* Hero / Search */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim }]}> 
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
        </Animated.View>

      <View style={styles.quickSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>CURATED</Text>
          <Text style={styles.sectionTitle}>Shop by need</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {CURATED_HERO_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.curatedCard}
              onPress={() => navigation.navigate('ProductsTab', { screen: 'ProductsHome', params: { search: card.filter } })}
            >
              <Text style={styles.curatedCardTitle}>{card.title}</Text>
              <Text style={styles.curatedCardSubtitle}>{card.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
            <Text style={styles.emptyText}>No listings available yet. Check back shortly.</Text>
          }
        />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  // Hero
  hero: {
    backgroundColor: '#1f1a14',
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  heroGreeting: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 20 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#fff',
  },
  searchBtn: {
    backgroundColor: '#c57f3f',
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 },
  secondaryHeroBtn: { marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', paddingVertical: 12, alignItems: 'center', borderRadius: 0 },
  secondaryHeroBtnText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  // Sections
  section: { paddingTop: 24, paddingBottom: 8 },
  quickSection: { paddingTop: 20, paddingBottom: 6 },
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#7c6f60', letterSpacing: 1.8, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1f1a14', marginTop: 2, textTransform: 'uppercase' },
  // Featured horizontal scroll
  hScroll: { paddingHorizontal: 16, gap: 12 },
  curatedCard: {
    width: 220,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fffdf8',
    padding: 14,
  },
  curatedCardTitle: { fontSize: 14, fontWeight: '900', color: '#1f1a14', textTransform: 'uppercase', letterSpacing: 0.7 },
  curatedCardSubtitle: { marginTop: 6, fontSize: 12, color: '#7b6f61', lineHeight: 17 },
  featuredCard: {
    width: 200,
    height: 150,
    borderRadius: 0,
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
    backgroundColor: '#fffdf8',
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
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
  cardPrice: { marginTop: 4, fontSize: 14, fontWeight: '800', color: '#2f5d4f' },
  cardMeta: { marginTop: 2, fontSize: 10, color: '#9a8e7f', textTransform: 'uppercase', letterSpacing: 0.9 },
  emptyText: { textAlign: 'center', color: '#8f8478', padding: 24, textTransform: 'uppercase', letterSpacing: 1.1, fontWeight: '700', fontSize: 11 },
});

export default HomeScreen;
