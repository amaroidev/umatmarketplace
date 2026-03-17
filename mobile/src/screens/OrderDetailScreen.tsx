import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import orderService, { Order } from '../services/order.service';
import { useAuth } from '../context/AuthContext';

const STATUS_STEPS = ['pending', 'paid', 'confirmed', 'ready', 'completed'] as const;

const STEP_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  paid: 'Payment Received',
  confirmed: 'Seller Confirmed',
  ready: 'Ready for Pickup / Dispatch',
  completed: 'Completed',
};

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
  new Date(d).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const OrderDetailScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrderById(orderId);
      if (res.success) setOrder(res.data.order);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    navigation.setOptions({ headerShown: true, title: 'Order Details', headerBackTitle: 'Back' });
    fetchOrder();
  }, [fetchOrder, navigation]);

  const isSeller = order?.seller?._id === user?._id;

  const handleUpdateStatus = (newStatus: string) => {
    Alert.alert('Update Status', `Mark order as "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setActionLoading(true);
          try {
            const res = await orderService.updateStatus(orderId, newStatus);
            if (res.success) setOrder(res.data.order);
          } catch {
            Alert.alert('Error', 'Could not update status.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            const res = await orderService.cancelOrder(orderId, 'Cancelled by user');
            if (res.success) setOrder(res.data.order);
          } catch {
            Alert.alert('Error', 'Could not cancel order.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading || !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const colors = STATUS_COLORS[order.status] ?? { bg: '#f3f4f6', text: '#6b7280' };
  const currentStepIdx = STATUS_STEPS.indexOf(order.status as any);
  const isCancelledOrDisputed = ['cancelled', 'disputed'].includes(order.status);

  // Seller next status map
  const nextStatusMap: Record<string, string> = {
    paid: 'confirmed',
    confirmed: 'ready',
    ready: 'completed',
  };
  const nextStatus = isSeller ? nextStatusMap[order.status] : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.statusText, { color: colors.text }]}>
            {order.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Timeline */}
      {!isCancelledOrDisputed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Status</Text>
          {STATUS_STEPS.map((step, idx) => {
            const done = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <View key={step} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.dot,
                      done && styles.dotDone,
                      isCurrent && styles.dotCurrent,
                    ]}
                  />
                  {idx < STATUS_STEPS.length - 1 && (
                    <View style={[styles.connector, done && styles.connectorDone]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>
                    {STEP_LABELS[step]}
                  </Text>
                  {isCurrent && (
                    <Text style={styles.currentBadge}>Current</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.itemQty}>
              <Text style={styles.itemQtyText}>{item.quantity}×</Text>
            </View>
            <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.itemPrice}>
              GHS {(item.price * item.quantity).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailKey}>Delivery</Text>
          <Text style={styles.detailValue}>{order.deliveryMethod}</Text>
        </View>
        {order.pickupLocation && (
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Pickup at</Text>
            <Text style={styles.detailValue}>{order.pickupLocation}</Text>
          </View>
        )}
        {order.deliveryAddress && (
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Deliver to</Text>
            <Text style={styles.detailValue}>{order.deliveryAddress}</Text>
          </View>
        )}
        {order.note && (
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Note</Text>
            <Text style={styles.detailValue}>{order.note}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailKey}>Placed</Text>
          <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailKey}>{isSeller ? 'Buyer' : 'Seller'}</Text>
          <Text style={styles.detailValue}>
            {isSeller ? order.buyer?.name : order.seller?.name}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {!isCancelledOrDisputed && (
        <View style={styles.actions}>
          {isSeller && nextStatus && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary, actionLoading && { opacity: 0.6 }]}
              onPress={() => handleUpdateStatus(nextStatus)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionBtnTextWhite}>
                  Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {order.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger, actionLoading && { opacity: 0.6 }]}
              onPress={handleCancel}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnTextRed}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumber: { fontSize: 13, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  section: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Timeline
  timelineRow: { flexDirection: 'row', minHeight: 44 },
  timelineLeft: { width: 24, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#d1d5db', borderWidth: 2, borderColor: '#d1d5db' },
  dotDone: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  dotCurrent: { backgroundColor: '#fff', borderColor: '#2563eb', borderWidth: 3 },
  connector: { flex: 1, width: 2, backgroundColor: '#e5e7eb', marginTop: 2 },
  connectorDone: { backgroundColor: '#2563eb' },
  timelineContent: { flex: 1, paddingLeft: 10, paddingBottom: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stepLabel: { fontSize: 13, color: '#9ca3af' },
  stepLabelDone: { color: '#111827', fontWeight: '500' },
  currentBadge: { fontSize: 10, fontWeight: '700', color: '#2563eb', backgroundColor: '#dbeafe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  // Items
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  itemQty: { width: 28, height: 28, backgroundColor: '#f3f4f6', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  itemQtyText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  itemTitle: { flex: 1, fontSize: 14, color: '#374151' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#111827' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  totalAmount: { fontSize: 16, fontWeight: '800', color: '#111827' },
  // Details
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 12 },
  detailKey: { fontSize: 13, color: '#6b7280', flexShrink: 0 },
  detailValue: { fontSize: 13, color: '#111827', fontWeight: '500', textAlign: 'right', flex: 1 },
  // Actions
  actions: { gap: 10, marginTop: 4 },
  actionBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionBtnPrimary: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  actionBtnDanger: { backgroundColor: '#fff', borderColor: '#fca5a5' },
  actionBtnTextWhite: { color: '#fff', fontWeight: '700', fontSize: 15 },
  actionBtnTextRed: { color: '#b91c1c', fontWeight: '700', fontSize: 15 },
});

export default OrderDetailScreen;
