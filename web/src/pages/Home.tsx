import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  Dumbbell,
  Home as HomeIcon,
  Layers3,
  LifeBuoy,
  Package,
  PenTool,
  Shield,
  Shirt,
  Smartphone,
  Sparkles,
  TimerReset,
  Utensils,
  ShieldCheck,
  Zap,
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  Tag,
  CheckCircle,
  Search,
  Clock,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SearchBar } from '../components/search';
import { ProductGrid } from '../components/product';
import productService from '../services/product.service';
import categoryService, { CategoryWithCount } from '../services/category.service';
import { ProductPopulated } from '../types';

const iconMap: Record<string, React.ReactNode> = {
  'book-open': <BookOpen className="h-5 w-5" />,
  smartphone: <Smartphone className="h-5 w-5" />,
  utensils: <Utensils className="h-5 w-5" />,
  shirt: <Shirt className="h-5 w-5" />,
  briefcase: <Briefcase className="h-5 w-5" />,
  home: <HomeIcon className="h-5 w-5" />,
  'pen-tool': <PenTool className="h-5 w-5" />,
  dumbbell: <Dumbbell className="h-5 w-5" />,
  package: <Package className="h-5 w-5" />,
};

const STATS = [
  { value: '2,400+', label: 'Active listings', icon: <Tag className="h-5 w-5" /> },
  { value: '1,800+', label: 'Student sellers', icon: <Users className="h-5 w-5" /> },
  { value: '98%', label: 'Successful trades', icon: <CheckCircle className="h-5 w-5" /> },
  { value: 'GHS 0', label: 'Platform fee', icon: <BadgeCheck className="h-5 w-5" /> },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Browse or search',
    body: 'Find exactly what you need — textbooks, gadgets, furniture, food — all from fellow students.',
    icon: <Search className="h-6 w-6" />,
  },
  {
    step: '02',
    title: 'Message the seller',
    body: 'Chat directly inside the app. Negotiate, ask questions, agree on pickup or delivery.',
    icon: <MessageCircle className="h-6 w-6" />,
  },
  {
    step: '03',
    title: 'Pay securely',
    body: 'Pay via mobile money or card through Paystack. Funds are held until you confirm receipt.',
    icon: <ShieldCheck className="h-6 w-6" />,
  },
  {
    step: '04',
    title: 'Done — fast',
    body: 'Pick up on campus or get it delivered. Leave a review and build the community.',
    icon: <Zap className="h-6 w-6" />,
  },
];

const TESTIMONIALS = [
  {
    quote: 'Sold my calculus textbooks in under 2 hours. Way better than WhatsApp groups.',
    name: 'Kwame A.',
    role: 'Level 300 · Engineering',
    rating: 5,
  },
  {
    quote: 'Bought a laptop stand, a fan, and a mini fridge all in one week. Everything worked perfectly.',
    name: 'Ama S.',
    role: 'Level 200 · Business',
    rating: 5,
  },
  {
    quote: "Listing took 3 minutes. My old phone sold the same day. I didn't even need to leave campus.",
    name: 'Kofi M.',
    role: 'Level 400 · Computer Science',
    rating: 5,
  },
];

const VIBES = [
  {
    label: 'Lecture Ready',
    title: 'Textbooks, tablets, desk gear',
    body: 'Build a semester setup with essentials students actually need every week.',
    category: 'books',
    accent: 'from-[#f5f1e8] to-[#e8dfd0]',
  },
  {
    label: 'Hostel Reset',
    title: 'Fans, mini fridges, room upgrades',
    body: 'Useful room pieces that move fast when campus life gets busy.',
    category: 'home',
    accent: 'from-[#e7ecef] to-[#d7dee3]',
  },
  {
    label: 'Off-Day Rotation',
    title: 'Fits, sneakers, accessories',
    body: 'A sharper storefront lane for fashion-led listings and weekend pickup.',
    category: 'fashion',
    accent: 'from-[#ece3dc] to-[#ddd0c5]',
  },
];

const TRUST_PILLARS = [
  {
    icon: <Shield className="h-4 w-4" />,
    title: 'Buyer protection',
    body: 'Orders keep a paper trail, verified payment states, and disputes when things go wrong.',
  },
  {
    icon: <LifeBuoy className="h-4 w-4" />,
    title: 'Campus-safe meetups',
    body: 'Nudge buyers and sellers toward public pickup points and in-app chat history.',
  },
  {
    icon: <TimerReset className="h-4 w-4" />,
    title: 'Fast seller response',
    body: 'Trust badges, response-time cues, and verified sellers make high-intent listings easier to judge.',
  },
];

