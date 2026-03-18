import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import orderService, { Order } from '../services/order.service';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  paid: { bg: '#dbeafe', text: '#1e40af' },
  confirmed: { bg: '#e0e7ff', text: '#3730a3' },
  ready: { bg: '#d1fae5', text: '#065f46' },
  completed: { bg: '#d1fae5', text: '#065f46' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c' },
  disputed: { bg: '#fce7f3', text: '#9d174d' },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const OrdersScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'purchases' | 'sales'>('purchases');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(
    async (withLoader = true) => {
      if (withLoader) setLoading(true);
      try {
        const res =
          tab === 'purchases'
            ? await orderService.getMyPurchases()
            : await orderService.getMySales();
        if (res.success) setOrders(res.data.orders);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const renderItem = ({ item }: { item: Order }) => {
    const colors = STATUS_COLORS[item.status] ?? { bg: '#f3f4f6', text: '#6b7280' };
    const firstItem = item.items[0];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
      >
        <View style={styles.cardTop}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.itemTitle} numberOfLines={1}>
          {firstItem?.title ?? 'Item'}
          {item.items.length > 1 ? ` +${item.items.length - 1} more` : ''}
        </Text>

        <View style={styles.cardBottom}>
          <Text style={styles.amount}>
            GHS {item.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>

        {tab === 'purchases' ? (
          <Text style={styles.party}>Seller: {item.seller?.name ?? '—'}</Text>
        ) : (
          <Text style={styles.party}>Buyer: {item.buyer?.name ?? '—'}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'purchases' && styles.tabActive]}
          onPress={() => setTab('purchases')}
        >
          <Text style={[styles.tabText, tab === 'purchases' && styles.tabTextActive]}>
            My Purchases
          </Text>
        </TouchableOpacity>
        {user?.role !== 'buyer' && (
          <TouchableOpacity
            style={[styles.tab, tab === 'sales' && styles.tabActive]}
            onPress={() => setTab('sales')}
          >
            <Text style={[styles.tabText, tab === 'sales' && styles.tabTextActive]}>
              My Sales
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOrders(false);
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No orders found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#f4ecdd',
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1f1a14', textTransform: 'uppercase' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fffdf8',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#1f1a14' },
  tabText: { fontSize: 11, fontWeight: '800', color: '#7b6f61', textTransform: 'uppercase', letterSpacing: 1.1 },
  tabTextActive: { color: '#1f1a14', fontWeight: '900' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 0,
    padding: 14,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 12, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  itemTitle: { marginTop: 6, fontSize: 15, fontWeight: '600', color: '#111827' },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  amount: { fontSize: 16, fontWeight: '800', color: '#2f5d4f' },
  date: { fontSize: 12, color: '#9ca3af' },
  party: { marginTop: 6, fontSize: 12, color: '#6b7280' },
  emptyWrap: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6b7280' },
});

export default OrdersScreen;
