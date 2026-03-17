import * as Notifications from 'expo-notifications';
import { navigationRef } from '../navigation/navigationRef';

const getIdFromUrl = (url: string | undefined, resource: string): string | null => {
  if (!url) return null;
  const match = url.match(new RegExp(`/${resource}/([a-f0-9]{24})`, 'i'));
  return match?.[1] || null;
};

const routeFromData = (data: any): { type: 'product' | 'order' | 'chat' | 'none'; id?: string } => {
  const url = typeof data?.url === 'string' ? data.url : undefined;

  const productId = data?.productId || getIdFromUrl(url, 'products');
  if (typeof productId === 'string') return { type: 'product', id: productId };

  const orderId = data?.orderId || getIdFromUrl(url, 'orders');
  if (typeof orderId === 'string') return { type: 'order', id: orderId };

  const conversationId = data?.conversationId || data?.chatId || getIdFromUrl(url, 'messages');
  if (typeof conversationId === 'string') return { type: 'chat', id: conversationId };

  return { type: 'none' };
};

export const openNotificationTarget = (response: Notifications.NotificationResponse) => {
  const data = response.notification.request.content.data || {};
  const target = routeFromData(data);

  if (!navigationRef.isReady()) return;

  if (target.type === 'product' && target.id) {
    navigationRef.navigate('ProductsTab', {
      screen: 'ProductDetail',
      params: { productId: target.id },
    });
    return;
  }

  if (target.type === 'order' && target.id) {
    navigationRef.navigate('OrdersTab', {
      screen: 'OrderDetail',
      params: { orderId: target.id },
    });
    return;
  }

  if (target.type === 'chat' && target.id) {
    navigationRef.navigate('MessagesTab', {
      screen: 'Chat',
      params: {
        conversationId: target.id,
        otherUser: data?.otherUser || null,
        productTitle: data?.productTitle,
      },
    });
    return;
  }

  navigationRef.navigate('Notifications');
};

export const handleInitialNotificationOpen = async () => {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return;

  let attempts = 0;
  const maxAttempts = 20;

  const tryNavigate = () => {
    if (navigationRef.isReady()) {
      openNotificationTarget(response);
      return;
    }

    attempts += 1;
    if (attempts < maxAttempts) {
      setTimeout(tryNavigate, 150);
    }
  };

  tryNavigate();
};
