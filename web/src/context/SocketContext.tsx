import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { MessagePopulated, Conversation } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string, type?: 'text' | 'image') => void;
  markAsRead: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  // Event subscription helpers
  onNewMessage: (handler: (message: MessagePopulated) => void) => () => void;
  onMessageRead: (handler: (data: { conversationId: string; userId: string }) => void) => () => void;
  onTypingStart: (handler: (data: { conversationId: string; userId: string; userName: string }) => void) => () => void;
  onTypingStop: (handler: (data: { conversationId: string; userId: string }) => void) => () => void;
  onConversationUpdated: (handler: (conversation: Conversation) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setIsConnected(false);
      });

      // Online presence
      newSocket.on('user:online', ({ userId }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
      });

      newSocket.on('user:offline', ({ userId }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        newSocket.removeAllListeners();
        newSocket.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Not authenticated, clean up any existing socket
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, token]);

  // Conversation room management
  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:join', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:leave', conversationId);
  }, []);

  // Send message via socket
  const sendMessage = useCallback((conversationId: string, content: string, type: 'text' | 'image' = 'text') => {
    socketRef.current?.emit('message:send', { conversationId, content, type });
  }, []);

  // Mark messages as read via socket
  const markAsRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('message:read', conversationId);
  }, []);

  // Typing indicators
  const startTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:start', conversationId);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:stop', conversationId);
  }, []);

  // Event subscription helpers (returns unsubscribe function)
  const onNewMessage = useCallback((handler: (message: MessagePopulated) => void) => {
    const s = socketRef.current;
    if (s) {
      s.on('message:new', handler);
      return () => { s.off('message:new', handler); };
    }
    return () => {};
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMessageRead = useCallback((handler: (data: { conversationId: string; userId: string }) => void) => {
    const s = socketRef.current;
    if (s) {
      s.on('message:read', handler);
      return () => { s.off('message:read', handler); };
    }
    return () => {};
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTypingStart = useCallback((handler: (data: { conversationId: string; userId: string; userName: string }) => void) => {
    const s = socketRef.current;
    if (s) {
      s.on('user:typing', handler);
      return () => { s.off('user:typing', handler); };
    }
    return () => {};
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTypingStop = useCallback((handler: (data: { conversationId: string; userId: string }) => void) => {
    const s = socketRef.current;
    if (s) {
      s.on('user:stopTyping', handler);
      return () => { s.off('user:stopTyping', handler); };
    }
    return () => {};
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  const onConversationUpdated = useCallback((handler: (conversation: Conversation) => void) => {
    const s = socketRef.current;
    if (s) {
      s.on('conversation:updated', handler);
      return () => { s.off('conversation:updated', handler); };
    }
    return () => {};
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        unreadCount,
        setUnreadCount,
        joinConversation,
        leaveConversation,
        sendMessage,
        markAsRead,
        startTyping,
        stopTyping,
        onNewMessage,
        onMessageRead,
        onTypingStart,
        onTypingStop,
        onConversationUpdated,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
