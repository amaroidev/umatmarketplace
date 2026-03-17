import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Eye,
  Tag,
  Truck,
  MessageCircle,
  Share2,
  Flag,
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  User as UserIcon,
  ShoppingCart,
  Shield,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../services/product.service';
import chatService from '../services/chat.service';
import reviewService from '../services/review.service';
import savedItemService from '../services/savedItem.service';
import { ProductGrid } from '../components/product';
import { Button, LoadingSpinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ProductPopulated, ReviewPopulated, SellerRating } from '../types';

const conditionLabels: Record<string, string> = {
  'new': 'Brand New',
  'like-new': 'Like New',
  'good': 'Good',
  'fair': 'Fair',
  'poor': 'Poor',
};

const conditionColors: Record<string, string> = {
  'new': 'bg-green-100 text-green-700',
  'like-new': 'bg-moss-100 text-moss-700',
  'good': 'bg-yellow-100 text-yellow-700',
  'fair': 'bg-orange-100 text-orange-700',
  'poor': 'bg-red-100 text-red-700',
};

const deliveryLabels: Record<string, string> = {
  'pickup': 'Campus Pickup Only',
  'delivery': 'Delivery Available',
  'both': 'Pickup or Delivery',
};

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<ProductPopulated | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [reviews, setReviews] = useState<ReviewPopulated[]>([]);
  const [sellerRating, setSellerRating] = useState<SellerRating | null>(null);
  const [recommendations, setRecommendations] = useState<ProductPopulated[]>([]);
  const [priceInsights, setPriceInsights] = useState<{
    min: number;
    max: number;
    average: number;
    median: number;
    sampleSize: number;
    dealLabel: 'great_deal' | 'fair_price' | 'premium';
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productService.getProduct(id);
        if (res.success) {
          setProduct(res.data.product);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          navigate('/not-found', { replace: true });
        }
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  useEffect(() => {
    if (!product) return;

    const storageKey = 'recentViewedProducts';
    const maxItems = 12;

    try {
      const raw = localStorage.getItem(storageKey);
      const existing: ProductPopulated[] = raw ? JSON.parse(raw) : [];
      const withoutCurrent = existing.filter((item) => item._id !== product._id);
      const updated = [product, ...withoutCurrent].slice(0, maxItems);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Ignore localStorage issues
    }
  }, [product]);

  // Fetch related products
  useEffect(() => {
    if (!id) return;
    productService.getRelated(id, 6).then((res) => {
      if (res.success) setRelatedProducts(res.data);
    });

    productService.getRecommendations({ productId: id, limit: 6 }).then((res) => {
      if (res.success) setRecommendations(res.data);
    }).catch(() => {});

    productService.getPriceInsights(id).then((res) => {
      if (res.success) setPriceInsights(res.data);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id || !product) return;

    const fetchReviews = async () => {
      try {
        const [productReviewsRes, sellerRatingRes] = await Promise.all([
          reviewService.getProductReviews(id, 1, 10),
          reviewService.getSellerRating(product.seller._id),
        ]);

        if (productReviewsRes.success) {
          setReviews(productReviewsRes.data.reviews);
        }
        if (sellerRatingRes.success) {
          setSellerRating(sellerRatingRes.data.rating);
        }
      } catch {
        // Non-blocking
      }
    };

    fetchReviews();
  }, [id, product]);

  useEffect(() => {
    if (!id || !user || !product) return;
    if (user._id === product.seller._id) return;

    savedItemService
      .isSaved(id)
      .then((res) => {
        if (res.success) setIsSaved(res.data.isSaved);
      })
      .catch(() => {});
  }, [id, user, product]);

  const handleContactSeller = async () => {
    if (!user) {
      toast.error('Please log in to contact the seller');
      navigate('/login');
      return;
    }
    if (!product) return;

    setContacting(true);
    try {
      const res = await chatService.getOrCreateConversation(
        product.seller._id,
        product._id
      );
      if (res.success) {
        navigate(`/messages/${res.data.conversation._id}`);
      }
    } catch {
      toast.error('Failed to start conversation');
    } finally {
      setContacting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    setReporting(true);
    try {
      await productService.flagProduct(id!, reportReason);
      toast.success('Product reported. Our team will review it.');
      setShowReportModal(false);
      setReportReason('');
    } catch {
      toast.error('Failed to report product');
    } finally {
      setReporting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: `Check out ${product?.title} on CampusMarketplace`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleToggleSaved = async () => {
    if (!user) {
      toast.error('Please log in to save items');
      navigate('/login');
      return;
    }
    if (!product || user._id === product.seller._id) return;

    setSaving(true);
    try {
      const res = await savedItemService.toggleSavedItem(product._id);
      if (res.success) {
        setIsSaved(res.data.saved);
        toast.success(res.data.saved ? 'Saved to wishlist' : 'Removed from wishlist');
      }
    } catch {
      toast.error('Failed to update saved items');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading product..." fullScreen />;
  }

  if (!product) {
    return (
      <div className="page-container text-center py-20">
        <h2 className="text-xl font-bold text-earth-800 mb-2">Product Not Found</h2>
        <p className="text-earth-500 mb-4">This product may have been removed or doesn't exist.</p>
        <Link to="/products" className="btn-primary inline-block px-6 py-2">
          Browse Products
        </Link>
      </div>
    );
  }

  const seller = product.seller;
  const category = product.category;
  const isOwner = user && seller._id === user._id;
  const placeholderImage = `https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(product.title.slice(0, 20))}`;
  const images = product.images.length > 0 ? product.images : [{ url: placeholderImage, publicId: '' }];
  const sellerResponseTime = 15;

  return (
    <div className="page-container">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-earth-500 hover:text-earth-700 mb-4 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Images */}
        <div>
          {/* Main image */}
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-earth-100 mb-3">
            <img
              src={images[currentImageIndex].url}
              alt={product.title}
              className="w-full h-full object-contain bg-earth-50"
            />
            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            {/* Featured badge */}
            {product.isFeatured && (
              <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="h-4 w-4" />
                Featured
              </div>
            )}
            {/* Status */}
            {product.status === 'sold' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">SOLD</span>
              </div>
            )}
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-2 py-1 rounded">
              {currentImageIndex + 1}/{images.length}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    index === currentImageIndex ? 'border-earth-900' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div>
          {/* Category */}
          <Link
            to={`/products?category=${category.slug}`}
            className="text-sm text-earth-500 hover:text-earth-700 font-medium"
          >
            {category.name}
          </Link>

          {/* Title */}
          <h1 className="text-2xl font-bold text-earth-900 mt-1 mb-3">{product.title}</h1>

          {/* Price */}
          <div className="text-3xl font-bold text-earth-900 mb-4">
            GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
          </div>

          {priceInsights && (
            <div className="mb-5 border border-earth-200 bg-earth-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">Price intelligence</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-earth-400">Market range</p>
                  <p className="text-sm font-semibold text-earth-900">
                    GHS {priceInsights.min.toLocaleString('en-GH')} - GHS {priceInsights.max.toLocaleString('en-GH')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-earth-400">Average</p>
                  <p className="text-sm font-semibold text-earth-900">GHS {priceInsights.average.toLocaleString('en-GH')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-earth-400">Deal status</p>
                  <p className="text-sm font-semibold text-earth-900">
                    {priceInsights.dealLabel === 'great_deal' ? 'Great deal' : priceInsights.dealLabel === 'premium' ? 'Premium pricing' : 'Fair market price'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${conditionColors[product.condition]}`}>
              {conditionLabels[product.condition]}
            </span>
            {product.status === 'reserved' && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                Reserved
              </span>
            )}
          </div>

          {/* Key details */}
          <div className="space-y-3 mb-6 py-4 border-y border-earth-100">
            <div className="flex items-center gap-2 text-sm text-earth-600">
              <Truck className="h-4 w-4 text-earth-400" />
              {deliveryLabels[product.deliveryOption]}
            </div>

            <div className="flex items-center gap-2 text-sm text-earth-600">
              <Eye className="h-4 w-4 text-earth-400" />
              {product.views} views
            </div>
            <div className="flex items-center gap-2 text-sm text-earth-600">
              <Clock className="h-4 w-4 text-earth-400" />
              Listed {new Date(product.createdAt).toLocaleDateString('en-GH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-earth-700 mb-2">Description</h3>
            <p className="text-earth-600 text-sm leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-earth-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/products?search=${encodeURIComponent(tag)}`}
                    className="flex items-center gap-1 text-xs bg-earth-100 hover:bg-earth-200 text-earth-600 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mb-6">
            {isOwner ? (
              <Link
                to={`/products/${product._id}/edit`}
                className="btn-primary flex-1 text-center"
              >
                Edit Listing
              </Link>
            ) : (
              <>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={product.status !== 'active' || !user}
                  onClick={() => navigate(`/checkout/${product._id}`)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={product.status !== 'active' || contacting}
                  isLoading={contacting}
                  onClick={handleContactSeller}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Seller
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleToggleSaved}
                  isLoading={saving}
                  className="px-3"
                >
                  <Heart className={`h-4 w-4 ${isSaved ? 'text-red-500 fill-red-500' : ''}`} />
                </Button>
              </>
            )}
            <button
              onClick={handleShare}
              className="p-2.5 rounded-lg border border-earth-200 hover:bg-earth-50 text-earth-600"
              title="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
            {!isOwner && user && (
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2.5 rounded-lg border border-earth-200 hover:bg-red-50 text-earth-600 hover:text-red-600"
                title="Report"
              >
                <Flag className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Seller info */}
          <div className="bg-earth-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-earth-700 mb-3">Seller</h3>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-earth-100 flex items-center justify-center text-earth-700 font-bold text-lg">
                {seller.avatar ? (
                  <img src={seller.avatar} alt={seller.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  seller.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-earth-900">{seller.storeName || seller.brandName || seller.name}</span>
                  {seller.isVerified && (
                    <svg className="h-4 w-4 text-moss-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {seller.location && (
                  <p className="text-xs text-earth-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {seller.location}
                  </p>
                )}
              </div>
              <Link
                to={`/products?seller=${seller._id}`}
                className="text-sm text-earth-500 hover:text-earth-700 font-medium"
              >
                View Listings
              </Link>
            </div>
            {sellerRating && (
              <div className="mt-3 pt-3 border-t border-earth-200">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium text-earth-800">
                      {sellerRating.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-earth-500">
                    ({sellerRating.totalReviews} review{sellerRating.totalReviews === 1 ? '' : 's'})
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-3 border-t border-earth-200 pt-4 md:grid-cols-2">
              <div className="border border-earth-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-earth-400">Trust layer</p>
                <p className="mt-2 text-sm font-semibold text-earth-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-earth-500" />
                  Buyer protection ready
                </p>
                <p className="mt-1 text-xs leading-5 text-earth-500">
                  Payments are verified before seller fulfillment and disputes can be raised from your order timeline.
                </p>
              </div>
              <div className="border border-earth-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-earth-400">Seller pace</p>
                <p className="mt-2 text-sm font-semibold text-earth-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-earth-500" />
                  Replies in about {sellerResponseTime} mins
                </p>
                <p className="mt-1 text-xs leading-5 text-earth-500">
                  Meet in a public campus spot, inspect the item first, and keep chat/order history inside the app.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product reviews */}
      {reviews.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-earth-900 mb-4">Reviews</h2>
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white border border-earth-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-earth-900">{review.reviewer.name}</p>
                    <p className="text-xs text-earth-500 mt-0.5">
                      {new Date(review.createdAt).toLocaleDateString('en-GH')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-earth-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-earth-700 mt-3">{review.comment}</p>
                {review.reply && (
                  <div className="mt-3 bg-earth-50 border border-earth-100 rounded-lg p-3">
                    <p className="text-xs font-medium text-earth-600 mb-1">Seller reply</p>
                    <p className="text-sm text-earth-700">{review.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-earth-900 mb-4">Similar Products</h2>
          <ProductGrid products={relatedProducts} />
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-earth-900 mb-4">Because you viewed this</h2>
          <ProductGrid products={recommendations} />
        </div>
      )}

      {/* Report modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-earth-900 mb-2">Report Product</h3>
            <p className="text-sm text-earth-500 mb-4">
              Please tell us why you're reporting this product.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
              className="input w-full h-24 resize-none mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleReport}
                isLoading={reporting}
              >
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
