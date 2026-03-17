import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import savedService from '../services/saved.service';
import { Product } from '../types';

const SavedScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = async (withLoader = true) => {
    if (withLoader) setLoading(true);
    try {
      const res = await savedService.getSavedItems(1, 50);
      if (res.success) setProducts(res.data.products);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => fetchSaved());
    return unsub;
  }, [navigation]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      data={products}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchSaved(false);
          }}
        />
      }
      renderItem={({ item }: { item: Product }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.getParent()?.navigate('ProductsTab', {
            screen: 'ProductDetail',
            params: { productId: item._id },
          })}
        >
          <Image
            source={{ uri: item.images?.[0]?.url || 'https://placehold.co/200x160/e2e8f0/64748b?text=Saved' }}
            style={styles.image}
          />
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.price}>
              GHS {item.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No saved items yet.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  listContent: { padding: 12, gap: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  image: { width: '100%', height: 150, backgroundColor: '#e5e7eb' },
  content: { padding: 10 },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  price: { marginTop: 4, fontSize: 16, fontWeight: '700', color: '#2563eb' },
  empty: { textAlign: 'center', marginTop: 50, color: '#6b7280' },
});

export default SavedScreen;
