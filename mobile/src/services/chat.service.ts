import api from './api';

export interface ConversationParticipant {
  _id: string;
  name: string;
  avatar?: string;
}

export interface ConversationProduct {
  _id: string;
  title: string;
  images?: { url: string }[];
}

export interface Conversation {
  _id: string;
  participants: ConversationParticipant[];
  product?: ConversationProduct;
  lastMessage?: {
    content: string;
    sender: string;
    createdAt: string;
  };
  unreadCount?: number;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: ConversationParticipant;
  content: string;
  type: 'text' | 'image' | 'system';
  isRead: boolean;
  createdAt: string;
}

const chatService = {
  getOrCreateConversation: async (
    otherUserId: string,
    productId?: string
  ): Promise<{ success: boolean; data: { conversation: Conversation } }> => {
    const response = await api.post('/conversations', { otherUserId, productId });
    return response.data;
  },

  getUserConversations: async (): Promise<{
    success: boolean;
    data: { conversations: Conversation[] };
  }> => {
    const response = await api.get('/conversations');
    return response.data;
  },

  getMessages: async (
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<{ success: boolean; data: { messages: Message[] } }> => {
    const response = await api.get(`/conversations/${conversationId}/messages`, {
      params: { page, limit },
    });
    return response.data;
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    type: 'text' | 'image' = 'text'
  ): Promise<{ success: boolean; data: { message: Message } }> => {
    const response = await api.post(`/conversations/${conversationId}/messages`, {
      content,
      type,
    });
    return response.data;
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await api.put(`/conversations/${conversationId}/read`);
  },

  getUnreadCount: async (): Promise<{ success: boolean; data: { unreadCount: number } }> => {
    const response = await api.get('/conversations/unread-count');
    return response.data;
  },
};

export default chatService;
