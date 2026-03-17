export interface User {
  _id: string;
  name: string;
  storeName?: string;
  brandName?: string;
  email: string;
  phone: string;
  role: 'buyer' | 'seller' | 'admin';
  avatar?: string;
  isVerified: boolean;
  location?: string;
  responseTimeMinutes?: number;
}

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface ProductSeller {
  _id: string;
  name: string;
  storeName?: string;
  brandName?: string;
  avatar?: string;
  isVerified?: boolean;
  location?: string;
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: ProductImage[];
  category: ProductCategory;
  seller: ProductSeller;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  status: 'active' | 'sold' | 'reserved' | 'draft' | 'removed';
  deliveryOption: 'pickup' | 'delivery' | 'both';
  pickupLocation?: string;
  views: number;
  isFeatured: boolean;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
