import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';
import User from '../models/User';

/**
 * @route   POST /api/notifications/push/subscribe
 * @desc    Subscribe to push notifications
 * @access  Private
 */
export const subscribeToPush = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscription = req.body?.subscription || req.body;
    
    if (!subscription || !subscription.endpoint) {
      res.status(400).json({ success: false, message: 'Invalid subscription object' });
      return;
    }

    // Add subscription to user
    await User.findByIdAndUpdate(req.user!._id, {
      $addToSet: { pushSubscriptions: subscription }
    });

    res.status(200).json({ success: true, message: 'Subscribed to push notifications' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/notifications/push/unsubscribe
 * @desc    Unsubscribe from push notifications
 * @access  Private
 */
export const unsubscribeFromPush = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      res.status(400).json({ success: false, message: 'Endpoint is required' });
      return;
    }

    await User.findByIdAndUpdate(req.user!._id, {
      $pull: { pushSubscriptions: { endpoint } }
    });

    res.status(200).json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/notifications/push/test
 * @desc    Send a test push notification
 * @access  Private
 */
export const sendTestPush = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await notificationService.sendTestPushNotification(req.user!._id.toString());
    res.status(200).json({ success: true, message: 'Test push notification sent' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications (paginated)
 * @access  Private
 */
export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = req.query;
    const result = await notificationService.getUserNotifications(
      req.user!._id.toString(),
      parseInt(page as string) || 1,
      parseInt(limit as string) || 30
    );

    res.status(200).json({
      success: true,
      data: { notifications: result.notifications },
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const unreadCount = await notificationService.getUnreadCount(req.user!._id.toString());

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user!._id.toString()
    );

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const count = await notificationService.markAllAsRead(req.user!._id.toString());

    res.status(200).json({
      success: true,
      message: `${count} notifications marked as read`,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await notificationService.deleteNotification(
      req.params.id,
      req.user!._id.toString()
    );

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};
