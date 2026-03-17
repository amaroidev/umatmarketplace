import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle,
  BarChart2,
  ArrowRight,
  Package,
} from 'lucide-react';
import orderService from '../services/order.service';
import productService from '../services/product.service';

const labelBase = 'text-[9px] font-bold uppercase tracking-[0.28em] text-earth-400';

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  paid: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ready: 'bg-purple-50 text-purple-700 border-purple-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  disputed: 'bg-orange-50 text-orange-700 border-orange-200',
};

const SellerAnalyticsPage: React.FC = () => {
  const [_tab] = useState<'overview' | 'orders'>('overview');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['sellerStats'],
    queryFn: () => orderService.getSellerStats(),
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['mySales', undefined, 1, 10],
    queryFn: () => orderService.getMySales(undefined, 1, 10),
  });

  const { data: listingsData } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => productService.getMyListings({ limit: 6 } as any),
  });

  const stats = statsData?.data?.stats;
  const orders = salesData?.data?.orders ?? [];
  const listings = (listingsData as any)?.data ?? [];

  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const pendingOrders = stats?.pendingOrders ?? 0;
  const completedOrders = stats?.completedOrders ?? 0;
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const STAT_CARDS = [
    {
      label: 'Total Revenue',
      value: `GHS ${totalRevenue.toFixed(2)}`,
      icon: <DollarSign className="h-5 w-5" />,
      sub: 'Lifetime earnings',
    },
    {
      label: 'Total Orders',
      value: totalOrders,
      icon: <ShoppingBag className="h-5 w-5" />,
      sub: 'All time',
    },
    {
      label: 'Pending',
      value: pendingOrders,
      icon: <Clock className="h-5 w-5" />,
      sub: 'Awaiting action',
    },
    {
      label: 'Completed',
      value: completedOrders,
      icon: <CheckCircle className="h-5 w-5" />,
      sub: `${completionRate}% completion rate`,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white">

      {/* ── Hero ── */}
      <div className="bg-[#0a0a0a] px-6 pt-14 pb-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/20 mb-4">
            Seller / Analytics
          </p>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tight text-white">
                Analytics
              </h1>
              <p className="mt-2 text-sm text-white/35">
                Track your sales performance, revenue, and listing metrics.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/seller/orders"
                className="flex items-center gap-2 border border-white/20 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 hover:border-white/50 hover:text-white transition-colors"
              >
                All orders
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/sell"
                className="flex items-center gap-2 bg-white text-[#0a0a0a] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-earth-100 transition-colors"
              >
                <Package className="h-3.5 w-3.5" />
                New listing
              </Link>
            </div>
          </div>

          {/* stat strip */}
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06]">
            {statsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-[#0a0a0a] px-6 py-6 animate-pulse">
                    <div className="h-3 w-16 bg-white/10 mb-3" />
                    <div className="h-7 w-24 bg-white/10" />
                  </div>
                ))
              : STAT_CARDS.map((s) => (
                  <div key={s.label} className="bg-[#0a0a0a] px-6 py-6">
                    <div className="flex items-center gap-2 text-white/30 mb-2">
                      {s.icon}
                      <span className="text-[9px] font-bold uppercase tracking-[0.22em]">{s.label}</span>
                    </div>
                    <p className="text-2xl font-black text-white">{s.value}</p>
                    <p className="text-[10px] text-white/25 mt-1">{s.sub}</p>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10">

          {/* Left — recent orders */}
          <div>
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className={labelBase}>Activity</p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-earth-900">
                  Recent orders
                </h2>
              </div>
              <Link
                to="/seller/orders"
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-earth-400 hover:text-earth-900 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {salesLoading ? (
              <div className="divide-y divide-earth-100 border border-earth-200">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between animate-pulse">
                    <div className="space-y-1.5">
                      <div className="h-3 w-32 bg-earth-100" />
                      <div className="h-2.5 w-20 bg-earth-100" />
                    </div>
                    <div className="h-3 w-16 bg-earth-100" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="border border-earth-200 px-8 py-16 text-center">
                <BarChart2 className="h-10 w-10 text-earth-200 mx-auto mb-4" />
                <p className="text-sm font-semibold text-earth-400 uppercase tracking-wide">
                  No orders yet
                </p>
                <p className="text-xs text-earth-400 mt-1">
                  Orders will appear here once buyers purchase your listings.
                </p>
              </div>
            ) : (
              <div className="border border-earth-200 divide-y divide-earth-100">
                {orders.map((order: any) => (
                  <Link
                    key={order._id}
                    to={`/orders/${order._id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-earth-50 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-earth-900">
                        {order.items?.[0]?.title ?? 'Order'}
                        {order.items?.length > 1 && (
                          <span className="text-earth-400 font-normal"> +{order.items.length - 1} more</span>
                        )}
                      </p>
                      <p className="text-[10px] text-earth-400 mt-0.5">
                        {order.orderNumber} &middot; {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${statusColor[order.status] ?? 'bg-earth-50 text-earth-500 border-earth-200'}`}>
                        {order.status}
                      </span>
                      <span className="text-sm font-bold text-earth-900">
                        GHS {order.totalAmount?.toFixed(2)}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-earth-300 group-hover:text-earth-600 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right — listings sidebar */}
          <div>
            <div className="mb-6">
              <p className={labelBase}>Your listings</p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-earth-900">
                Active products
              </h2>
            </div>

            {listings.length === 0 ? (
              <div className="border border-earth-200 p-6 text-center">
                <p className="text-xs text-earth-400">No listings yet.</p>
                <Link
                  to="/sell"
                  className="mt-3 inline-flex items-center gap-1.5 bg-earth-900 text-white px-4 py-2 text-[9px] font-bold uppercase tracking-[0.18em] hover:bg-earth-700 transition-colors"
                >
                  <Package className="h-3 w-3" />
                  Create first listing
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {listings.map((p: any) => (
                  <div
                    key={p._id}
                    className="flex items-center gap-3 border border-earth-200 p-3 hover:border-earth-400 transition-colors"
                  >
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="h-12 w-12 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-earth-100 flex-shrink-0 flex items-center justify-center">
                        <Package className="h-5 w-5 text-earth-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-earth-900 truncate">{p.title}</p>
                      <p className="text-[10px] text-earth-400">GHS {p.price?.toFixed(2)}</p>
                    </div>
                    <span className={`flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border ${p.isAvailable ? 'bg-green-50 text-green-700 border-green-200' : 'bg-earth-50 text-earth-500 border-earth-200'}`}>
                      {p.isAvailable ? 'live' : 'sold'}
                    </span>
                  </div>
                ))}
                <Link
                  to="/my-listings"
                  className="flex items-center justify-center gap-2 border border-earth-200 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-earth-400 hover:border-earth-400 hover:text-earth-700 transition-colors"
                >
                  View all listings <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}

            {/* Completion rate card */}
            <div className="mt-6 border border-earth-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-earth-400" />
                <p className={labelBase}>Completion rate</p>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-black text-earth-900">{completionRate}%</span>
                <span className="text-xs text-earth-400 mb-1">of orders fulfilled</span>
              </div>
              <div className="h-1.5 bg-earth-100 w-full">
                <div
                  className="h-full bg-earth-900 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalyticsPage;
