import api from './api';
import { Product, ProductPopulated, ProductFilters, PaginatedResponse, PaginationInfo } from '../types';

export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  deliveryOption?: string;
  pickupLocation?: string;
  tags?: string[];
  status?: string;
  images?: File[];
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  condition?: string;
  status?: string;
  deliveryOption?: string;
  pickupLocation?: string;
  tags?: string[];
  images?: File[];
}

interface ApiProductResponse {
  success: boolean;
  message: string;
  data: { product: ProductPopulated };
}

interface ApiProductListResponse {
  success: boolean;
  message: string;
  data: ProductPopulated[];
  pagination: PaginationInfo;
}

const productService = {
  /**
   * Get products with filters
   */
  getProducts: async (filters?: ProductFilters): Promise<ApiProductListResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single product by ID
   */
  getProduct: async (id: string): Promise<ApiProductResponse> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Get featured products
   */
  getFeatured: async (limit?: number): Promise<{ success: boolean; data: ProductPopulated[] }> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/products/featured${params}`);
    return response.data;
  },

  /**
   * Get recent products
   */
  getRecent: async (limit?: number): Promise<{ success: boolean; data: ProductPopulated[] }> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/products/recent${params}`);
    return response.data;
  },

  /**
   * Get trending/popular products
   */
  getTrending: async (limit?: number): Promise<{ success: boolean; data: ProductPopulated[] }> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/products/trending${params}`);
    return response.data;
  },

  /**
   * Get search suggestions (autocomplete)
   */
  getSearchSuggestions: async (q: string, limit?: number): Promise<{ success: boolean; data: { title: string; type: 'product' | 'tag' }[] }> => {
    const params = new URLSearchParams({ q });
    if (limit) params.set('limit', String(limit));
    const response = await api.get(`/products/search/suggestions?${params.toString()}`);
    return response.data;
  },

  /**
   * Get related products
   */
  getRelated: async (productId: string, limit?: number): Promise<{ success: boolean; data: ProductPopulated[] }> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/products/${productId}/related${params}`);
    return response.data;
  },

  /**
   * Get current user's listings
   */
  getMyListings: async (filters?: ProductFilters): Promise<ApiProductListResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/products/my/listings?${params.toString()}`);
    return response.data;
  },

  /**
   * Create a new product (multipart form for images)
   */
  createProduct: async (data: CreateProductData): Promise<ApiProductResponse> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', String(data.price));
    formData.append('category', data.category);
    formData.append('condition', data.condition);

    if (data.deliveryOption) formData.append('deliveryOption', data.deliveryOption);
    if (data.pickupLocation) formData.append('pickupLocation', data.pickupLocation);
    if (data.status) formData.append('status', data.status);
    if (data.tags && data.tags.length > 0) {
      formData.append('tags', data.tags.join(','));
    }

    // Append image files
    if (data.images) {
      data.images.forEach((file) => {
        formData.append('images', file);
      });
    }

    const response = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Update a product (multipart form for new images)
   */
  updateProduct: async (id: string, data: UpdateProductData): Promise<ApiProductResponse> => {
    const formData = new FormData();

    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.price !== undefined) formData.append('price', String(data.price));
    if (data.category) formData.append('category', data.category);
    if (data.condition) formData.append('condition', data.condition);
    if (data.status) formData.append('status', data.status);
    if (data.deliveryOption) formData.append('deliveryOption', data.deliveryOption);
    if (data.pickupLocation !== undefined) formData.append('pickupLocation', data.pickupLocation);
    if (data.tags && data.tags.length > 0) {
      formData.append('tags', data.tags.join(','));
    }

    if (data.images) {
      data.images.forEach((file) => {
        formData.append('images', file);
      });
    }

    const response = await api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Delete a product
   */
  deleteProduct: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Delete specific images from a product
   */
  deleteImages: async (productId: string, publicIds: string[]): Promise<ApiProductResponse> => {
    const response = await api.delete(`/products/${productId}/images`, {
      data: { publicIds },
    });
    return response.data;
  },

  /**
   * Flag/report a product
   */
  flagProduct: async (id: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/products/${id}/flag`, { reason });
    return response.data;
  },

  /**
   * Toggle featured status (admin)
   */
  toggleFeatured: async (id: string): Promise<ApiProductResponse> => {
    const response = await api.patch(`/products/${id}/featured`);
    return response.data;
  },

  /**
   * Duplicate a product (seller)
   */
  duplicateProduct: async (id: string): Promise<ApiProductResponse> => {
    const response = await api.post(`/products/${id}/duplicate`);
    return response.data;
  },

  /**
   * Import products from CSV
   */
  importCSV: async (file: File): Promise<{ success: boolean; message: string; data: { successCount: number; errors: any[] } }> => {
    const formData = new FormData();
    formData.append('csvFile', file);
    const response = await api.post('/products/bulk/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default productService;
