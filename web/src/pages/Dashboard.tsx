import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Heart,
  Package,
  PenSquare,
  ShoppingBag,
  Flame,
  Clock,
  Grid2x2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SearchBar } from '../components/search';
import { ProductGrid } from '../components/product';
import productService from '../services/product.service';
import categoryService, { CategoryWithCount } from '../services/category.service';
import { ProductPopulated } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recentProducts, setRecentProducts] = useState<ProductPopulated[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ProductPopulated[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    productService.getRecent(8)
      .then((res) => { if (res.success) setRecentProducts(res.data); })
      .catch(() => {})
      .finally(() => setLoadingRecent(false));

    productService.getTrending(8)
      .then((res) => { if (res.success) setTrendingProducts(res.data); })
      .catch(() => {})
      .finally(() => setLoadingTrending(false));

    categoryService.getCategoriesWithCounts()
      .then((res) => { if (res.success) setCategories(res.data.categories.slice(0, 8)); })
      .catch(() => {});
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="bg-white">

      {/* ── Top bar: greeting + search ── */}
      <div className="border-b border-earth-100 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-earth-400">
                {greeting}
              </p>
              <h1 className="mt-0.5 text-2xl font-black uppercase tracking-tight text-earth-900">
                {firstName}.
              </h1>
            </div>
            <div className="w-full max-w-sm">
              <SearchBar
                placeholder="Search listings..."
                className="[&_.searchbar-input]:rounded-none [&_.searchbar-input]:border-0 [&_.searchbar-input]:border-b [&_.searchbar-input]:border-earth-200 [&_.searchbar-input]:bg-transparent [&_.searchbar-input]:text-sm [&_.searchbar-input]:focus:border-earth-700 [&_.searchbar-input]:focus:outline-none [&_.searchbar-input]:focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick action strip ── */}
      <div className="border-b border-earth-100 bg-earth-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-0 overflow-x-auto">
            {[
              { to: '/products', icon: <Grid2x2 className="h-3.5 w-3.5" />, label: 'Browse all' },
              { to: '/saved', icon: <Heart className="h-3.5 w-3.5" />, label: 'Saved' },
              { to: '/orders', icon: <Package className="h-3.5 w-3.5" />, label: 'My orders' },
              { to: '/messages', icon: <ShoppingBag className="h-3.5 w-3.5" />, label: 'Messages' },
              { to: '/notifications', icon: <Bell className="h-3.5 w-3.5" />, label: 'Notifications' },
              ...(user?.role === 'seller' || user?.role === 'admin'
                ? [{ to: '/sell', icon: <PenSquare className="h-3.5 w-3.5" />, label: '+ Sell' }]
                : []),
            ].map(({ to, icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 whitespace-nowrap border-r border-earth-100 px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-earth-500 transition-colors hover:bg-white hover:text-earth-900 last:border-r-0"
              >
                {icon}
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-14">

        {/* ── Categories quick-links ── */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400 mb-1">
                  Shop by category
                </p>
                <div className="h-px w-12 bg-earth-900" />
              </div>
              <Link
                to="/categories"
                className="text-[10px] font-bold uppercase tracking-[0.15em] text-earth-500 hover:text-earth-900 flex items-center gap-1 transition-colors"
              >
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-px bg-earth-100 sm:grid-cols-4 lg:grid-cols-8">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat._id}`}
                  className="group flex flex-col items-center gap-1.5 bg-white px-3 py-4 transition-colors hover:bg-earth-900"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-earth-700 group-hover:text-white text-center leading-tight transition-colors">
                    {cat.name}
                  </span>
                  <span className="text-[9px] text-earth-400 group-hover:text-white/50 transition-colors">
                    {cat.productCount ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── New arrivals ── */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400 mb-1 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> New arrivals
              </p>
              <h2 className="text-xl font-black uppercase tracking-tight text-earth-900">
                Just listed
              </h2>
            </div>
            <Link
              to="/products?sort="
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-earth-500 hover:text-earth-900 flex items-center gap-1 transition-colors"
            >
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ProductGrid
            products={recentProducts}
            loading={loadingRecent}
            emptyMessage="No listings yet — check back soon."
          />
        </section>

        {/* ── Trending ── */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400 mb-1 flex items-center gap-1.5">
                <Flame className="h-3 w-3" /> Trending
              </p>
              <h2 className="text-xl font-black uppercase tracking-tight text-earth-900">
                Most viewed
              </h2>
            </div>
            <Link
              to="/products?sort=popular"
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-earth-500 hover:text-earth-900 flex items-center gap-1 transition-colors"
            >
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ProductGrid
            products={trendingProducts}
            loading={loadingTrending}
            emptyMessage="No trending products yet."
          />
        </section>

        {/* ── CTA band for sellers ── */}
        {(user?.role === 'buyer') && (
          <section className="bg-earth-900 px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 mb-2">
                Got something to sell?
              </p>
              <p className="text-xl font-black uppercase tracking-tight text-white">
                Upgrade to a seller account
              </p>
              <p className="text-sm text-white/50 mt-1">
                List your items and reach thousands of students.
              </p>
            </div>
            <Link
              to="/profile"
              className="flex-shrink-0 border border-white/30 px-7 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-white hover:text-earth-900 transition-colors"
            >
              Learn more <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
            </Link>
          </section>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
