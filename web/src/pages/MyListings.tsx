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
  const [importWithImages, setImportWithImages] = useState(false);
  const [previewingCSV, setPreviewingCSV] = useState(false);
  const [pendingCSVFile, setPendingCSVFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ importMode: 'shopify' | 'generic'; headers: string[]; totalRows: number; estimatedValid: number; estimatedInvalid: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUpdatingStatus, setBulkUpdatingStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ mode: 'single' | 'bulk'; productId?: string; count?: number } | null>(null);
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

  useEffect(() => {
    setSelectedIds([]);
  }, [products]);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingCSVFile(file);
    setPreviewingCSV(true);
    try {
      const preview = await productService.previewCSV(file);
      if (preview.success) {
        setCsvPreview(preview.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to preview CSV');
      setPendingCSVFile(null);
      setPreviewingCSV(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const runImportCSV = async () => {
    if (!pendingCSVFile) return;
    setImporting(true);
    try {
      const res = await productService.importCSV(pendingCSVFile, { withImages: importWithImages });
      toast.success(res.message);
      if (res.data.importMode) {
        toast(`${res.data.importMode.toUpperCase()} import mode${res.data.withImages ? ` • ${res.data.imagesImported || 0} images imported` : ''}`);
      }
      if (res.data.errors.length > 0) {
        toast.error(`${res.data.errors.length} items failed to import. Check console for details.`);
        console.error('Import Errors:', res.data.errors);
      }
      if (res.data.errors.length > 0) {
        const sample = res.data.errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.message}`).join('\n');
        toast.error(`Sample errors:\n${sample}`);
      }
      fetchListings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
      setPendingCSVFile(null);
      setCsvPreview(null);
      setPreviewingCSV(false);
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
    setConfirmDelete({ mode: 'single', productId });
  };

  const runSingleDelete = async (productId: string) => {
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
      setConfirmDelete(null);
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

  const toggleSelect = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const allSelected = products.length > 0 && selectedIds.length === products.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setConfirmDelete({ mode: 'bulk', count: selectedIds.length });
  };

  const runBulkDelete = async () => {
    setBulkDeleting(true);
    let deleted = 0;
    for (const id of selectedIds) {
      try {
        await productService.deleteProduct(id);
        deleted++;
      } catch {
      }
    }
    setBulkDeleting(false);
    setSelectedIds([]);
    toast.success(`Deleted ${deleted} listing${deleted === 1 ? '' : 's'}`);
    setConfirmDelete(null);
    fetchListings();
  };

  const handleBulkStatus = async (status: 'active' | 'draft' | 'sold') => {
    if (selectedIds.length === 0) return;
    setBulkUpdatingStatus(true);
    try {
      const res = await productService.bulkUpdateStatus(selectedIds, status);
      toast.success(res.message || `Updated ${status}`);
      await fetchListings();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setBulkUpdatingStatus(false);
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
          <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-earth-500">
            <input
              type="checkbox"
              checked={importWithImages}
              onChange={(e) => setImportWithImages(e.target.checked)}
              className="h-3.5 w-3.5 accent-earth-900"
            />
            Import images
          </label>
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

      {products.length > 0 && (
        <div className="mb-4 flex items-center justify-between border border-earth-200 bg-earth-50 px-4 py-2.5">
          <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-earth-600">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-3.5 w-3.5 accent-earth-900" />
            Select all ({products.length})
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-earth-500">{selectedIds.length} selected</span>
            <button
              onClick={() => handleBulkStatus('active')}
              disabled={selectedIds.length === 0 || bulkUpdatingStatus}
              className="inline-flex items-center gap-1.5 border border-green-300 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-green-700 hover:bg-green-50 disabled:opacity-50"
            >
              Mark Active
            </button>
            <button
              onClick={() => handleBulkStatus('draft')}
              disabled={selectedIds.length === 0 || bulkUpdatingStatus}
              className="inline-flex items-center gap-1.5 border border-yellow-300 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
            >
              Mark Draft
            </button>
            <button
              onClick={() => handleBulkStatus('sold')}
              disabled={selectedIds.length === 0 || bulkUpdatingStatus}
              className="inline-flex items-center gap-1.5 border border-earth-300 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-earth-700 hover:bg-earth-100 disabled:opacity-50"
            >
              Mark Sold
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0 || bulkDeleting}
              className="inline-flex items-center gap-1.5 border border-red-300 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
            </button>
          </div>
        </div>
      )}

      {previewingCSV && csvPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-2xl border border-earth-200 bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">CSV Preview</p>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-earth-900">Import summary</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="border border-earth-100 p-3"><p className="text-[10px] text-earth-400">Mode</p><p className="text-sm font-bold text-earth-900 uppercase">{csvPreview.importMode}</p></div>
              <div className="border border-earth-100 p-3"><p className="text-[10px] text-earth-400">Rows</p><p className="text-sm font-bold text-earth-900">{csvPreview.totalRows}</p></div>
              <div className="border border-earth-100 p-3"><p className="text-[10px] text-earth-400">Estimated valid</p><p className="text-sm font-bold text-green-700">{csvPreview.estimatedValid}</p></div>
              <div className="border border-earth-100 p-3"><p className="text-[10px] text-earth-400">Estimated invalid</p><p className="text-sm font-bold text-red-700">{csvPreview.estimatedInvalid}</p></div>
            </div>
            <div className="mt-4 border border-earth-100 p-3 max-h-40 overflow-auto">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-earth-400 mb-2">Detected columns</p>
              <p className="text-xs text-earth-600 leading-6">{csvPreview.headers.join(', ')}</p>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => { setPreviewingCSV(false); setCsvPreview(null); setPendingCSVFile(null); }}
                className="border border-earth-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-earth-600"
              >
                Cancel
              </button>
              <button
                onClick={runImportCSV}
                disabled={importing}
                className="bg-earth-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md border border-earth-200 bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">Confirm delete</p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-earth-900">This cannot be undone</h3>
            <p className="mt-3 text-sm text-earth-600">
              {confirmDelete.mode === 'single'
                ? 'Delete this listing permanently?'
                : `Delete ${confirmDelete.count || selectedIds.length} selected listings permanently?`}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="border border-earth-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-earth-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.mode === 'single' && confirmDelete.productId) {
                    runSingleDelete(confirmDelete.productId);
                    return;
                  }
                  runBulkDelete();
                }}
                disabled={bulkDeleting || !!deletingId}
                className="bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
              >
                {bulkDeleting || deletingId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product._id)}
                  onChange={() => toggleSelect(product._id)}
                  className="h-4 w-4 accent-earth-900"
                />
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
