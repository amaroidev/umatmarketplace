import { Router } from 'express';
import {
  getOrCreateConversation,
  getUserConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  deleteConversation,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// GET /api/conversations — list user's conversations
router.get('/', getUserConversations);

// GET /api/conversations/unread-count — total unread count
router.get('/unread-count', getUnreadCount);

// POST /api/conversations — get or create a conversation
router.post('/', getOrCreateConversation);

// GET /api/conversations/:id/messages — get messages (paginated)
router.get('/:id/messages', getMessages);

// POST /api/conversations/:id/messages — send a message
router.post('/:id/messages', sendMessage);

// PUT /api/conversations/:id/read — mark messages as read
router.put('/:id/read', markAsRead);

// DELETE /api/conversations/:id — delete conversation
router.delete('/:id', deleteConversation);

export default router;
