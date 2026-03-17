import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Trash2,
  Circle,
  Package,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import chatService from '../services/chat.service';
import { Conversation } from '../types';
import { LoadingSpinner } from '../components/ui';
import toast from 'react-hot-toast';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onlineUsers, onConversationUpdated } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatService.getConversations();
      if (res.success) setConversations(res.data.conversations);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const unsub = onConversationUpdated((updatedConv) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === updatedConv._id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedConv;
          next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          return next;
        }
        return [updatedConv, ...prev];
      });
    });
    return unsub;
  }, [onConversationUpdated]);

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    setDeletingId(conversationId);
    try {
      await chatService.deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      toast.success('Conversation deleted');
    } catch {
      toast.error('Failed to delete conversation');
    } finally {
      setDeletingId(null);
    }
  };

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find((p) => p._id !== user?._id) || conv.participants[0];

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const other = getOtherParticipant(conv);
    const query = searchQuery.toLowerCase();
    return (
      other.name.toLowerCase().includes(query) ||
      conv.product?.title?.toLowerCase().includes(query) ||
      conv.lastMessage?.content?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner text="Loading messages..." />
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 pt-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-2">Inbox</p>
        <div className="flex items-end justify-between">
          <h1 className="text-3xl font-black text-earth-900 uppercase tracking-tight">Messages</h1>
          <p className="text-xs text-earth-500 pb-1">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="h-px bg-earth-200 mt-4" />
      </div>

      {/* Search */}
      {conversations.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 pr-4 py-2.5 border-b border-earth-200 bg-transparent text-sm focus:outline-none focus:border-earth-900 placeholder:text-earth-300"
          />
        </div>
      )}

      {/* Conversation List */}
      {filteredConversations.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="h-14 w-14 text-earth-200 mx-auto mb-5" />
          <h3 className="text-lg font-black text-earth-700 uppercase tracking-wide mb-2">
            {searchQuery ? 'No results' : 'No messages yet'}
          </h3>
          <p className="text-earth-500 text-sm mb-6">
            {searchQuery
              ? 'Try a different search term'
              : 'Contact a seller on a product listing to start a conversation'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/products')}
              className="inline-block px-6 py-3 bg-earth-900 text-white text-xs font-bold uppercase tracking-[0.15em]"
            >
              Browse Products
            </button>
          )}
        </div>
      ) : (
        <div className="border border-earth-200 divide-y divide-earth-100">
          {filteredConversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const isOnline = onlineUsers.has(other._id);
            const hasUnread = (conv.unreadCount || 0) > 0;

            return (
              <Link
                key={conv._id}
                to={`/messages/${conv._id}`}
                className={`flex items-center gap-3 p-4 transition-colors group ${
                  hasUnread ? 'bg-earth-50' : 'bg-white hover:bg-earth-50'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {other.avatar ? (
                    <img src={other.avatar} alt={other.name} className="w-10 h-10 object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-earth-200 text-earth-700 flex items-center justify-center font-bold text-sm">
                      {other.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isOnline && (
                    <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-white stroke-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3 className={`text-sm truncate ${hasUnread ? 'font-bold text-earth-900' : 'font-medium text-earth-800'}`}>
                      {other.name}
                      {other.isVerified && <span className="ml-1 text-xs text-moss-500">&#10003;</span>}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-xs text-earth-400 flex-shrink-0">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {conv.product && (
                    <div className="flex items-center gap-1 text-xs text-earth-400 mb-0.5">
                      <Package className="h-3 w-3" />
                      <span className="truncate">{conv.product.title}</span>
                    </div>
                  )}
                  {conv.lastMessage ? (
                    <p className={`text-xs truncate ${hasUnread ? 'text-earth-700 font-medium' : 'text-earth-500'}`}>
                      {conv.lastMessage.type === 'system'
                        ? conv.lastMessage.content
                        : conv.lastMessage.sender === user?._id
                        ? `You: ${conv.lastMessage.content}`
                        : conv.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-xs text-earth-400 italic">No messages yet</p>
                  )}
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasUnread && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-4.5 px-1.5 bg-earth-900 text-white text-[10px] font-bold">
                      {conv.unreadCount! > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, conv._id)}
                    disabled={deletingId === conv._id}
                    className="p-1 text-earth-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-earth-300 group-hover:text-earth-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Messages;
