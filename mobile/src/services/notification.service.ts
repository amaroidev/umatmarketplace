import api from './api';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

const notificationService = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: { notifications: Notification[] };
    unreadCount: number;
  }> => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ success: boolean; data: { unreadCount: number } }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  verifyPushDelivery: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/notifications/push/test');
    return response.data;
  },

  subscribeToPush: async (payload: {
    endpoint?: string;
    keys?: { p256dh: string; auth: string };
    expoPushToken?: string;
    platform?: string;
    deviceId?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/notifications/push/subscribe', payload);
    return response.data;
  },

  unsubscribeFromPush: async (payload: {
    endpoint?: string;
    expoPushToken?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/notifications/push/unsubscribe', payload);
    return response.data;
  },
};

export default notificationService;
