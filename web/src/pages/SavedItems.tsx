import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductGrid } from '../components/product';
import { LoadingSpinner } from '../components/ui';
import savedItemService from '../services/savedItem.service';
import { ProductPopulated, PaginationInfo } from '../types';

const SavedItems: React.FC = () => {
  const [products, setProducts] = useState<ProductPopulated[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchSavedItems = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await savedItemService.getSavedItems(targetPage, 20);
      if (res.success) {
        setProducts(res.data.products);
        setPagination(res.pagination);
      }
    } catch {
      toast.error('Failed to load saved items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedItems(page);
  }, [page]);

  const handleSavedChange = (productId: string, saved: boolean) => {
    if (!saved) {
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    }
  };

  if (loading && page === 1) {
    return <LoadingSpinner text="Loading saved items..." fullScreen />;
  }

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="flex items-end gap-4 mb-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400">Collection</p>
      </div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-black text-earth-900 uppercase tracking-tight flex items-center gap-3">
          <Heart className="h-6 w-6 text-earth-700" />
          Saved Items
        </h1>
        {pagination && (
          <span className="text-xs text-earth-400 font-bold uppercase tracking-[0.15em]">
            {pagination.total ?? products.length} item{(pagination.total ?? products.length) !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="h-px bg-earth-200 mb-8" />

      <ProductGrid
        products={products}
        emptyMessage="You haven't saved any items yet."
        onSavedChange={handleSavedChange}
      />

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1 || loading}
            className="px-5 py-2 border border-earth-300 text-xs font-bold uppercase tracking-[0.15em] text-earth-700 hover:border-earth-900 hover:text-earth-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
            disabled={page >= pagination.pages || loading}
            className="px-5 py-2 border border-earth-300 text-xs font-bold uppercase tracking-[0.15em] text-earth-700 hover:border-earth-900 hover:text-earth-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SavedItems;
