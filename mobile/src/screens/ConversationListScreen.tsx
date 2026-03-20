import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import chatService, { Conversation } from '../services/chat.service';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const ConversationListScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async (withLoader = true) => {
    if (withLoader) setLoading(true);
    try {
      const res = await chatService.getUserConversations();
      if (res.success) setConversations(res.data.conversations);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find((p) => p._id !== user?._id) ?? conv.participants[0];
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const other = getOtherParticipant(item);
    const hasUnread = (item.unreadCount ?? 0) > 0;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item._id,
            otherUser: other,
            productTitle: item.product?.title,
          })
        }
      >
        <View style={styles.avatarWrap}>
          {other.avatar ? (
            <Image source={{ uri: other.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{other.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.name, hasUnread && styles.nameBold]} numberOfLines={1}>
              {other.name}
            </Text>
            <Text style={styles.time}>
              {item.lastMessage ? formatTime(item.lastMessage.createdAt) : ''}
            </Text>
          </View>
          {item.product && (
            <Text style={styles.productLabel} numberOfLines={1}>
              Product: {item.product.title}
            </Text>
          )}
          <View style={styles.rowBottom}>
            <Text
              style={[styles.lastMsg, hasUnread && styles.lastMsgBold]}
              numberOfLines={1}
            >
              {item.lastMessage?.content ?? 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader eyebrow="Inbox" title="Messages" subtitle="Offers, negotiations, and deal chats." />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchConversations(false);
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No conversations yet.</Text>
              <Text style={styles.emptySubtext}>
                Start a conversation from a product listing.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fffdf8',
  },
  avatarWrap: { marginRight: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ece3d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: '#5b5042' },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, color: '#3f372d', flex: 1, marginRight: 8, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  nameBold: { fontWeight: '700', color: '#111827' },
  time: { fontSize: 12, color: '#9ca3af' },
  productLabel: { fontSize: 10, color: '#7c6f60', marginTop: 1, textTransform: 'uppercase', letterSpacing: 1 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  lastMsg: { fontSize: 13, color: '#9ca3af', flex: 1 },
  lastMsgBold: { fontWeight: '600', color: '#374151' },
  badge: {
    backgroundColor: '#2f5d4f',
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#efe7d7', marginLeft: 76 },
  emptyWrap: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtext: { marginTop: 8, fontSize: 13, color: '#9ca3af', textAlign: 'center' },
});

export default ConversationListScreen;
