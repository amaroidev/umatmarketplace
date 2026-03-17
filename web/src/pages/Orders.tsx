import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../services/order.service';
import { LoadingSpinner } from '../components/ui';
import {
  OrderPopulated,
  OrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PaginationInfo,
} from '../types';

const STATUS_TABS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getMyPurchases(
        statusFilter || undefined,
        page,
        20
      );
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

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const handleTabChange = (status: OrderStatus | '') => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div className="page-container max-w-4xl">
      {/* Header */}
      <div className="mb-8 pt-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-2">Account</p>
        <h1 className="text-3xl font-black text-earth-900 uppercase tracking-tight">My Orders</h1>
        <div className="h-px bg-earth-200 mt-4" />
      </div>

      {/* Status tabs */}
      <div className="flex gap-0 overflow-x-auto mb-8 border-b border-earth-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value as OrderStatus | '')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] whitespace-nowrap border-b-2 -mb-px transition-colors ${
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
        <div className="text-center py-20">
          <ShoppingBag className="h-14 w-14 text-earth-200 mx-auto mb-5" />
          <h3 className="text-lg font-bold text-earth-700 uppercase tracking-wide mb-2">No orders found</h3>
          <p className="text-earth-500 mb-6 text-sm">
            {statusFilter
              ? `You don't have any ${statusFilter} orders`
              : "You haven't made any purchases yet"}
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-earth-900 text-white text-xs font-bold uppercase tracking-[0.15em] hover:bg-earth-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="border border-earth-200 divide-y divide-earth-100">
          {orders.map((order) => {
            const item = order.items[0];
            return (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="flex items-center gap-4 p-4 bg-white hover:bg-earth-50 transition-colors group"
              >
                {/* Product image */}
                <div className="w-14 h-14 overflow-hidden bg-earth-100 flex-shrink-0">
                  {item?.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-earth-300">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-earth-900 text-sm truncate">
                        {item?.title || 'Unknown Product'}
                      </h3>
                      <p className="text-xs text-earth-500 mt-0.5">
                        #{order.orderNumber} &middot; {order.seller.name}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-earth-300 group-hover:text-earth-600 flex-shrink-0 mt-0.5 transition-colors" />
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <span className="font-bold text-earth-900 text-sm">
                      GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <p className="text-xs text-earth-400 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('en-GH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-8 border-t border-earth-200 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-earth-300 text-earth-700 hover:bg-earth-100 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-earth-500 uppercase tracking-[0.15em]">
            {page} / {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-earth-300 text-earth-700 hover:bg-earth-100 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Orders;
