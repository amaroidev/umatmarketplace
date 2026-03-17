import React from 'react';
import { ProductPopulated } from '../../types';
import ProductCard from './ProductCard';
import { LoadingSpinner } from '../ui';

interface ProductGridProps {
  products: ProductPopulated[];
  loading?: boolean;
  emptyMessage?: string;
  onSavedChange?: (productId: string, saved: boolean) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  emptyMessage = 'No products found',
  onSavedChange,
}) => {
  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mb-3 text-earth-400">
          <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-lg text-earth-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} onSavedChange={onSavedChange} />
      ))}
    </div>
  );
};

export default ProductGrid;