const CURATED_PRODUCTS = [
  {
    id: 'curated-lecture-kit',
    title: 'Lecture Starter Kit',
    price: 420,
    category: 'Books & Study',
    condition: 'new',
    image: '/curated/optimized/lecture-kit-card.webp',
  },
  {
    id: 'curated-hostel-reset',
    title: 'Hostel Reset Bundle',
    price: 650,
    category: 'Home & Hostel',
    condition: 'like_new',
    image: '/curated/optimized/hostel-reset-card.webp',
  },
  {
    id: 'curated-weekend-fit',
    title: 'Weekend Fit Edit',
    price: 280,
    category: 'Fashion',
    condition: 'new',
    image: '/curated/optimized/weekend-fit-card.webp',
  },
  {
    id: 'curated-gadget-set',
    title: 'Gadget Desk Setup',
    price: 980,
    category: 'Electronics',
    condition: 'used',
    image: '/curated/optimized/gadget-setup-card.webp',
  },
  {
    id: 'curated-sneaker-drop',
    title: 'Sneaker Drop Pair',
    price: 350,
    category: 'Fashion',
    condition: 'new',
    image: '/curated/optimized/sneaker-drop-card.webp',
  },
  {
    id: 'curated-study-corner',
    title: 'Study Corner Essentials',
    price: 540,
    category: 'Home & Hostel',
    condition: 'like_new',
    image: '/curated/optimized/study-corner-card.webp',
  },
  {
    id: 'curated-audio-pack',
    title: 'Audio Pack for Commute',
    price: 210,
    category: 'Electronics',
    condition: 'new',
    image: '/curated/optimized/audio-pack-card.webp',
  },
  {
    id: 'curated-canvas-bag',
    title: 'Canvas Carry Collection',
    price: 120,
    category: 'Fashion',
    condition: 'new',
    image: '/curated/optimized/canvas-carry-card.webp',
  },
];

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductPopulated[]>([]);
  const [recentProducts, setRecentProducts] = useState<ProductPopulated[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ProductPopulated[]>([]);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [soldFeed, setSoldFeed] = useState<any[]>([]);
  const [categorySpotlights, setCategorySpotlights] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<ProductPopulated[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    categoryService.getCategoriesWithCounts().then((res) => {
      if (res.success) setCategories(res.data.categories);
    }).catch(() => {});

    productService.getFeatured(8).then((res) => {
      if (res.success) setFeaturedProducts(res.data);
    }).catch(() => {}).finally(() => setLoadingFeatured(false));

    productService.getRecent(8).then((res) => {
      if (res.success) setRecentProducts(res.data);
    }).catch(() => {}).finally(() => setLoadingRecent(false));

    productService.getTrending(8).then((res) => {
      if (res.success) setTrendingProducts(res.data);
    }).catch(() => {}).finally(() => setLoadingTrending(false));

    productService.getTopSellers(5).then((res) => {
      if (res.success) setTopSellers(res.data);
    }).catch(() => {});

    productService.getSoldFeed(6).then((res) => {
      if (res.success) setSoldFeed(res.data);
    }).catch(() => {});

    productService.getCategorySpotlights(6).then((res) => {
      if (res.success) setCategorySpotlights(res.data);
    }).catch(() => {});

    productService.getCollections(3).then((res) => {
      if (res.success) setCollections(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('recentViewedProducts');
      if (!raw) return;
      const parsed: ProductPopulated[] = JSON.parse(raw);
      if (Array.isArray(parsed)) setRecentlyViewedProducts(parsed.slice(0, 4));
    } catch { /* ignore */ }
  }, []);

  const getProductImage = (product: ProductPopulated) =>
    product.images.length > 0 ? product.images[0].url : null;

  const recentPreviewProducts = recentProducts.slice(0, 6);
  const campusEditProducts = [...featuredProducts, ...trendingProducts, ...recentProducts]
    .filter((product, index, all) => all.findIndex((item) => item._id === product._id) === index)
    .slice(0, 4);
  const shopByVibeProducts = VIBES.map((vibe) => ({
    ...vibe,
    products: [...featuredProducts, ...recentProducts, ...trendingProducts]
      .filter((product) => {
        const categorySlug = typeof product.category === 'string' ? '' : product.category.slug?.toLowerCase?.() || '';
        const categoryName = typeof product.category === 'string' ? '' : product.category.name?.toLowerCase?.() || '';
        const title = product.title.toLowerCase();
        const tags = product.tags.join(' ').toLowerCase();
        const haystack = `${categorySlug} ${categoryName} ${title} ${tags}`;
        return haystack.includes(vibe.category);
      })
      .filter((product, index, all) => all.findIndex((item) => item._id === product._id) === index)
      .slice(0, 3),
  }));
  const recommendedProducts = recentlyViewedProducts.length > 0
    ? [...relatedProductsPlaceholder(recentlyViewedProducts, trendingProducts, featuredProducts)]
    : campusEditProducts;
  const campusEditCurated = CURATED_PRODUCTS.slice(0, 4);
  const newThisWeekCurated = CURATED_PRODUCTS;
  const curatedByCategory = (categoryKey: string, limit: number = 3) => {
    const key = categoryKey.toLowerCase();
    return CURATED_PRODUCTS.filter((item) => {
      const haystack = `${item.category} ${item.title}`.toLowerCase();
      return haystack.includes(key);
    }).slice(0, limit);
  };
  const campusEditSlots = [0, 1, 2, 3].map((index) => ({
    live: campusEditProducts[index] || null,
    curated: campusEditCurated[index] || null,
  }));
  const newThisWeekItems = [
    ...recentProducts,
    ...newThisWeekCurated.map((item) => ({
      _id: item.id,
      title: item.title,
      price: item.price,
      condition: item.condition,
      category: { name: item.category },
      image: item.image,
      isCurated: true,
    })),
  ].slice(0, 8);
  const recommendedItems = [
    ...recommendedProducts,
    ...CURATED_PRODUCTS.map((item) => ({
      _id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      isCurated: true,
    })),
  ].slice(0, 3);

  const getDisplayImage = (
    product: ProductPopulated | null,
    curatedImage?: string,
    fallbackText?: string
  ) => {
    if (product) {
      return getProductImage(product) ?? curatedImage ?? `https://placehold.co/600x750/e8ecef/6c7275?text=${encodeURIComponent((fallbackText || product.title).slice(0, 10))}`;
    }
    return curatedImage ?? `https://placehold.co/600x750/e8ecef/6c7275?text=${encodeURIComponent((fallbackText || 'Campus').slice(0, 10))}`;
  };

  function relatedProductsPlaceholder(...groups: ProductPopulated[][]) {
    return groups
      .flat()
      .filter((product, index, all) => all.findIndex((item) => item._id === product._id) === index)
      .slice(0, 4);
  }

  return (
    <main className="bg-white">

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 text-center">
        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,255,255,0.06),transparent)]" />

        {/* Eyebrow */}
        <span className="relative z-10 mb-10 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          UMaT Student Marketplace
        </span>

        {/* Headline */}
        <h1 className="relative z-10 max-w-5xl text-[clamp(3rem,9vw,8rem)] font-black leading-[0.88] tracking-[-0.04em] text-white">
          Buy. Sell.<br />
          <span className="text-white/25">Stay on campus.</span>
        </h1>

        <p className="relative z-10 mt-8 max-w-md text-base leading-7 text-white/40">
          The only marketplace built for UMaT students. Textbooks, electronics, food, services — everything you need, from people you know.
        </p>

        {/* Search */}
        <div className="relative z-[60] mt-12 w-full max-w-2xl">
          <SearchBar
            placeholder="Search textbooks, phones, food, services..."
            className="[&_.searchbar-input]:h-14 [&_.searchbar-input]:rounded-none [&_.searchbar-input]:border-0 [&_.searchbar-input]:border-b [&_.searchbar-input]:border-white/20 [&_.searchbar-input]:bg-white/5 [&_.searchbar-input]:px-5 [&_.searchbar-input]:text-base [&_.searchbar-input]:text-white [&_.searchbar-input]:placeholder:text-white/25 [&_.searchbar-input]:focus:border-white/50 [&_.searchbar-input]:focus:outline-none [&_.searchbar-input]:focus:ring-0 [&_.searchbar-panel]:mt-2 [&_.searchbar-panel]:border-white/10 [&_.searchbar-panel]:bg-[#1c1c1c]"
          />
        </div>

        {/* CTAs */}
        <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/products"
            className="inline-flex h-12 items-center gap-2 bg-white px-8 text-sm font-bold uppercase tracking-[0.12em] text-black transition-opacity hover:opacity-85"
          >
            Browse listings <ArrowRight className="h-4 w-4" />
          </Link>
          {!isAuthenticated ? (
            <Link
              to="/register"
              className="inline-flex h-12 items-center gap-2 border border-white/15 px-8 text-sm font-bold uppercase tracking-[0.12em] text-white/60 transition-colors hover:border-white/40 hover:text-white"
            >
              Join free
            </Link>
          ) : (user?.role === 'seller' || user?.role === 'admin') ? (
            <Link
              to="/sell"
              className="inline-flex h-12 items-center gap-2 border border-white/15 px-8 text-sm font-bold uppercase tracking-[0.12em] text-white/60 transition-colors hover:border-white/40 hover:text-white"
            >
              Post a listing
            </Link>
          ) : null}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
          <span className="text-[9px] uppercase tracking-[0.3em]">Scroll</span>
          <div className="h-10 w-px bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      <section className="animate-fade-up-in border-b border-earth-200 bg-earth-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-earth-400">Shop by vibe</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-earth-900">Curated rows, not just categories.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-earth-500">
              Grouped by moment and use case to make discovery faster.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {shopByVibeProducts.map((vibe) => (
              <div key={vibe.label} className="overflow-hidden border border-earth-200 bg-white">
                <div className={`bg-gradient-to-br ${vibe.accent} p-6`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-earth-500">{vibe.label}</p>
                  <h3 className="mt-3 text-2xl font-black uppercase leading-tight tracking-tight text-earth-900">{vibe.title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-earth-600">{vibe.body}</p>
                </div>
                <div className="space-y-0 border-t border-earth-200">
                  {(vibe.products.length > 0 ? vibe.products : curatedByCategory(vibe.category)).map((product: any) => (
                    <Link
                      key={product._id || product.id}
                      to={product._id ? `/products/${product._id}` : '/products'}
                      className="group flex items-center gap-4 border-b border-earth-100 p-4 last:border-b-0 hover:bg-earth-50"
                    >
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden bg-earth-100">
                        <img
                          src={product._id ? getDisplayImage(product) : product.image}
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-earth-900">{product.title}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-earth-400">
                          {product._id ? (typeof product.category === 'string' ? 'Category' : product.category.name) : product.category}
                        </p>
                        <p className="mt-2 text-sm font-black text-earth-900">GHS {Number(product.price).toLocaleString('en-GH')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CAMPUS EDIT
      ════════════════════════════════════════════════ */}
      <section className="animate-fade-up-in border-b border-earth-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-earth-400">Campus edit</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-earth-900 lg:text-4xl">
                Storefront picks for right now.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-earth-500">
              Featured drops, trending items, and fresh listings in one view.
            </p>
          </div>

          {loadingFeatured || loadingTrending || loadingRecent ? (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="aspect-[4/5] animate-pulse bg-earth-100" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="aspect-[4/5] animate-pulse bg-earth-100" />
                <div className="aspect-[4/5] animate-pulse bg-earth-100" />
              </div>
            </div>
          ) : campusEditSlots.some((slot) => slot.live || slot.curated) ? (
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <Link
                to={campusEditSlots[0].live ? `/products/${campusEditSlots[0].live._id}` : '/products'}
                className="group relative isolate flex min-h-[420px] overflow-hidden bg-[#111111]"
              >
                <img
                  src={getDisplayImage(campusEditSlots[0].live, campusEditSlots[0].curated?.image, campusEditSlots[0].curated?.title)}
                  alt={campusEditSlots[0].live?.title || campusEditSlots[0].curated?.title || 'Curated'}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                <div className="relative mt-auto w-full p-6 sm:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">
                    {campusEditSlots[0].live ? 'Featured spotlight' : 'Curated spotlight'}
                  </p>
                  <h3 className="mt-3 max-w-sm text-3xl font-black uppercase leading-[0.92] tracking-tight text-white sm:text-4xl">
                    {campusEditSlots[0].live?.title || campusEditSlots[0].curated?.title}
                  </h3>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/65">
                    <span>
                      {campusEditSlots[0].live
                        ? (typeof campusEditSlots[0].live.category === 'string' ? 'Category' : campusEditSlots[0].live.category.name)
                        : campusEditSlots[0].curated?.category}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    <span>{campusEditSlots[0].live?.condition || campusEditSlots[0].curated?.condition}</span>
                  </div>
                  <p className="mt-6 text-lg font-black text-white">
                    GHS {Number(campusEditSlots[0].live?.price || campusEditSlots[0].curated?.price || 0).toLocaleString('en-GH')}
                  </p>
                </div>
              </Link>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {campusEditSlots.slice(1).map((slot, index) => (
                  <Link
                    key={slot.live?._id || slot.curated?.id || `curated-${index}`}
                    to={slot.live ? `/products/${slot.live._id}` : '/products'}
                    className={`group grid overflow-hidden border border-earth-200 bg-earth-50 ${index === 2 ? 'sm:col-span-2 lg:col-span-1 lg:grid-cols-[0.95fr_1.05fr]' : 'grid-rows-[1fr_auto]'}`}
                  >
                    <div className={`overflow-hidden ${index === 2 ? 'min-h-[240px]' : 'aspect-[4/5]'}`}>
                      <img
                        src={getDisplayImage(slot.live, slot.curated?.image, slot.curated?.title)}
                        alt={slot.live?.title || slot.curated?.title || 'Curated'}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-col justify-between p-5">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-earth-400">
                          {slot.live
                            ? (index === 0 ? 'Trending now' : index === 1 ? 'Just in' : 'Editor choice')
                            : 'Curated pick'}
                        </p>
                        <h3 className="mt-2 text-xl font-black uppercase leading-tight tracking-tight text-earth-900">
                          {slot.live?.title || slot.curated?.title}
                        </h3>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-earth-400">
                          {slot.live
                            ? (typeof slot.live.category === 'string' ? 'Category' : slot.live.category.name)
                            : slot.curated?.category}
                        </p>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <span className="text-sm font-black text-earth-900">
                          GHS {Number(slot.live?.price || slot.curated?.price || 0).toLocaleString('en-GH')}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-earth-500">
                          {slot.live ? 'View item' : 'View curated'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════ */}
      <section className="border-b border-earth-200 bg-earth-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-earth-200 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                <span className="text-earth-300">{s.icon}</span>
                <span className="text-2xl font-black text-earth-900">{s.value}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CATEGORY STRIP
      ════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="border-b border-earth-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-earth-400">Browse by category</p>
              <Link to="/categories" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-earth-400 hover:text-earth-900 transition-colors">
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 pb-5">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat.slug}`}
                  className="inline-flex items-center gap-2 border border-earth-200 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-earth-600 transition-colors hover:border-earth-900 hover:bg-earth-900 hover:text-white"
                >
                  {iconMap[cat.icon] || <Package className="h-4 w-4" />}
                  {cat.name}
                  {cat.productCount != null && (
                    <span className="text-[10px] opacity-50">{cat.productCount}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          FEATURED LISTINGS
      ════════════════════════════════════════════════ */}
      {(loadingFeatured || featuredProducts.length > 0) && (
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between border-b border-earth-100 pb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-earth-400 mb-1">Handpicked</p>
                <h2 className="text-3xl font-black tracking-tight text-earth-900 uppercase">Featured picks</h2>
              </div>
              <Link
                to="/products?sort=featured"
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.18em] text-earth-400 transition-colors hover:text-earth-900"
              >
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loadingFeatured ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[4/3] animate-pulse bg-earth-100" />
                    <div className="h-3 w-3/4 animate-pulse bg-earth-100" />
                    <div className="h-3 w-1/2 animate-pulse bg-earth-100" />
                  </div>
                ))}
              </div>
            ) : (
              <ProductGrid products={featuredProducts} />
            )}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════ */}
      <section className="bg-[#0a0a0a] py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25 mb-2">Simple process</p>
              <h2 className="text-4xl font-black uppercase tracking-tight text-white lg:text-5xl">
                How it works
              </h2>
            </div>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex h-11 items-center gap-2 border border-white/15 px-6 text-xs font-bold uppercase tracking-[0.16em] text-white/60 transition-colors hover:border-white/40 hover:text-white self-start lg:self-auto"
              >
                Get started free <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-px bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="bg-[#0a0a0a] p-8 lg:p-10">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">{step.step}</span>
                  <span className="text-white/20">{step.icon}</span>
                </div>
                <h3 className="mb-3 text-lg font-black uppercase tracking-tight text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-white/40">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          NEW ARRIVALS — split layout
      ════════════════════════════════════════════════ */}
      <section className="border-y border-earth-200 bg-earth-50">
        <div className="mx-auto grid max-w-7xl overflow-hidden lg:grid-cols-[minmax(320px,420px)_1fr] lg:border-x lg:border-earth-200">
          <div className="flex flex-col justify-center bg-earth-900 px-8 py-16 lg:px-14 lg:py-24">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Updated daily</p>
            <h2 className="mb-6 text-5xl font-black leading-[0.92] tracking-[-0.04em] text-white">
              New.<br />Every day.
            </h2>
            <p className="mb-8 max-w-xs text-sm leading-7 text-white/50">
              Students list new items every day. The best deals disappear fast - check back often.
            </p>
            <div className="mb-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
              <Clock className="h-3.5 w-3.5" />
              Most recent first
            </div>
            <Link
              to="/products?sort=newest"
              className="inline-flex h-11 w-fit items-center gap-2 border border-white/20 px-6 text-xs font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:border-white/60 hover:text-white"
            >
              View new arrivals <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="relative overflow-hidden border-t border-earth-200 bg-white px-8 py-12 lg:border-l lg:border-t-0 lg:px-14 lg:py-16">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,15,15,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,15,15,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
            {loadingRecent ? (
              <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-square animate-pulse bg-earth-200" />
                    <div className="h-2.5 w-3/4 animate-pulse bg-earth-200" />
                    <div className="h-2.5 w-1/2 animate-pulse bg-earth-200" />
                  </div>
                ))}
              </div>
            ) : recentPreviewProducts.length > 0 ? (
              <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-3">
                {recentPreviewProducts.map((p) => (
                  <Link
                    key={p._id}
                    to={`/products/${p._id}`}
                    className="group block"
                  >
                    <div className="relative aspect-square overflow-hidden bg-earth-200">
                      <img
                        src={getProductImage(p) ?? `https://placehold.co/300x300/e8ecef/6c7275?text=${encodeURIComponent(p.title.slice(0, 8))}`}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {p.condition === 'new' && (
                        <span className="absolute left-2 top-2 bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">New</span>
                      )}
                    </div>
                    <p className="mt-2 truncate text-xs font-semibold text-earth-900">{p.title}</p>
                    <p className="text-xs font-bold text-earth-600">GHS {p.price.toLocaleString('en-GH')}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
                <div className="border border-earth-200 bg-earth-50 p-8 lg:p-10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-earth-400">Fresh on campus</p>
                  <h3 className="mt-3 text-3xl font-black uppercase tracking-tight text-earth-900">
                    New listings land here first.
                  </h3>
                  <p className="mt-4 max-w-md text-sm leading-7 text-earth-500">
                    Once sellers publish new items, this panel fills up with the latest drops from around campus.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-2">
                    {categories.slice(0, 4).map((cat) => (
                      <Link
                        key={cat._id}
                        to={`/products?category=${cat.slug}`}
                        className="inline-flex items-center gap-2 border border-earth-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-earth-600 transition-colors hover:border-earth-900 hover:text-earth-900"
                      >
                        {iconMap[cat.icon] || <Package className="h-3.5 w-3.5" />}
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {STATS.slice(0, 2).map((stat) => (
                    <div key={stat.label} className="border border-earth-200 bg-white p-6">
                      <div className="mb-6 text-earth-300">{stat.icon}</div>
                      <p className="text-3xl font-black text-earth-900">{stat.value}</p>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-earth-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="animate-fade-up-in border-b border-earth-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-earth-400">New this week</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-earth-900">Recently dropped on campus.</h2>
            </div>
            <Link to="/products?sort=newest" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-earth-500 hover:text-earth-900">
              Explore all new drops <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {newThisWeekItems.map((product: any) => (
                <Link key={product._id} to={product.isCurated ? '/products' : `/products/${product._id}`} className="group w-[260px] border border-earth-200 bg-earth-50">
                  <div className="relative aspect-[4/5] overflow-hidden bg-earth-100">
                    <img
                      src={product.isCurated ? product.image : getDisplayImage(product)}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 translate-y-full bg-[#0a0a0a]/92 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-transform duration-300 group-hover:translate-y-0">
                      Quick view
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-earth-400">
                      {product.isCurated
                        ? product.category.name
                        : (typeof product.category === 'string' ? 'Category' : product.category.name)}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-black uppercase leading-tight tracking-tight text-earth-900">
                      {product.title}
                    </h3>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-black text-earth-900">GHS {product.price.toLocaleString('en-GH')}</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-earth-500">{product.condition}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="animate-fade-up-in border-b border-earth-200 bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-7xl gap-px bg-white/[0.08] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-[#0a0a0a] px-8 py-14 lg:px-12 lg:py-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/25">Trust & protection</p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-[0.92] tracking-tight text-white">
              Built for campus deals that still feel safe.
            </h2>
            <div className="mt-8 space-y-4">
              {TRUST_PILLARS.map((pillar) => (
                <div key={pillar.title} className="border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-white/70">
                    {pillar.icon}
                    <p className="text-xs font-bold uppercase tracking-[0.2em]">{pillar.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/40">{pillar.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-px bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-1">
            <div className="bg-[#111111] p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">Search & discovery</p>
              <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-white">Recommended for you</h3>
              <p className="mt-3 text-sm leading-7 text-white/40">
                Based on recent views, featured drops, and popular campus categories.
              </p>
              <div className="mt-6 space-y-3">
                {recommendedItems.map((product: any) => (
                  <Link key={product._id} to={product.isCurated ? '/products' : `/products/${product._id}`} className="flex items-center gap-3 border border-white/10 p-3 hover:bg-white/[0.03]">
                    <img
                      src={product.isCurated ? product.image : getDisplayImage(product)}
                      alt={product.title}
                      className="h-14 w-14 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{product.title}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">GHS {product.price.toLocaleString('en-GH')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="bg-[#111111] p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">Merchandising roadmap</p>
              <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-white">What grows next</h3>
              <div className="mt-6 space-y-3 text-sm text-white/45">
                {[
                  'Featured collections and seasonal edits',
                  'Seller-curated collections and scheduled drops',
                  'Wishlist price-drop alerts and inventory nudges',
                  'Admin moderation queue and richer dispute evidence',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 border-b border-white/[0.06] pb-3 last:border-b-0">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/30" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {(soldFeed.length > 0 || topSellers.length > 0) && (
        <section className="border-b border-earth-200 bg-earth-50">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-16">
            <div className="border border-earth-200 bg-white">
              <div className="border-b border-earth-100 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">Live sold feed</p>
                <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-earth-900">Recent campus purchases</h3>
              </div>
              <div className="divide-y divide-earth-100">
                {soldFeed.slice(0, 5).map((item: any) => (
                  <div key={item.orderId} className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-earth-900">{item.itemTitle}</p>
                    <p className="mt-1 text-[11px] text-earth-500">
                      Sold by {item.seller?.name || 'Seller'} • GHS {Number(item.itemPrice).toLocaleString('en-GH')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-earth-200 bg-white">
              <div className="border-b border-earth-100 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">Top sellers</p>
                <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-earth-900">Leaderboard</h3>
              </div>
              <div className="divide-y divide-earth-100">
                {topSellers.slice(0, 5).map((entry: any, idx: number) => (
                  <div key={`${entry?.seller?._id || idx}`} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-earth-900">#{idx + 1} {entry?.seller?.name || 'Seller'}</p>
                      <p className="mt-1 text-[11px] text-earth-500">{entry.totalSales} completed sales</p>
                    </div>
                    <p className="text-sm font-black text-earth-900">GHS {Number(entry.totalRevenue || 0).toLocaleString('en-GH')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {categorySpotlights.length > 0 && (
        <section className="border-b border-earth-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">Category spotlights</p>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-earth-900">Auto-generated trend lanes</h3>
              </div>
              <Link to="/categories" className="text-[10px] font-bold uppercase tracking-[0.16em] text-earth-500 hover:text-earth-900">All categories</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categorySpotlights.map((item: any) => (
                <Link
                  key={item.category._id}
                  to={`/products?category=${item.category.slug}`}
                  className="border border-earth-200 bg-earth-50 p-5 hover:border-earth-900 transition-colors"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-earth-400">Spotlight</p>
                  <p className="mt-2 text-lg font-black uppercase tracking-tight text-earth-900">{item.category.name}</p>
                  <p className="mt-3 text-xs text-earth-500">{item.listingCount} active listings • Avg GHS {Number(item.avgPrice || 0).toLocaleString('en-GH')}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {collections.length > 0 && (
        <section className="border-b border-earth-200 bg-earth-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">Campaign collections</p>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-earth-900">Seasonal storefront lanes</h3>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {collections.map((item: any) => (
                <Link
                  key={item.slug}
                  to={`/collections/${item.slug}`}
                  className="group border border-earth-200 bg-white"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-earth-100">
                    {item.hero?.image ? (
                      <img
                        src={item.hero.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-earth-300">
                        <Layers3 className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-earth-400">Collection</p>
                    <h4 className="mt-2 text-xl font-black uppercase tracking-tight text-earth-900">{item.title}</h4>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-earth-500">{item.description}</p>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="font-semibold text-earth-600">{item.listingCount} listings</span>
                      <span className="inline-flex items-center gap-1 font-bold uppercase tracking-[0.14em] text-earth-500 group-hover:text-earth-900">
                        Open <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          TRENDING
      ════════════════════════════════════════════════ */}
      {(loadingTrending || trendingProducts.length > 0) && (
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between border-b border-earth-100 pb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-earth-400 mb-1">Most viewed</p>
                <h2 className="text-3xl font-black tracking-tight text-earth-900 uppercase flex items-center gap-3">
                  Trending now
                  <TrendingUp className="h-6 w-6 text-earth-300" />
                </h2>
              </div>
              <Link
                to="/products?sort=popular"
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.18em] text-earth-400 transition-colors hover:text-earth-900"
              >
                All popular <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loadingTrending ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[4/3] animate-pulse bg-earth-100" />
                    <div className="h-3 w-3/4 animate-pulse bg-earth-100" />
                    <div className="h-3 w-1/2 animate-pulse bg-earth-100" />
                  </div>
                ))}
              </div>
            ) : (
              <ProductGrid products={trendingProducts} />
            )}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════ */}
      <section className="border-y border-earth-200 bg-earth-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-earth-400 mb-2">Student stories</p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-earth-900">What students say</h2>
          </div>
          <div className="grid grid-cols-1 gap-px bg-earth-200 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-earth-50 p-8 lg:p-10">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-earth-900 text-earth-900" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-earth-700 italic mb-6">"{t.quote}"</p>
                <div>
                  <p className="text-xs font-bold text-earth-900">{t.name}</p>
                  <p className="text-[10px] text-earth-400 uppercase tracking-[0.14em]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          RECENTLY VIEWED
      ════════════════════════════════════════════════ */}
      {recentlyViewedProducts.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between border-b border-earth-100 pb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-earth-400 mb-1">Your history</p>
                <h2 className="text-2xl font-black tracking-tight text-earth-900 uppercase">Recently viewed</h2>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('recentViewedProducts');
                  setRecentlyViewedProducts([]);
                }}
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-earth-300 transition-colors hover:text-earth-700"
              >
                Clear
              </button>
            </div>
            <ProductGrid products={recentlyViewedProducts} />
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          SELL CTA — for sellers
      ════════════════════════════════════════════════ */}
      {isAuthenticated && (user?.role === 'seller' || user?.role === 'admin') && (
        <section className="bg-[#0a0a0a] py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25 mb-3">Seller tools</p>
                <h2 className="text-4xl font-black tracking-tight text-white uppercase">Got something to sell?</h2>
                <p className="mt-3 text-sm text-white/40 max-w-md">List in under 3 minutes. Your product is live immediately, visible to all UMaT students.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/sell"
                  className="inline-flex h-12 items-center justify-center gap-2 bg-white px-8 text-sm font-bold uppercase tracking-[0.12em] text-black transition-opacity hover:opacity-85"
                >
                  Post a listing <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/my-listings"
                  className="inline-flex h-12 items-center justify-center border border-white/15 px-8 text-sm font-bold uppercase tracking-[0.12em] text-white/60 transition-colors hover:border-white/40 hover:text-white"
                >
                  My listings
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          REGISTER CTA — guests only
      ════════════════════════════════════════════════ */}
      {!isAuthenticated && (
        <section className="bg-[#0a0a0a] py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25 mb-4">Free forever</p>
                <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] text-white uppercase">
                  Ready to<br />
                  <span className="text-white/20">get started?</span>
                </h2>
                <p className="mt-6 text-sm leading-7 text-white/40 max-w-md">
                  Join thousands of UMaT students already buying and selling on campus. No fees, no middlemen — just students helping each other.
                </p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/register"
                    className="inline-flex h-12 items-center justify-center gap-2 bg-white px-8 text-sm font-bold uppercase tracking-[0.12em] text-black transition-opacity hover:opacity-85"
                  >
                    Create account <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex h-12 items-center justify-center border border-white/15 px-8 text-sm font-bold uppercase tracking-[0.12em] text-white/50 transition-colors hover:border-white/40 hover:text-white"
                  >
                    Sign in
                  </Link>
                </div>
              </div>

              {/* Feature checklist */}
              <div className="space-y-0 border border-white/[0.08]">
                {[
                  'Buy from verified UMaT students',
                  'Secure Paystack payments (MoMo + card)',
                  'Direct in-app messaging',
                  'Campus pickup or delivery',
                  'Leave & read seller reviews',
                  'Zero platform fees',
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-4 border-b border-white/[0.06] px-6 py-4 last:border-0">
                    <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-white/60">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

    </main>
  );
};

export default HomePage;
