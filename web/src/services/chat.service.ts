import api from './api';
import { Conversation, MessagePopulated, PaginationInfo } from '../types';

interface ConversationResponse {
  success: boolean;
  data: { conversation: Conversation };
}

interface ConversationsResponse {
  success: boolean;
  data: { conversations: Conversation[] };
}

interface MessagesResponse {
  success: boolean;
  data: {
    messages: MessagePopulated[];
    pagination: PaginationInfo;
  };
}

interface MessageResponse {
  success: boolean;
  data: { message: MessagePopulated };
}

interface MarkReadResponse {
  success: boolean;
  data: { markedRead: number };
}

interface UnreadCountResponse {
  success: boolean;
  data: { unreadCount: number };
}

const chatService = {
  /**
   * Get or create a conversation with another user
   */
  getOrCreateConversation: async (
    otherUserId: string,
    productId?: string
  ): Promise<ConversationResponse> => {
    const response = await api.post('/conversations', { otherUserId, productId });
    return response.data;
  },

  /**
   * Get all conversations for the current user
   */
  getConversations: async (): Promise<ConversationsResponse> => {
    const response = await api.get('/conversations');
    return response.data;
  },

  /**
   * Get messages for a conversation (paginated)
   */
  getMessages: async (
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<MessagesResponse> => {
    const response = await api.get(
      `/conversations/${conversationId}/messages`,
      { params: { page, limit } }
    );
    return response.data;
  },

  /**
   * Send a message in a conversation (REST fallback; prefer socket for real-time)
   */
  sendMessage: async (
    conversationId: string,
    content: string,
    type: 'text' | 'image' = 'text',
    extra?: {
      offer?: { amount: number; status: 'pending' | 'accepted' | 'rejected' | 'countered' };
      quickReplyLabel?: string;
      attachments?: { url: string; mimeType?: string; name?: string }[];
    }
  ): Promise<MessageResponse> => {
    const response = await api.post(
      `/conversations/${conversationId}/messages`,
      { content, type, ...extra }
    );
    return response.data;
  },

  /**
   * Mark all messages in a conversation as read
   */
  markAsRead: async (conversationId: string): Promise<MarkReadResponse> => {
    const response = await api.put(`/conversations/${conversationId}/read`);
    return response.data;
  },

  /**
   * Get total unread message count
   */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get('/conversations/unread-count');
    return response.data;
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (conversationId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/conversations/${conversationId}`);
    return response.data;
  },
};

export default chatService;
