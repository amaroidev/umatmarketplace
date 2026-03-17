import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  BarChart2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../services/order.service';
import { LoadingSpinner } from '../components/ui';
import {
  OrderPopulated,
  OrderStatus,
  ORDER_STATUS_LABELS,
  PaginationInfo,
} from '../types';

const TRACKING_PIPELINE: { status: string; label: string }[] = [
  { status: 'pending', label: 'Placed' },
  { status: 'paid', label: 'Paid' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'ready', label: 'Ready' },
  { status: 'completed', label: 'Done' },
];
const PIPELINE_ORDER = TRACKING_PIPELINE.map((s) => s.status);

const STATUS_TABS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'paid', label: 'New / Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const NEXT_STATUS: Record<string, { status: string; label: string }> = {
  paid: { status: 'confirmed', label: 'Confirm Order' },
  confirmed: { status: 'ready', label: 'Mark Ready' },
  ready: { status: 'completed', label: 'Mark Complete' },
};

// Flat status badge colors using earth/semantic palette
const STATUS_BADGE: Record<string, string> = {
  paid: 'bg-earth-100 text-earth-800',
  confirmed: 'bg-earth-200 text-earth-900',
  ready: 'bg-earth-900 text-white',
  completed: 'bg-earth-900 text-white',
  cancelled: 'bg-red-50 text-red-700',
  pending: 'bg-earth-100 text-earth-600',
};

interface SellerStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

const SellerOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getMySales(statusFilter || undefined, page, 20);
      if (res.success) {
        setOrders(res.data.orders);
        setPagination(res.pagination);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await orderService.getSellerStats();
      if (res.success) setStats(res.data.stats);
    } catch {
      // silent
    }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter, page]);
  useEffect(() => { fetchStats(); }, []);

  const handleTabChange = (status: OrderStatus | '') => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await orderService.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => o._id === orderId ? { ...o, status: newStatus as OrderStatus } : o)
        );
        toast.success(`Order ${newStatus}`);
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setUpdatingId(orderId);
    try {
      const res = await orderService.cancelOrder(orderId, 'Seller cancelled');
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => o._id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o)
        );
        toast.success('Order cancelled');
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page-container max-w-5xl">
      {/* Page header */}
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-2">Dashboard</p>
      <div className="flex items-end justify-between mb-1">
        <h1 className="text-3xl font-black text-earth-900 uppercase tracking-tight">
          Seller Orders
        </h1>
        <Link
          to="/seller/analytics"
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-earth-400 hover:text-earth-900 border border-earth-200 hover:border-earth-400 px-3 py-2 transition-colors"
        >
          <BarChart2 className="h-3.5 w-3.5" />
          Analytics
        </Link>
      </div>
      <div className="h-px bg-earth-200 mb-8" />

      {/* Stats mosaic */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-earth-200 mb-8">
          <div className="bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400 mb-3 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Total
            </p>
            <p className="text-3xl font-black text-earth-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400 mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Pending
            </p>
            <p className="text-3xl font-black text-earth-900">{stats.pendingOrders}</p>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400 mb-3 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Completed
            </p>
            <p className="text-3xl font-black text-earth-900">{stats.completedOrders}</p>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400 mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Revenue
            </p>
            <p className="text-2xl font-black text-earth-900">
              GHS {stats.totalRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Status tabs — underline style */}
      <div className="flex gap-0 border-b border-earth-200 mb-6 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value as OrderStatus | '')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] whitespace-nowrap border-b-2 -mb-px transition-colors ${
              statusFilter === tab.value
                ? 'border-earth-900 text-earth-900'
                : 'border-transparent text-earth-400 hover:text-earth-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <LoadingSpinner text="Loading orders..." />
      ) : orders.length === 0 ? (
        <div className="border border-earth-200 py-20 text-center">
          <Package className="h-14 w-14 text-earth-200 mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-1">No results</p>
          <p className="text-sm text-earth-500">
            {statusFilter ? `No ${statusFilter} orders` : 'No incoming orders yet'}
          </p>
        </div>
      ) : (
        <div className="border border-earth-200 divide-y divide-earth-100">
          {orders.map((order) => {
            const item = order.items[0];
            const nextAction = NEXT_STATUS[order.status];
            const isUpdating = updatingId === order._id;
            const canSellerCancel = ['paid', 'confirmed'].includes(order.status);
            const badgeClass = STATUS_BADGE[order.status] ?? 'bg-earth-100 text-earth-700';

            return (
              <div key={order._id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Product image — square */}
                  <div className="w-16 h-16 bg-earth-100 flex-shrink-0 overflow-hidden">
                    {item?.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-earth-300">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h3 className="font-bold text-earth-900 text-sm truncate uppercase tracking-tight">
                          {item?.title || 'Unknown Product'}
                        </h3>
                        <p className="text-xs text-earth-400 font-mono mt-0.5">
                          #{order.orderNumber} &middot; {order.buyer.name}
                        </p>
                      </div>
                      <span className="font-black text-earth-900 text-sm whitespace-nowrap">
                        GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${badgeClass}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                      <span className="text-xs text-earth-400 capitalize">{order.deliveryMethod}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {nextAction && (
                        <button
                          onClick={() => handleUpdateStatus(order._id, nextAction.status)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 bg-earth-900 text-white text-xs font-bold uppercase tracking-[0.1em] hover:bg-earth-700 disabled:opacity-50 transition-colors"
                        >
                          {isUpdating ? '...' : nextAction.label}
                        </button>
                      )}
                      {canSellerCancel && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-bold uppercase tracking-[0.1em] hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          Cancel
                        </button>
                      )}
                      <Link
                        to={`/orders/${order._id}`}
                        className="ml-auto text-xs font-bold uppercase tracking-[0.1em] text-earth-500 hover:text-earth-900 flex items-center gap-0.5 transition-colors"
                      >
                        Details
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>

                {order.note && (
                  <div className="mt-3 pt-3 border-t border-earth-100 text-xs text-earth-600">
                    <span className="font-bold text-earth-700 uppercase tracking-wide">Note: </span>
                    {order.note}
                  </div>
                )}

                {/* Mini tracking strip — only for active orders */}
                {!['cancelled', 'disputed'].includes(order.status) && (
                  <div className="mt-3 pt-3 border-t border-earth-100">
                    <div className="flex items-center gap-0">
                      {TRACKING_PIPELINE.map((step, idx) => {
                        const stepIdx = PIPELINE_ORDER.indexOf(order.status);
                        const isDone = idx < stepIdx;
                        const isCurrent = idx === stepIdx;
                        return (
                          <React.Fragment key={step.status}>
                            <div className="flex flex-col items-center">
                              <div className={`w-4 h-4 flex items-center justify-center ${
                                isDone
                                  ? 'bg-earth-900'
                                  : isCurrent
                                  ? 'bg-earth-900 ring-2 ring-earth-200'
                                  : 'bg-earth-100'
                              }`}>
                                {isDone && <CheckCircle className="h-2.5 w-2.5 text-white" />}
                              </div>
                              <span className={`text-[8px] font-bold uppercase tracking-wide mt-0.5 ${
                                isDone || isCurrent ? 'text-earth-700' : 'text-earth-300'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                            {idx < TRACKING_PIPELINE.length - 1 && (
                              <div className={`flex-1 h-px mx-0.5 mb-3.5 ${idx < stepIdx ? 'bg-earth-900' : 'bg-earth-100'}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-xs text-earth-300 font-mono mt-2">
                  {new Date(order.createdAt).toLocaleDateString('en-GH', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-5 py-2 border border-earth-300 text-xs font-bold uppercase tracking-[0.15em] text-earth-700 hover:border-earth-900 hover:text-earth-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400">
            {page} / {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-5 py-2 border border-earth-300 text-xs font-bold uppercase tracking-[0.15em] text-earth-700 hover:border-earth-900 hover:text-earth-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
