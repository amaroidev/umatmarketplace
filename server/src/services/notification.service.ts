import Notification, { INotificationDocument, NotificationType } from '../models/Notification';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import webpush from 'web-push';
import dotenv from 'dotenv';
import { emailService } from './email.service';

dotenv.config();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@campusmarketplace.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

class NotificationService {
  /**
   * Create a notification and optionally send push
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    metadata?: Record<string, any>
  ): Promise<INotificationDocument> {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      metadata,
    });

    // Send push notification asynchronously
    this.sendPushNotification(userId, {
      title,
      body: message,
      url: link || '/',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: link || '/' },
    }).catch((err) => {
      console.error('Failed to send push notification:', err);
    });

    return notification;
  }

  /**
   * Send web push notification to user's subscriptions
   */
  async sendPushNotification(userId: string, payload: any) {
    if (!process.env.VAPID_PUBLIC_KEY) return;

    try {
      const user = await User.findById(userId).select('+pushSubscriptions');
      if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
        return;
      }

      // Check user preferences based on type mapping if we wanted to
      // For now, send to all their devices
      const notifications = user.pushSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            sub as any,
            JSON.stringify(payload)
          );
        } catch (error: any) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            // Subscription has expired or is no longer valid
            await User.findByIdAndUpdate(userId, {
              $pull: { pushSubscriptions: { endpoint: sub.endpoint } }
            });
          } else {
            console.error('Push notification error:', error);
          }
        }
      });

      await Promise.all(notifications);
    } catch (error) {
      console.error('Error fetching user for push:', error);
    }
  }

  async sendTestPushNotification(userId: string): Promise<void> {
    await this.sendPushNotification(userId, {
      title: 'Push Notifications Active',
      body: 'This is a test notification from CampusMarketplace.',
      url: '/notifications',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: '/notifications' },
    });
  }

  /**
   * Get user's notifications (paginated)
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 30
  ): Promise<{ notifications: INotificationDocument[]; pagination: any; unreadCount: number }> {
    const skip = (page - 1) * limit;
    const total = await Notification.countDocuments({ user: userId });
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      unreadCount,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ user: userId, isRead: false });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotificationDocument> {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) throw ApiError.notFound('Notification not found');
    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
    return result.modifiedCount;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });
    if (!result) throw ApiError.notFound('Notification not found');
  }

  // ============================
  // Convenience helper methods for creating specific notification types
  // ============================

  async notifyOrderPlaced(sellerId: string, orderNumber: string, buyerName: string, orderId: string) {
    return this.create(
      sellerId,
      'order_placed',
      'New Order Received',
      `${buyerName} placed order #${orderNumber}`,
      `/seller/orders`,
      { orderId }
    );
  }

  async notifyOrderPaid(sellerId: string, orderNumber: string, orderId: string) {
    return this.create(
      sellerId,
      'order_paid',
      'Payment Confirmed',
      `Payment received for order #${orderNumber}`,
      `/orders/${orderId}`,
      { orderId }
    );
  }

  async notifyOrderConfirmed(buyerId: string, orderNumber: string, orderId: string) {
    User.findById(buyerId).then(user => {
      if (user) emailService.sendOrderUpdateEmail(user.email, orderNumber, 'Confirmed').catch(console.error);
    });
    return this.create(
      buyerId,
      'order_confirmed',
      'Order Confirmed',
      `Your order #${orderNumber} has been confirmed by the seller`,
      `/orders/${orderId}`,
      { orderId }
    );
  }

  async notifyOrderReady(buyerId: string, orderNumber: string, orderId: string) {
    User.findById(buyerId).then(user => {
      if (user) emailService.sendOrderUpdateEmail(user.email, orderNumber, 'Ready for Pickup/Delivery').catch(console.error);
    });
    return this.create(
      buyerId,
      'order_ready',
      'Order Ready',
      `Your order #${orderNumber} is ready for pickup/delivery`,
      `/orders/${orderId}`,
      { orderId }
    );
  }

  async notifyOrderCompleted(userId: string, orderNumber: string, orderId: string) {
    User.findById(userId).then(user => {
      if (user) emailService.sendOrderUpdateEmail(user.email, orderNumber, 'Completed').catch(console.error);
    });
    return this.create(
      userId,
      'order_completed',
      'Order Completed',
      `Order #${orderNumber} has been completed`,
      `/orders/${orderId}`,
      { orderId }
    );
  }

  async notifyOrderCancelled(userId: string, orderNumber: string, orderId: string, reason?: string) {
    User.findById(userId).then(user => {
      if (user) emailService.sendOrderUpdateEmail(user.email, orderNumber, 'Cancelled').catch(console.error);
    });
    return this.create(
      userId,
      'order_cancelled',
      'Order Cancelled',
      `Order #${orderNumber} has been cancelled${reason ? `: ${reason}` : ''}`,
      `/orders/${orderId}`,
      { orderId }
    );
  }

  async notifyNewReview(sellerId: string, reviewerName: string, rating: number, productTitle: string) {
    return this.create(
      sellerId,
      'new_review',
      'New Review',
      `${reviewerName} gave you ${rating} stars for "${productTitle}"`,
      `/seller/orders`,
    );
  }

  async notifyReviewReply(reviewerId: string, sellerName: string, productTitle: string) {
    return this.create(
      reviewerId,
      'review_reply',
      'Review Reply',
      `${sellerName} replied to your review on "${productTitle}"`,
      `/orders`,
    );
  }
}

export default new NotificationService();
