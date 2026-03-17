import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, ChevronDown, X } from 'lucide-react';
import productService from '../services/product.service';
import categoryService from '../services/category.service';
import { ProductGrid } from '../components/product';
import { LoadingSpinner } from '../components/ui';
import { ProductPopulated, Category, PaginationInfo, ProductCondition, DeliveryOption } from '../types';

const conditionOptions = [
  { value: '', label: 'All Conditions' },
  { value: 'new', label: 'Brand New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const sortOptions = [
  { value: '', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Viewed' },
  { value: 'oldest', label: 'Oldest First' },
];

const deliveryOptions = [
  { value: '', label: 'All Delivery' },
  { value: 'pickup', label: 'Campus Pickup' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'both', label: 'Pickup or Delivery' },
];

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<ProductPopulated[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Read filters from URL
  const category = searchParams.get('category') || '';
  const condition = searchParams.get('condition') || '';
  const sort = searchParams.get('sort') || '';
  const search = searchParams.get('search') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const deliveryOption = searchParams.get('delivery') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Fetch categories
  useEffect(() => {
    categoryService.getCategories().then((res) => {
      if (res.success) setCategories(res.data.categories);
    });
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await productService.getProducts({
          category: category || undefined,
          condition: (condition as ProductCondition) || undefined,
          sort: sort || undefined,
          search: search || undefined,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          deliveryOption: (deliveryOption as DeliveryOption) || undefined,
          page,
          limit: 20,
        });
        if (res.success) {
          setProducts(res.data);
          setPagination(res.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, condition, sort, search, minPrice, maxPrice, deliveryOption, page]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change
    if (key !== 'page') {
      params.delete('page');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = category || condition || minPrice || maxPrice || deliveryOption;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">
            {search ? `Results for "${search}"` : 'Browse Products'}
          </h1>
          {pagination && (
            <p className="text-sm text-earth-500 mt-1">
              {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-earth-200 hover:bg-earth-50 text-sm font-medium text-earth-700 md:hidden"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-clay-700 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              !
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters - Desktop */}
        <div className={`${showFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : 'hidden'} md:block md:static md:w-64 md:flex-shrink-0`}>
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button onClick={() => setShowFilters(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Category filter */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-earth-700 mb-2">Category</h3>
            <div className="space-y-1">
              <button
                onClick={() => updateFilter('category', '')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                  !category ? 'bg-earth-100 text-earth-900 font-medium' : 'text-earth-600 hover:bg-earth-50'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => updateFilter('category', cat.slug)}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                    category === cat.slug
                      ? 'bg-earth-100 text-earth-900 font-medium'
                      : 'text-earth-600 hover:bg-earth-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Condition filter */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-earth-700 mb-2">Condition</h3>
            <select
              value={condition}
              onChange={(e) => updateFilter('condition', e.target.value)}
              className="input text-sm"
            >
              {conditionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-earth-700 mb-2">Price Range (GHS)</h3>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                className="input text-sm"
                min="0"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                className="input text-sm"
                min="0"
              />
            </div>
          </div>

          {/* Delivery option */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-earth-700 mb-2">Delivery</h3>
            <select
              value={deliveryOption}
              onChange={(e) => updateFilter('delivery', e.target.value)}
              className="input text-sm"
            >
              {deliveryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full text-sm text-red-600 hover:text-red-700 py-2 font-medium"
            >
              Clear All Filters
            </button>
          )}

          {/* Close on mobile */}
          <button
            onClick={() => setShowFilters(false)}
            className="w-full mt-4 btn-primary md:hidden"
          >
            Apply Filters
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-earth-100">
            <div className="hidden md:flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-earth-500">Sort:</span>
              <select
                value={sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="text-sm border border-earth-200 rounded-lg px-3 py-1.5 bg-white"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <LoadingSpinner text="Loading products..." />
          ) : (
            <>
              <ProductGrid
                products={products}
                emptyMessage={
                  search
                    ? `No products found for "${search}"`
                    : 'No products available yet. Be the first to list!'
                }
              />

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {page > 1 && (
                    <button
                      onClick={() => updateFilter('page', String(page - 1))}
                      className="px-4 py-2 text-sm rounded-lg border border-earth-200 hover:bg-earth-50"
                    >
                      Previous
                    </button>
                  )}
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum: number;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateFilter('page', String(pageNum))}
                        className={`px-4 py-2 text-sm rounded-lg border ${
                          pageNum === page
                            ? 'bg-earth-900 text-white border-earth-900'
                            : 'border-earth-200 hover:bg-earth-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {page < pagination.pages && (
                    <button
                      onClick={() => updateFilter('page', String(page + 1))}
                      className="px-4 py-2 text-sm rounded-lg border border-earth-200 hover:bg-earth-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
