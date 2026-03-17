import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Push subscription
router.post('/push/subscribe', subscribeToPush);
router.post('/push/unsubscribe', unsubscribeFromPush);
router.post('/push/test', sendTestPush);

// GET /api/notifications — get notifications
router.get('/', getNotifications);

// GET /api/notifications/unread-count — unread count
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', markAsRead);

// DELETE /api/notifications/:id — delete notification
router.delete('/:id', deleteNotification);

export default router;
