import api from './api';
import { NotificationItem, PaginationInfo } from '../types';

interface NotificationListResponse {
  success: boolean;
  data: { notifications: NotificationItem[] };
  pagination: PaginationInfo;
  unreadCount: number;
}

interface UnreadCountResponse {
  success: boolean;
  data: { unreadCount: number };
}

interface NotificationResponse {
  success: boolean;
  message: string;
  data: { notification: NotificationItem };
}

interface MarkAllReadResponse {
  success: boolean;
  message: string;
  data: { count: number };
}

interface DeleteNotificationResponse {
  success: boolean;
  message: string;
}

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const notificationService = {
  getNotifications: async (
    page: number = 1,
    limit: number = 30
  ): Promise<NotificationListResponse> => {
    const response = await api.get('/notifications', { params: { page, limit } });
    return response.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<NotificationResponse> => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<MarkAllReadResponse> => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId: string): Promise<DeleteNotificationResponse> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  subscribeToPush: async (): Promise<{ success: boolean; message: string }> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported by the browser.');
    }

    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    
    if (existingSubscription) {
      // Already subscribed, maybe update backend
      const response = await api.post('/notifications/push/subscribe', existingSubscription);
      return response.data;
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not found in environment.');
    }

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    const response = await api.post('/notifications/push/subscribe', subscription);
    return response.data;
  },

  unsubscribeFromPush: async (): Promise<{ success: boolean; message: string }> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported by the browser.');
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      const response = await api.post('/notifications/push/unsubscribe', { endpoint: subscription.endpoint });
      return response.data;
    }

    return { success: true, message: 'Not subscribed.' };
  },

  sendTestPush: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/notifications/push/test');
    return response.data;
  },
};

export default notificationService;
