import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Circle,
  Package,
  MoreVertical,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import chatService from '../services/chat.service';
import { MessagePopulated, Conversation } from '../types';
import { LoadingSpinner } from '../components/ui';
import toast from 'react-hot-toast';

const ChatRoom: React.FC = () => {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendMessage: socketSendMessage,
    markAsRead: socketMarkAsRead,
    startTyping,
    stopTyping,
    onNewMessage,
    onMessageRead,
    onTypingStart,
    onTypingStop,
  } = useSocket();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessagePopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const fetchData = async () => {
      try {
        const convsRes = await chatService.getConversations();
        const conv = convsRes.data.conversations.find((c) => c._id === conversationId);
        if (conv) setConversation(conv);
        const msgsRes = await chatService.getMessages(conversationId, 1, 50);
        setMessages(msgsRes.data.messages);
        setHasMore(msgsRes.data.pagination.page < msgsRes.data.pagination.pages);
        setPage(1);
      } catch (err) {
        toast.error('Failed to load conversation');
        navigate('/messages');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [conversationId, navigate]);

  useEffect(() => {
    if (!conversationId || loading) return;
    joinConversation(conversationId);
    socketMarkAsRead(conversationId);
    return () => leaveConversation(conversationId);
  }, [conversationId, loading, joinConversation, leaveConversation, socketMarkAsRead]);

  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom(false);
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsub = onNewMessage((message) => {
      if (message.conversation === conversationId) {
        setMessages((prev) => [...prev, message]);
        socketMarkAsRead(conversationId!);
        setTimeout(() => scrollToBottom(), 50);
      }
    });
    return unsub;
  }, [conversationId, onNewMessage, socketMarkAsRead, scrollToBottom]);

  useEffect(() => {
    const unsub = onMessageRead((data) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (!msg.readBy.includes(data.userId)) {
              return { ...msg, readBy: [...msg.readBy, data.userId] };
            }
            return msg;
          })
        );
      }
    });
    return unsub;
  }, [conversationId, onMessageRead]);

  useEffect(() => {
    let typingTimeout: ReturnType<typeof setTimeout>;
    const unsubStart = onTypingStart((data) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) {
        setTypingUser(data.userName);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => setTypingUser(null), 3000);
      }
    });
    const unsubStop = onTypingStop((data) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) setTypingUser(null);
    });
    return () => { unsubStart(); unsubStop(); clearTimeout(typingTimeout); };
  }, [conversationId, user?._id, onTypingStart, onTypingStop]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMore = async () => {
    if (!conversationId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await chatService.getMessages(conversationId, nextPage, 50);
      setMessages((prev) => [...res.data.messages, ...prev]);
      setPage(nextPage);
      setHasMore(res.data.pagination.page < res.data.pagination.pages);
    } catch {
      toast.error('Failed to load older messages');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !conversationId || sending) return;
    const content = inputValue.trim();
    setInputValue('');
    setSending(true);
    if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); stopTyping(conversationId); }
    try {
      socketSendMessage(conversationId, content);
    } catch {
      toast.error('Failed to send message');
      setInputValue(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const sendOffer = async () => {
    if (!conversationId) return;
    const amount = Number(offerAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid offer amount');
      return;
    }
    try {
      await chatService.sendMessage(conversationId, `Offer: GHS ${amount.toFixed(2)}`, 'text', {
        offer: { amount, status: 'pending' },
      });
      setOfferAmount('');
      toast.success('Offer sent');
    } catch {
      toast.error('Failed to send offer');
    }
  };

  const sendAttachment = async () => {
    if (!conversationId || !attachmentUrl.trim()) return;
    try {
      await chatService.sendMessage(conversationId, 'Attachment shared', 'image', {
        attachments: [{ url: attachmentUrl.trim(), mimeType: 'image/*', name: 'Shared attachment' }],
      });
      setAttachmentUrl('');
      toast.success('Attachment sent');
    } catch {
      toast.error('Failed to send attachment');
    }
  };

  const sendQuickReply = async (label: string) => {
    if (!conversationId) return;
    try {
      await chatService.sendMessage(conversationId, label, 'text', { quickReplyLabel: label });
    } catch {
      toast.error('Failed to send quick reply');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!conversationId) return;
    startTyping(conversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(conversationId), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDelete = async () => {
    if (!conversationId) return;
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      await chatService.deleteConversation(conversationId);
      toast.success('Conversation deleted');
      navigate('/messages');
    } catch {
      toast.error('Failed to delete conversation');
    }
  };

  const otherParticipant = conversation?.participants.find((p) => p._id !== user?._id);
  const isOtherOnline = otherParticipant ? onlineUsers.has(otherParticipant._id) : false;

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner text="Loading conversation..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] max-w-3xl mx-auto">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-earth-200 bg-white">
        <button
          onClick={() => navigate('/messages')}
          className="p-1.5 hover:bg-earth-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-earth-600" />
        </button>

        {otherParticipant && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {otherParticipant.avatar ? (
                <img src={otherParticipant.avatar} alt={otherParticipant.name} className="w-9 h-9 object-cover" />
              ) : (
                <div className="w-9 h-9 bg-earth-200 text-earth-700 flex items-center justify-center font-bold text-sm">
                  {otherParticipant.name.charAt(0).toUpperCase()}
                </div>
              )}
              {isOtherOnline && (
                <Circle className="absolute bottom-0 right-0 h-2.5 w-2.5 fill-green-500 text-white stroke-2" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-earth-900 text-sm truncate">
                {otherParticipant.name}
                {otherParticipant.isVerified && <span className="ml-1 text-xs text-moss-500">&#10003;</span>}
              </h3>
              <p className="text-xs text-earth-400">
                {typingUser ? (
                  <span className="text-earth-600">typing...</span>
                ) : isOtherOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        )}

        {/* Product reference */}
        {conversation?.product && (
          <Link
            to={`/products/${conversation.product._id}`}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-earth-50 border border-earth-200 hover:bg-earth-100 transition-colors text-xs"
          >
            {conversation.product.images?.[0] && (
              <img src={conversation.product.images[0].url} alt="" className="w-5 h-5 object-cover" />
            )}
            <span className="text-earth-600 truncate max-w-[120px]">{conversation.product.title}</span>
            <ExternalLink className="h-3 w-3 text-earth-400" />
          </Link>
        )}

        {/* More menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 hover:bg-earth-100 transition-colors">
            <MoreVertical className="h-5 w-5 text-earth-500" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-earth-200 shadow-lg py-1 z-50">
              {conversation?.product && (
                <Link
                  to={`/products/${conversation.product._id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-earth-700 hover:bg-earth-50 sm:hidden"
                  onClick={() => setShowMenu(false)}
                >
                  <Package className="h-4 w-4" /> View Product
                </Link>
              )}
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
              >
                <Trash2 className="h-4 w-4" /> Delete Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product banner (mobile) */}
      {conversation?.product && (
        <Link
          to={`/products/${conversation.product._id}`}
          className="flex sm:hidden items-center gap-3 px-4 py-2 bg-earth-50 border-b border-earth-100"
        >
          {conversation.product.images?.[0] && (
            <img src={conversation.product.images[0].url} alt="" className="w-9 h-9 object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-earth-800 truncate">{conversation.product.title}</p>
            <p className="text-xs text-earth-600 font-bold">
              GHS {conversation.product.price.toFixed(2)}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-earth-400 flex-shrink-0" />
        </Link>
      )}

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs text-earth-500 hover:text-earth-900 font-bold uppercase tracking-[0.12em] disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                </span>
              ) : 'Load older messages'}
            </button>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = typeof msg.sender === 'object' && msg.sender._id === user?._id;
          const isSystem = msg.type === 'system';
          const prevMsg = messages[idx - 1];
          const showDate =
            !prevMsg ||
            new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

          return (
            <React.Fragment key={msg._id}>
              {showDate && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-earth-200" />
                  <span className="text-[10px] text-earth-400 font-bold uppercase tracking-[0.12em]">
                    {getDateLabel(msg.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-earth-200" />
                </div>
              )}

              {isSystem ? (
                <div className="text-center py-2">
                  <span className="text-xs text-earth-400 bg-earth-50 px-3 py-1">
                    {msg.content}
                  </span>
                </div>
              ) : (
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`max-w-[75%]`}>
                    <div className={`px-4 py-2.5 ${
                      isMe
                        ? 'bg-earth-900 text-white'
                        : 'bg-earth-100 text-earth-800'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      {msg.offer && (
                        <p className={`mt-1 text-[10px] font-bold uppercase tracking-[0.12em] ${isMe ? 'text-white/70' : 'text-earth-500'}`}>
                          Offer GHS {msg.offer.amount.toFixed(2)} · {msg.offer.status}
                        </p>
                      )}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((a, i) => (
                            <a key={`${a.url}-${i}`} href={a.url} target="_blank" rel="noreferrer" className={`block text-[11px] underline ${isMe ? 'text-white/70' : 'text-earth-600'}`}>
                              {a.name || 'Attachment'}
                            </a>
                          ))}
                        </div>
                      )}
                      {msg.quickReplyLabel && (
                        <p className={`mt-1 text-[10px] uppercase tracking-[0.12em] ${isMe ? 'text-white/60' : 'text-earth-500'}`}>Quick reply</p>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-earth-400">
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric', minute: '2-digit',
                        })}
                      </span>
                      {isMe && msg.readBy.length > 1 && (
                        <span className="text-[10px] text-moss-500">&#10003;&#10003;</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {typingUser && (
          <div className="flex justify-start mb-1">
            <div className="bg-earth-100 px-4 py-2.5">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-earth-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-earth-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-earth-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-earth-200 bg-white">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {['Available now', 'Can negotiate', 'Meet at main gate'].map((q) => (
            <button key={q} onClick={() => sendQuickReply(q)} className="border border-earth-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-earth-500 hover:border-earth-400 hover:text-earth-700">
              {q}
            </button>
          ))}
        </div>

        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="number"
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
            placeholder="Offer amount (GHS)"
            className="border border-earth-200 px-3 py-2 text-xs"
          />
          <button onClick={sendOffer} className="border border-earth-200 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-earth-700 hover:bg-earth-50">Send offer</button>
          <input
            type="url"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            placeholder="Attachment URL"
            className="border border-earth-200 px-3 py-2 text-xs"
          />
        </div>

        <div className="mb-3 flex justify-end">
          <button onClick={sendAttachment} className="border border-earth-200 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-earth-700 hover:bg-earth-50">Share attachment</button>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1 border-b border-earth-300 bg-transparent py-2 text-sm focus:outline-none focus:border-earth-900 placeholder:text-earth-300"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="p-2.5 bg-earth-900 text-white hover:bg-earth-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
