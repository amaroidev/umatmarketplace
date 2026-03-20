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

interface CreateProductPayload {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  deliveryOption?: string;
  pickupLocation?: string;
  tags?: string[];
  status?: string;
  images?: Array<{
    uri: string;
    type?: string;
    name?: string;
  }>;
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

  createProduct: async (payload: CreateProductPayload): Promise<ProductResponse> => {
    const hasImages = Array.isArray(payload.images) && payload.images.length > 0;

    if (hasImages) {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('price', String(payload.price));
      formData.append('category', payload.category);
      formData.append('condition', payload.condition);
      if (payload.deliveryOption) formData.append('deliveryOption', payload.deliveryOption);
      if (payload.pickupLocation) formData.append('pickupLocation', payload.pickupLocation);
      if (payload.status) formData.append('status', payload.status);
      if (payload.tags?.length) {
        formData.append('tags', payload.tags.join(','));
      }

      payload.images!.forEach((image, idx) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `listing-${Date.now()}-${idx}.jpg`,
        } as any);
      });

      const response = await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

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
