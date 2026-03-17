// Message types for the real-time chat system

export type MessageType = 'text' | 'image' | 'system';

export interface IMessage {
  _id: string;
  conversation: string;
  sender: string;
  content: string;
  type: MessageType;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IMessagePopulated extends Omit<IMessage, 'sender'> {
  sender: {
    _id: string;
    name: string;
    avatar: string;
  };
}

export interface IConversation {
  _id: string;
  participants: string[];
  product?: string;
  lastMessage?: string;
  updatedAt: string;
  createdAt: string;
}

export interface IConversationPopulated extends Omit<IConversation, 'participants' | 'product' | 'lastMessage'> {
  participants: {
    _id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  }[];
  product?: {
    _id: string;
    title: string;
    price: number;
    images: { url: string; publicId: string }[];
    status: string;
  };
  lastMessage?: {
    _id: string;
    content: string;
    sender: string;
    type: MessageType;
    createdAt: string;
  };
  unreadCount?: number;
}

// Socket event types
export interface ServerToClientEvents {
  'message:new': (message: IMessagePopulated) => void;
  'message:read': (data: { conversationId: string; userId: string }) => void;
  'user:typing': (data: { conversationId: string; userId: string; userName: string }) => void;
  'user:stopTyping': (data: { conversationId: string; userId: string }) => void;
  'user:online': (data: { userId: string }) => void;
  'user:offline': (data: { userId: string }) => void;
  'conversation:updated': (conversation: IConversationPopulated) => void;
}

export interface ClientToServerEvents {
  'conversation:join': (conversationId: string) => void;
  'conversation:leave': (conversationId: string) => void;
  'message:send': (data: { conversationId: string; content: string; type?: MessageType }) => void;
  'message:read': (conversationId: string) => void;
  'typing:start': (conversationId: string) => void;
  'typing:stop': (conversationId: string) => void;
}
