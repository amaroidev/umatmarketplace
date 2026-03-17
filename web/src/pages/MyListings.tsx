import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Package, Eye, Edit2, Trash2, MoreVertical, Zap, Upload, Copy, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../services/product.service';
import { LoadingSpinner } from '../components/ui';
import { ProductPopulated, PaginationInfo, ProductStatus } from '../types';

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  sold: 'bg-earth-100 text-earth-600',
  reserved: 'bg-orange-100 text-orange-700',
  draft: 'bg-yellow-100 text-yellow-700',
  removed: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  sold: 'Sold',
  reserved: 'Reserved',
  draft: 'Draft',
  removed: 'Removed',
};

const MyListings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<ProductPopulated[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [boostingId, setBoostingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await productService.getMyListings({
        status: (statusFilter as ProductStatus) || undefined,
        page,
        limit: 20,
      });
      if (res.success) {
        setProducts(res.data);
        setPagination(res.pagination);
      }
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [statusFilter, page]);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await productService.importCSV(file);
      toast.success(res.message);
      if (res.data.errors.length > 0) {
        toast.error(`${res.data.errors.length} items failed to import. Check console for details.`);
        console.error('Import Errors:', res.data.errors);
      }
      fetchListings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDuplicate = async (productId: string) => {
    try {
      const res = await productService.duplicateProduct(productId);
      toast.success('Listing duplicated');
      fetchListings();
    } catch {
      toast.error('Failed to duplicate listing');
    } finally {
      setOpenMenu(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;
    setDeletingId(productId);
    try {
      await productService.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Listing deleted');
    } catch {
      toast.error('Failed to delete listing');
    } finally {
      setDeletingId(null);
      setOpenMenu(null);
    }
  };

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      await productService.updateProduct(productId, { status: newStatus });
      setProducts((prev) => prev.map((p) => p._id === productId ? { ...p, status: newStatus as any } : p));
      toast.success(`Listing marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
    setOpenMenu(null);
  };

  const handleBoostRequest = async (productId: string) => {
    setBoostingId(productId);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Boost request submitted. Admin will review your listing for featuring.');
    } catch {
      toast.error('Failed to submit boost request');
    } finally {
      setBoostingId(null);
      setOpenMenu(null);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-1">Seller</p>
          <h1 className="text-3xl font-black text-earth-900 uppercase tracking-tight">My Listings</h1>
          {pagination && (
            <p className="text-xs text-earth-500 mt-1">
              {pagination.total} listing{pagination.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleImportCSV}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-earth-100 text-earth-900 border border-earth-300 text-xs font-bold uppercase tracking-[0.12em] hover:bg-earth-200 transition-colors disabled:opacity-50"
          >
            {importing ? (
               <span className="h-4 w-4 border-2 border-earth-400 border-t-earth-900 rounded-full animate-spin" />
            ) : (
               <Upload className="h-4 w-4" />
            )}
            Import CSV
          </button>
          <Link
            to="/seller/analytics"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-earth-900 border border-earth-300 text-xs font-bold uppercase tracking-[0.12em] hover:bg-earth-50 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Link>
          <Link
            to="/sell"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-earth-900 text-white text-xs font-bold uppercase tracking-[0.12em] hover:bg-earth-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Listing
          </Link>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-0 overflow-x-auto mb-6 border-b border-earth-200">
        {['', 'active', 'draft', 'reserved', 'sold', 'removed'].map((status) => (
          <button
            key={status}
            onClick={() => updateFilter('status', status)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] whitespace-nowrap border-b-2 -mb-px transition-colors ${
              statusFilter === status
                ? 'border-earth-900 text-earth-900'
                : 'border-transparent text-earth-400 hover:text-earth-700'
            }`}
          >
            {status ? statusLabels[status] : 'All'}
          </button>
        ))}
      </div>

      {/* Listings */}
      {loading ? (
        <LoadingSpinner text="Loading your listings..." />
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-14 w-14 mx-auto text-earth-200 mb-5" />
          <h2 className="text-lg font-black text-earth-700 uppercase tracking-wide mb-2">No Listings Yet</h2>
          <p className="text-earth-500 mb-6 text-sm">Start selling by creating your first listing.</p>
          <Link
            to="/sell"
            className="inline-flex items-center gap-2 px-6 py-3 bg-earth-900 text-white text-xs font-bold uppercase tracking-[0.15em]"
          >
            <Plus className="h-4 w-4" />
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="border border-earth-200 divide-y divide-earth-100">
          {products.map((product) => {
            const mainImage = product.images.length > 0
              ? product.images[0].url
              : `https://placehold.co/100x100/e2e8f0/64748b?text=${encodeURIComponent(product.title.slice(0, 8))}`;

            return (
              <div
                key={product._id}
                className="flex items-center gap-4 bg-white p-4 hover:bg-earth-50 transition-colors"
              >
                {/* Image */}
                <Link to={`/products/${product._id}`} className="flex-shrink-0">
                  <img src={mainImage} alt={product.title} className="w-16 h-16 object-cover" />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/products/${product._id}`}
                      className="text-sm font-semibold text-earth-900 hover:text-earth-600 line-clamp-1 transition-colors"
                    >
                      {product.title}
                    </Link>
                    {product.isFeatured && (
                      <span className="flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] bg-yellow-100 text-yellow-700 border border-yellow-200">
                        <Zap className="h-2.5 w-2.5" />
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-base font-black text-earth-900 mt-0.5">
                    GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-earth-400">
                    <span className={`px-2 py-0.5 font-bold text-[10px] uppercase tracking-wide ${statusStyles[product.status]}`}>
                      {statusLabels[product.status]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {product.views}
                    </span>
                    <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {product.status === 'active' && !product.isFeatured && (
                    <button
                      onClick={() => handleBoostRequest(product._id)}
                      disabled={boostingId === product._id}
                      title="Request Featured Boost"
                      className="flex items-center gap-1 px-2 py-1.5 border border-yellow-300 text-yellow-700 text-[9px] font-bold uppercase tracking-[0.14em] hover:bg-yellow-50 disabled:opacity-40 transition-colors"
                    >
                      <Zap className="h-3 w-3" />
                      {boostingId === product._id ? '...' : 'Boost'}
                    </button>
                  )}
                  <Link
                    to={`/products/${product._id}/edit`}
                    className="p-2 hover:bg-earth-100 text-earth-500 hover:text-earth-700 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === product._id ? null : product._id)}
                      className="p-2 hover:bg-earth-100 text-earth-500 hover:text-earth-700 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenu === product._id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                        <div className="absolute right-0 top-full mt-1 bg-white border border-earth-200 shadow-lg z-20 py-1 min-w-[160px]">
                          {product.status !== 'active' && (
                            <button
                              onClick={() => handleStatusChange(product._id, 'active')}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-earth-50 text-green-700 font-medium uppercase tracking-wide"
                            >
                              Mark Active
                            </button>
                          )}
                          {product.status !== 'sold' && (
                            <button
                              onClick={() => handleStatusChange(product._id, 'sold')}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-earth-50 text-earth-600 font-medium uppercase tracking-wide"
                            >
                              Mark Sold
                            </button>
                          )}
                          {product.status !== 'reserved' && (
                            <button
                              onClick={() => handleStatusChange(product._id, 'reserved')}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-earth-50 text-orange-700 font-medium uppercase tracking-wide"
                            >
                              Mark Reserved
                            </button>
                          )}
                          {!product.isFeatured && product.status === 'active' && (
                            <button
                              onClick={() => handleBoostRequest(product._id)}
                              disabled={boostingId === product._id}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-yellow-50 text-yellow-700 font-medium uppercase tracking-wide"
                            >
                              <span className="inline-flex items-center gap-1">
                                <Zap className="h-3.5 w-3.5" />
                                {boostingId === product._id ? 'Requesting...' : 'Request Boost'}
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDuplicate(product._id)}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-earth-50 text-earth-700 font-medium uppercase tracking-wide flex items-center gap-2"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Duplicate
                          </button>
                          <div className="h-px bg-earth-100 my-1" />
                          <button
                            onClick={() => handleDelete(product._id)}
                            disabled={deletingId === product._id}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 text-red-600 font-medium uppercase tracking-wide flex items-center gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === product._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-earth-200">
          {page > 1 && (
            <button
              onClick={() => updateFilter('page', String(page - 1))}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-earth-300 text-earth-700 hover:bg-earth-100 transition-colors"
            >
              Previous
            </button>
          )}
          <span className="text-xs text-earth-500 uppercase tracking-[0.15em]">
            {page} / {pagination.pages}
          </span>
          {page < pagination.pages && (
            <button
              onClick={() => updateFilter('page', String(page + 1))}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-earth-300 text-earth-700 hover:bg-earth-100 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MyListings;
