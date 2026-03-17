import api from './api';
import { OrderPopulated, PaginationInfo, OrderStatus } from '../types';

export interface CreateOrderData {
  productId: string;
  quantity?: number;
  deliveryMethod: 'pickup' | 'delivery';
  pickupLocation?: string;
  deliveryAddress?: string;
  note?: string;
}

interface ApiOrderResponse {
  success: boolean;
  message: string;
  data: { order: OrderPopulated };
}

interface ApiOrderListResponse {
  success: boolean;
  data: { orders: OrderPopulated[] };
  pagination: PaginationInfo;
}

interface ApiSellerStatsResponse {
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

const orderService = {
  /**
   * Create a new order
   */
  createOrder: async (data: CreateOrderData): Promise<ApiOrderResponse> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  /**
   * Get a single order by ID
   */
  getOrder: async (id: string): Promise<ApiOrderResponse> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  /**
   * Get buyer's purchase history
   */
  getMyPurchases: async (
    status?: OrderStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiOrderListResponse> => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const response = await api.get(`/orders/my/purchases?${params.toString()}`);
    return response.data;
  },

  /**
   * Get seller's incoming orders
   */
  getMySales: async (
    status?: OrderStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiOrderListResponse> => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const response = await api.get(`/orders/my/sales?${params.toString()}`);
    return response.data;
  },

  /**
   * Update order status (seller action)
   */
  updateOrderStatus: async (
    orderId: string,
    status: string
  ): Promise<ApiOrderResponse> => {
    const response = await api.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  /**
   * Cancel an order
   */
  cancelOrder: async (
    orderId: string,
    reason?: string
  ): Promise<ApiOrderResponse> => {
    const response = await api.post(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  /**
   * Get seller stats
   */
  getSellerStats: async (): Promise<ApiSellerStatsResponse> => {
    const response = await api.get('/orders/seller/stats');
    return response.data;
  },
};

export default orderService;
