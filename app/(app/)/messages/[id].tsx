import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Image, FlatList, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { bookingsApi } from '@/services/api';
import { Card, CardSection } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Message, Conversation } from '@/types';

export default function MessageThreadScreen() {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { id: bookingId } = useLocalSearchParams();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList<Message>>(null);
  const endRef = useRef<View>(null);
  const isInitialLoad = useRef(true);

  const fetchConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await bookingsApi.getConversation(bookingId as string);
      if (response.data.success && response.data.data) {
        setConversation(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load conversation');
      }
    } catch (error: any) {
      console.error('Failed to fetch conversation:', error);
      setError(error.response?.data?.message || 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  const fetchMessages = useCallback(async (pageNum = 1, append = false) => {
    try {
      const response = await bookingsApi.getMessages(bookingId as string, { page: pageNum, limit: 50 });
      if (response.data.success && response.data.data) {
        if (append) {
          setMessages((prev) => [...response.data.data!, ...prev]);
        } else {
          setMessages(response.data.data);
        }
        setPage(response.data.meta.page);
        setHasMore(response.data.meta.page < response.data.meta.totalPages);
      }
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
    }
  }, [bookingId]);

  const loadMoreMessages = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchMessages(page + 1, true);
    }
  }, [fetchMessages, page, hasMore, isLoading]);

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const response = await bookingsApi.sendMessage(bookingId as string, { body: messageText });
      if (response.data.success && response.data.data) {
        setMessages((prev) => [...prev, response.data.data!]);
        scrollToBottom();
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToIndex({ index: 0, animated: true });
  };

  useEffect(() => {
    fetchConversation();
    fetchMessages(1, false);
  }, []);

  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      isInitialLoad.current = false;
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    messages.forEach((message) => {
      const date = formatDate(message.sentAt);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(message);
      } else {
        groups.push({ date, messages: [message] });
      }
    });
    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <View style={styles.authRequired}>
          <Ionicons name="chatbubble-outline" size={64} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
          <Text style={[styles.authTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Sign in to view messages</Text>
          <Button title="Sign in" variant="primary" onPress={() => router.push('/login')} style={styles.authButton} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={[styles.errorTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Unable to load conversation</Text>
          <Text style={[styles.errorSubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>{error}</Text>
          <Button title="Go back" variant="primary" onPress={() => router.back()} style={styles.errorButton} />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.skeletonMessage}>
              <View style={styles.skeletonBubble} />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={48} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
          <Text style={[styles.emptyTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Conversation not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnMessage = (message: Message) => message.senderId === user?.id;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'chevron-back-outline'} size={28} color={theme === 'dark' ? '#f1f5f9' : '#111827'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/listing/${conversation.listing.id}`)} style={styles.headerContent}>
          <Image
            source={{ uri: conversation.listing.photos?.[0]?.cdnUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200' }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{conversation.listing.title}</Text>
            <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>{conversation.listing.city}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        ref={flatListRef}
        data={groupedMessages}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <View style={styles.dateGroup}>
            <View style={styles.dateSeparator}>
              <Text style={[styles.dateSeparatorText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>{item.date}</Text>
            </View>
            {item.messages.map((message, index) => (
              <View key={message.id} style={styles.messageWrapper}>
                <View
                  style={[
                    styles.messageBubble,
                    isOwnMessage(message) ? styles.ownBubble : styles.otherBubble,
                    { backgroundColor: isOwnMessage(message) ? (theme === 'dark' ? '#064e3b' : '#ecfdf5') : (theme === 'dark' ? '#1e293b' : '#ffffff') },
                  ]}
                >
                  {!isOwnMessage(message) && index === 0 && (
                    <View style={styles.senderInfo}>
                      <Avatar source={message.sender?.avatarUrl ? { uri: message.sender.avatarUrl } : undefined} name={message.sender?.fullName || 'Unknown'} size="xs" />
                      <Text style={[styles.senderName, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>{message.sender?.fullName || 'Unknown'}</Text>
                    </View>
                  )}
                  <Text style={[styles.messageText, { color: isOwnMessage(message) ? (theme === 'dark' ? '#a7f3d0' : '#065f46') : (theme === 'dark' ? '#e5e7eb' : '#1f2937') }]}>{message.body}</Text>
                  <Text style={[styles.messageTime, { color: isOwnMessage(message) ? (theme === 'dark' ? '#6ee7b7' : '#059669') : (theme === 'dark' ? '#64748b' : '#9ca3af') }]}>{formatTime(message.sentAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.messagesContainer}>
            {hasMore && (
              <TouchableOpacity onPress={loadMoreMessages} style={styles.loadMoreTop}>
                <Ionicons name="chevron-up-outline" size={20} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <Text style={[styles.loadMoreTopText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Load earlier messages</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={<View ref={endRef} style={styles.endSpacer} />}
        inverted
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesList}
      />

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputContainer} keyboardVerticalOffset={0}>
        <View style={[styles.inputWrapper, { backgroundColor: theme === 'dark' ? '#064e3b' : '#ffffff', borderTopColor: theme === 'dark' ? '#065f46' : '#e5e7eb' }]}>
          <TextInput
            style={[styles.textInput, { color: theme === 'dark' ? '#f1f5f9' : '#111827', placeholderTextColor: theme === 'dark' ? '#64748b' : '#9ca3af' }]}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            onSubmitEditing={sendMessage}
            multiline
            maxLength={2000}
            autoFocus={false}
          />
          <TouchableOpacity onPress={sendMessage} disabled={!newMessage.trim() || isSending} style={styles.sendButton}>
            <Ionicons name={isSending ? 'hourglass-outline' : 'send-outline'} size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  authRequired: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  authTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
  authButton: { marginTop: 8, width: '80%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { padding: 8 },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 4 },
  headerImage: { width: 40, height: 40, borderRadius: 8 },
  headerInfo: { minWidth: 0 },
  headerTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'System' },
  headerSubtitle: { fontSize: 12, fontFamily: 'System' },
  headerSpacer: { width: 44 },
  loadingContent: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  skeletonMessage: { alignItems: 'flex-end' },
  skeletonBubble: { width: '70%', height: 40, borderRadius: 16, backgroundColor: '#e5e7eb' },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
  errorSubtext: { fontSize: 14, fontFamily: 'System', textAlign: 'center' },
  errorButton: { marginTop: 8, width: '60%' },
  messagesContainer: { paddingHorizontal: 16, paddingTop: 16 },
  loadMoreTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  loadMoreTopText: { fontSize: 13, fontFamily: 'System' },
  messagesList: { paddingHorizontal: 16, paddingBottom: 16 },
  dateGroup: { marginBottom: 16 },
  dateSeparator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  dateSeparatorText: { fontSize: 11, fontWeight: '500', fontFamily: 'System', backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  messageWrapper: { marginBottom: 8 },
  messageBubble: { maxWidth: '80%', borderRadius: 16, padding: 10, paddingHorizontal: 14 },
  ownBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  otherBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  senderInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  senderName: { fontSize: 11, fontWeight: '500', fontFamily: 'System' },
  messageText: { fontSize: 15, fontFamily: 'System', lineHeight: 22 },
  messageTime: { fontSize: 10, fontFamily: 'System', marginTop: 4, alignSelf: 'flex-end' },
  endSpacer: { height: 20 },
  inputContainer: { flex: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderTopWidth: 1 },
  textInput: { flex: 1, fontSize: 15, fontFamily: 'System', maxHeight: 120, paddingRight: 40 },
  sendButton: { padding: 10, backgroundColor: '#059669', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
});