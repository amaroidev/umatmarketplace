import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductPopulated } from '../../types';
import { useAuth } from '../../context/AuthContext';
import savedItemService from '../../services/savedItem.service';

interface ProductCardProps {
  product: ProductPopulated;
  onSavedChange?: (productId: string, saved: boolean) => void;
}

const conditionLabel: Record<string, string> = {
  'new': 'New',
  'like-new': 'Like New',
  'good': 'Good',
  'fair': 'Fair',
  'poor': 'Poor',
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onSavedChange }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const sellerName = typeof product.seller === 'string' ? 'Seller' : product.seller.name;
  const sellerVerified = typeof product.seller === 'string' ? false : product.seller.isVerified;

  const placeholderImage = `https://placehold.co/400x300/f3f5f7/9ba3a7?text=${encodeURIComponent(product.title.slice(0, 15))}`;
  const mainImage = product.images.length > 0 ? product.images[0].url : placeholderImage;

  const [isSaved, setIsSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const isOwner = user?._id === (typeof product.seller === 'string' ? product.seller : product.seller._id);

  React.useEffect(() => {
    if (!isAuthenticated || isOwner) return;
    savedItemService
      .isSaved(product._id)
      .then((res) => { if (res.success) setIsSaved(res.data.isSaved); })
      .catch(() => {});
  }, [isAuthenticated, isOwner, product._id]);

  const handleToggleSaved = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to save items');
      navigate('/login');
      return;
    }
    setSaving(true);
    try {
      const res = await savedItemService.toggleSavedItem(product._id);
      if (res.success) {
        setIsSaved(res.data.saved);
        onSavedChange?.(product._id, res.data.saved);
        toast.success(res.data.saved ? 'Saved to wishlist' : 'Removed from wishlist');
      }
    } catch {
      toast.error('Failed to update saved items');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Link to={`/products/${product._id}`} className="group block">
      {/* ── Image ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-earth-100">
        <img
          src={mainImage}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />

        {/* Quick View — slides up from bottom on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-earth-900/90 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
          Quick View
        </div>

        {/* Save button — fades in on hover */}
        {!isOwner && (
          <button
            onClick={handleToggleSaved}
            disabled={saving}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-earth-50"
            title={isSaved ? 'Remove from saved' : 'Save item'}
          >
            <Heart className={`h-3.5 w-3.5 transition-colors ${isSaved ? 'fill-earth-900 text-earth-900' : 'text-earth-500'}`} />
          </button>
        )}

        {/* Featured badge */}
        {product.isFeatured && (
          <div className="absolute left-3 top-3 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-earth-900 shadow-sm">
            Featured
          </div>
        )}

        {/* Sold overlay */}
        {product.status === 'sold' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-white">Sold</span>
          </div>
        )}

        {/* Reserved badge */}
        {product.status === 'reserved' && (
          <div className={`absolute ${product.isFeatured ? 'top-10' : 'top-3'} left-3 bg-orange-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white`}>
            Reserved
          </div>
        )}

        {/* Image count */}
        {product.images.length > 1 && (
          <div className="absolute bottom-10 right-3 bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
            1/{product.images.length}
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="pt-3">
        <h3 className="line-clamp-1 text-sm font-medium text-earth-700 transition-colors group-hover:text-earth-900">
          {product.title}
        </h3>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-earth-900">
            GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-earth-400">
            {conditionLabel[product.condition] || product.condition}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1">
          <span className="truncate text-xs text-earth-400">{sellerName}</span>
          {sellerVerified && (
            <svg className="h-3 w-3 flex-shrink-0 text-moss-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
