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
import { SafeAreaView } from 'react-native-safe-area-context';
import savedService from '../services/saved.service';
import { Product } from '../types';
import { colors } from '../theme';

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
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: 12, gap: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  card: {
    backgroundColor: '#fffdf8',
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: '100%', height: 150, backgroundColor: '#e5e7eb' },
  content: { padding: 10 },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  price: { marginTop: 4, fontSize: 16, fontWeight: '800', color: '#2f5d4f' },
  empty: { textAlign: 'center', marginTop: 50, color: '#7c6f60', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', fontSize: 11 },
});

export default SavedScreen;
