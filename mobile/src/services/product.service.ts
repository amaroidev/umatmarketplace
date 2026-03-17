import api from './api';
import { PaginationInfo, Product } from '../types';

interface ProductListResponse {
  success: boolean;
  data: Product[];
  pagination: PaginationInfo;
}

interface ProductResponse {
  success: boolean;
  data: {
    product: Product;
  };
}

interface SellerStatsResponse {
  success: boolean;
  data: {
    stats: {
      totalOrders: number;
      totalRevenue: number;
      pendingOrders: number;
      completedOrders: number;
    };
  };
}

interface ProductDetailResponse {
  success: boolean;
  data: {
    product: Product;
  };
}

const productService = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    deliveryOption?: string;
    sort?: string;
  }): Promise<ProductListResponse> => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProductById: async (id: string): Promise<ProductDetailResponse> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (payload: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    deliveryOption?: string;
    pickupLocation?: string;
    tags?: string[];
    status?: string;
  }): Promise<ProductResponse> => {
    const response = await api.post('/products', payload);
    return response.data;
  },

  duplicateProduct: async (id: string): Promise<ProductResponse> => {
    const response = await api.post(`/products/${id}/duplicate`);
    return response.data;
  },

  getSellerStats: async (): Promise<SellerStatsResponse> => {
    const response = await api.get('/orders/seller/stats');
    return response.data;
  },
};

export default productService;
