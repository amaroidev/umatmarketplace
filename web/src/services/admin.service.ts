import api from './api';
import { OrderPopulated, PaginationInfo, ProductPopulated, User } from '../types';

export interface AdminDashboardStats {
  totalUsers: number;
  totalSellers: number;
  verifiedSellers: number;
  bannedUsers: number;
  totalProducts: number;
  activeProducts: number;
  flaggedProducts: number;
  featuredProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  openDisputes: number;
  activeCategories: number;
  totalRevenue: number;
}

interface StatsResponse {
  success: boolean;
  data: { stats: AdminDashboardStats };
}

interface UsersResponse {
  success: boolean;
  data: { users: User[] };
  pagination: PaginationInfo;
}

interface UserResponse {
  success: boolean;
  message: string;
  data: { user: User };
}

interface ProductsResponse {
  success: boolean;
  data: { products: ProductPopulated[] };
  pagination: PaginationInfo;
}

interface ProductResponse {
  success: boolean;
  message: string;
  data: { product: ProductPopulated };
}

interface OrdersResponse {
  success: boolean;
  data: { orders: OrderPopulated[] };
  pagination: PaginationInfo;
}

interface ModerationQueueResponse {
  success: boolean;
  data: {
    products: ProductPopulated[];
    disputes: DisputePopulated[];
  };
}

export interface DisputePopulated {
  _id: string;
  order: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
  };
  raisedBy: { _id: string; name: string; email: string };
  against: { _id: string; name: string; email: string };
  reason: string;
  description: string;
  evidence?: string[];
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  adminNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

interface DisputesResponse {
  success: boolean;
  data: { disputes: DisputePopulated[] };
  pagination: PaginationInfo;
}

const adminService = {
  getDashboardStats: async (): Promise<StatsResponse> => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  getUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    isBanned?: boolean;
  }): Promise<UsersResponse> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  setUserBanStatus: async (userId: string, isBanned: boolean): Promise<UserResponse> => {
    const response = await api.patch(`/admin/users/${userId}/ban`, { isBanned });
    return response.data;
  },

  setSellerVerification: async (userId: string, isVerified: boolean): Promise<UserResponse> => {
    const response = await api.patch(`/admin/users/${userId}/verify`, { isVerified });
    return response.data;
  },

  getProducts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    flagged?: boolean;
    search?: string;
  }): Promise<ProductsResponse> => {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },

  updateProductModeration: async (
    productId: string,
    updates: { isFlagged?: boolean; flagReason?: string; status?: string; isFeatured?: boolean }
  ): Promise<ProductResponse> => {
    const response = await api.patch(`/admin/products/${productId}/moderate`, updates);
    return response.data;
  },

  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<OrdersResponse> => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  getModerationQueue: async (params?: { limit?: number }): Promise<ModerationQueueResponse> => {
    const response = await api.get('/admin/moderation-queue', { params });
    return response.data;
  },

  getDisputes: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<DisputesResponse> => {
    const response = await api.get('/disputes', { params });
    return response.data;
  },

  updateDisputeStatus: async (
    id: string,
    status: string,
    adminNote?: string
  ): Promise<{ success: boolean; data: { dispute: DisputePopulated } }> => {
    const response = await api.patch(`/disputes/${id}/status`, { status, adminNote });
    return response.data;
  },
};

export default adminService;
