import api from './api';

export interface OrderItem {
  product: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
}

export interface OrderUser {
  _id: string;
  name: string;
  avatar?: string;
  phone?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  buyer: OrderUser;
  seller: OrderUser;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'confirmed' | 'ready' | 'completed' | 'cancelled' | 'disputed';
  deliveryMethod: 'pickup' | 'delivery';
  pickupLocation?: string;
  deliveryAddress?: string;
  deliveryFee: number;
  note?: string;
  cancelReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const orderService = {
  getMyPurchases: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: { orders: Order[] } }> => {
    const response = await api.get('/orders/my/purchases', { params });
    return response.data;
  },

  getMySales: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: { orders: Order[] } }> => {
    const response = await api.get('/orders/my/sales', { params });
    return response.data;
  },

  getOrderById: async (
    id: string
  ): Promise<{ success: boolean; data: { order: Order } }> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (body: {
    productId: string;
    quantity?: number;
    deliveryMethod: 'pickup' | 'delivery';
    pickupLocation?: string;
    deliveryAddress?: string;
    note?: string;
  }): Promise<{ success: boolean; data: { order: Order } }> => {
    const response = await api.post('/orders', body);
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: string
  ): Promise<{ success: boolean; data: { order: Order } }> => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  cancelOrder: async (
    id: string,
    reason?: string
  ): Promise<{ success: boolean; data: { order: Order } }> => {
    const response = await api.post(`/orders/${id}/cancel`, { reason });
    return response.data;
  },
};

export default orderService;
