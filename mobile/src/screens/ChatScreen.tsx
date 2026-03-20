import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import chatService, { Message } from '../services/chat.service';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatScreen = ({ route, navigation }: any) => {
  const { conversationId, otherUser, productTitle } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [quickReplyMode, setQuickReplyMode] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await chatService.getMessages(conversationId);
      if (res.success) {
        // API returns newest first; reverse for display
        setMessages([...res.data.messages].reverse());
        chatService.markAsRead(conversationId).catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    navigation.setOptions({
      title: otherUser?.name ?? 'Chat',
      headerShown: true,
      headerBackTitle: 'Back',
    });
    fetchMessages();
  }, [fetchMessages, navigation, otherUser]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      const res = await chatService.sendMessage(conversationId, trimmed);
      if (res.success) {
        setMessages((prev) => [...prev, res.data.message]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } finally {
      setSending(false);
    }
  };

  const sendQuickReply = async (label: string) => {
    if (sending) return;
    setSending(true);
    try {
      const res = await chatService.sendMessage(conversationId, label, 'text', { quickReplyLabel: label });
      if (res.success) {
        setMessages((prev) => [...prev, res.data.message]);
      }
    } finally {
      setSending(false);
      setQuickReplyMode(false);
    }
  };

  const sendOffer = async () => {
    const amount = Number(offerAmount);
    if (!Number.isFinite(amount) || amount <= 0 || sending) return;
    setSending(true);
    try {
      const res = await chatService.sendMessage(conversationId, `Offer: GHS ${amount.toFixed(2)}`, 'text', {
        offer: { amount, status: 'pending' },
      });
      if (res.success) {
        setMessages((prev) => [...prev, res.data.message]);
      }
      setOfferAmount('');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender._id === user?._id;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
          {item.content}
        </Text>
        <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {productTitle && (
        <View style={styles.productBanner}>
          <Text style={styles.productBannerText} numberOfLines={1}>
            Re: {productTitle}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Send a message to start the conversation.
            </Text>
          }
        />
      )}

        <View style={styles.inputRow}>
          {quickReplyMode && (
            <View style={styles.quickReplyRow}>
              {['Is this still available?', 'Can we meet on campus?', 'What is your best price?'].map((q) => (
                <TouchableOpacity key={q} style={styles.quickChip} onPress={() => sendQuickReply(q)}>
                  <Text style={styles.quickChipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.offerRow}>
            <TextInput
              style={styles.offerInput}
              placeholder="Offer (GHS)"
              placeholderTextColor="#9a8e7f"
              value={offerAmount}
              onChangeText={setOfferAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.offerBtn} onPress={sendOffer}>
              <Text style={styles.offerBtnText}>Send Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickToggle} onPress={() => setQuickReplyMode((s) => !s)}>
              <Text style={styles.quickToggleText}>Quick</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  productBanner: {
    backgroundColor: '#f1ebdf',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productBannerText: { fontSize: 11, color: '#6e6253', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1 },
  messagesList: { paddingHorizontal: 12, paddingVertical: 16, gap: 8 },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
    marginBottom: 4,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#1f1a14',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: '#221d16' },
  bubbleTime: { fontSize: 10, marginTop: 4 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  bubbleTimeThem: { color: '#9ca3af', textAlign: 'left' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 24,
    backgroundColor: '#fffdf8',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  quickReplyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  quickChip: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#fff' },
  quickChipText: { fontSize: 10, fontWeight: '800', color: '#6f6559', textTransform: 'uppercase', letterSpacing: 1 },
  offerRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  offerInput: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 8, fontSize: 12 },
  offerBtn: { backgroundColor: '#1f1a14', justifyContent: 'center', paddingHorizontal: 10 },
  offerBtnText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  quickToggle: { borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 10, backgroundColor: '#fff' },
  quickToggleText: { color: '#5e5447', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#1f1a14',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#8f8478' },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
});

export default ChatScreen;
