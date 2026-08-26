import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { bookingsApi } from '@/services/api';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Conversation } from '@/types';

export default function MessagesScreen() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await bookingsApi.getConversations();
      if (response.data.success && response.data.data) {
        setConversations(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchConversations();
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <View style={styles.authRequired}>
          <Ionicons name="chatbubbles-outline" size={64} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
          <Text style={[styles.authTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Sign in to view messages</Text>
          <Text style={[styles.authSubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
            Chat with hosts and guests about your bookings.
          </Text>
          <Button title="Sign in" variant="primary" onPress={() => router.push('/login')} style={styles.authButton} />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.skeletonItem}>
              <View style={styles.skeletonAvatar} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonLine} />
                <View style={styles.skeletonLineShort} />
                <View style={styles.skeletonLineShort} />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme === 'dark' ? '#34d399' : '#059669']} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Messages</Text>
        </View>

        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={48} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
            <Text style={[styles.emptyTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>No conversations yet</Text>
            <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              Start a conversation by booking a stay or hosting guests.
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.bookingId}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/messages/${item.bookingId}`)}
                style={styles.conversationItem}
                activeOpacity={0.9}
              >
                <View style={styles.conversationRow}>
                  <View style={styles.conversationImageContainer}>
                    <Image
                      source={{ uri: item.listing.photos?.[0]?.cdnUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200' }}
                      style={styles.conversationImage}
                      resizeMode="cover"
                    />
                    {item.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {item.unreadCount > 9 ? '9+' : item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.conversationInfo}>
                    <View style={styles.conversationHeader}>
                      <Text style={[styles.conversationTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{item.listing.title}</Text>
                      {item.lastMessage?.sentAt && (
                        <Text style={[styles.conversationTime, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                          {formatRelativeTime(item.lastMessage.sentAt)}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.conversationLocation, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>{item.listing.city}</Text>
                    <View style={styles.conversationMeta}>
                      <Avatar source={item.otherUser.avatarUrl ? { uri: item.otherUser.avatarUrl } : undefined} name={item.otherUser.fullName} size="xs" />
                      <Text style={[styles.conversationOtherName, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>{item.otherUser.fullName}</Text>
                      <Badge variant="outline" size="xs">
                        {item.lastMessage?.senderId === item.otherUser.id ? 'Guest' : 'Host'}
                      </Badge>
                    </View>
                    {item.lastMessage && (
                      <Text style={[styles.lastMessage, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>{item.lastMessage.body}</Text>
                    )}
                  </View>
                </View>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadIndicator}>
                    <View style={styles.unreadDot} />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  authRequired: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  authTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
  authSubtext: { fontSize: 15, fontFamily: 'System', textAlign: 'center', lineHeight: 22 },
  authButton: { marginTop: 8 },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'System' },
  loadingContent: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  skeletonItem: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  skeletonAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e5e7eb' },
  skeletonContent: { flex: 1, justifyContent: 'center', gap: 6 },
  skeletonLine: { height: 16, width: '60%', backgroundColor: '#e5e7eb', borderRadius: 4 },
  skeletonLineShort: { height: 12, width: '40%', backgroundColor: '#e5e7eb', borderRadius: 4 },
  listContent: { paddingHorizontal: 16, gap: 8 },
  conversationItem: { backgroundColor: '#ffffff', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  conversationRow: { flexDirection: 'row', gap: 12 },
  conversationImageContainer: { position: 'relative', width: 60, height: 60, borderRadius: 12, overflow: 'hidden', flexShrink: 0 },
  conversationImage: { width: '100%', height: '100%' },
  unreadBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  unreadBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '600', fontFamily: 'System' },
  conversationInfo: { flex: 1, minWidth: 0, justifyContent: 'center' },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  conversationTitle: { fontSize: 15, fontWeight: '600', fontFamily: 'System' },
  conversationTime: { fontSize: 11, fontFamily: 'System', flexShrink: 0, marginLeft: 8 },
  conversationLocation: { fontSize: 12, fontFamily: 'System', marginBottom: 4 },
  conversationMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  conversationOtherName: { fontSize: 13, fontWeight: '500', fontFamily: 'System' },
  lastMessage: { fontSize: 13, fontFamily: 'System', marginTop: 2 },
  unreadIndicator: { position: 'absolute', right: 12, top: '50%', marginTop: -6 },
  unreadDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#059669' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'System' },
  emptySubtext: { fontSize: 14, fontFamily: 'System', textAlign: 'center', lineHeight: 20 },
  bottomSpacer: { height: 20 },
});