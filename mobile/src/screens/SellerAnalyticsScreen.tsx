import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import productService from '../services/product.service';

const SellerAnalyticsScreen = () => {
  const [stats, setStats] = useState<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getSellerStats()
      .then((res) => {
        if (res.success) setStats(res.data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>SELLER OVERVIEW</Text>
      <Text style={styles.title}>Performance Snapshot</Text>

      <View style={styles.grid}>
        {[
          { label: 'Total Orders', value: stats?.totalOrders ?? 0 },
          { label: 'Pending Orders', value: stats?.pendingOrders ?? 0 },
          { label: 'Completed Orders', value: stats?.completedOrders ?? 0 },
          { label: 'Revenue', value: `GHS ${(stats?.totalRevenue ?? 0).toFixed(2)}` },
        ].map((item) => (
          <View key={item.label} style={styles.card}>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Next growth tools</Text>
        <Text style={styles.noteText}>
          Coupons, bundle offers, and featured boosts can build on this seller analytics view next.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: '#9ca3af', marginTop: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 6, marginBottom: 18 },
  grid: { gap: 12 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', padding: 18, borderRadius: 14 },
  cardLabel: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 },
  cardValue: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 6 },
  noteCard: { marginTop: 16, backgroundColor: '#111827', padding: 18, borderRadius: 14 },
  noteTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  noteText: { color: 'rgba(255,255,255,0.68)', fontSize: 13, lineHeight: 20, marginTop: 8 },
});

export default SellerAnalyticsScreen;
