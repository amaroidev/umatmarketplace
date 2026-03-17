import { Server as SocketServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';
import chatService from '../services/chat.service';

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map<string, Set<string>>();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

export const setupSocketHandlers = (io: SocketServer): void => {
  // ========================
  // Authentication Middleware
  // ========================
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('name');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.userId;
      socket.userName = user.name;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // ========================
  // Connection Handler
  // ========================
  io.on('connection', (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const userId = socket.userId!;

    console.log(`Socket connected: ${socket.id} (user: ${userId})`);

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Notify others this user is online
    socket.broadcast.emit('user:online', { userId });

    // ========================
    // Join a conversation room
    // ========================
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} joined conversation:${conversationId}`);
    });

    // ========================
    // Leave a conversation room
    // ========================
    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation:${conversationId}`);
    });

    // ========================
    // Send a message
    // ========================
    socket.on('message:send', async (data: { conversationId: string; content: string; type?: 'text' | 'image' | 'system' }) => {
      try {
        const { conversationId, content, type } = data;

        if (!content || !content.trim()) return;

        // Save message via service
        const message = await chatService.sendMessage(
          conversationId,
          userId,
          content,
          type || 'text'
        );

        // Broadcast the new message to everyone in the conversation room
        io.to(`conversation:${conversationId}`).emit('message:new', message);

        // Also emit a conversation:updated event to all participants
        // (so conversation list updates with new lastMessage)
        const conversations = await chatService.getUserConversations(userId);
        const updatedConv = conversations.find(
          (c) => c._id.toString() === conversationId
        );

        if (updatedConv) {
          // Emit to the conversation room for participants currently viewing
          io.to(`conversation:${conversationId}`).emit('conversation:updated', updatedConv);
        }
      } catch (error) {
        console.error('Socket message:send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ========================
    // Mark messages as read
    // ========================
    socket.on('message:read', async (conversationId: string) => {
      try {
        await chatService.markAsRead(conversationId, userId);

        // Notify other participants that messages were read
        socket.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error('Socket message:read error:', error);
      }
    });

    // ========================
    // Typing indicators
    // ========================
    socket.on('typing:start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user:typing', {
        conversationId,
        userId,
        userName: socket.userName || 'Someone',
      });
    });

    socket.on('typing:stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user:stopTyping', {
        conversationId,
        userId,
      });
    });

    // ========================
    // Disconnect
    // ========================
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (user: ${userId})`);

      // Remove socket from online users tracking
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Only emit offline if user has no more active sockets
          socket.broadcast.emit('user:offline', { userId });
        }
      }
    });
  });
};

/**
 * Check if a user is currently online
 */
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
};

/**
 * Get all online user IDs
 */
export const getOnlineUserIds = (): string[] => {
  return Array.from(onlineUsers.keys());
};
