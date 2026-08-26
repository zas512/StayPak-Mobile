import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { bookingsApi } from '@/services/api';
import { Card, CardSection } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import { Booking, BookingStatus, PaginatedResponse } from '@/types';

export default function TripsScreen() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  const fetchBookings = async (pageNum = 1, append = false) => {
    try {
      if (!append) setIsLoading(true);
      const response = await bookingsApi.getAll({ page: pageNum, limit: 20 });
      if (response.data.success && response.data.data) {
        if (append) {
          setBookings((prev) => [...prev, ...response.data.data!]);
        } else {
          setBookings(response.data.data);
        }
        setPage(response.data.meta.page);
        setHasMore(response.data.meta.page < response.data.meta.totalPages);
      }
    } catch (error: any) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchBookings(1, false);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchBookings(page + 1, true);
    }
  };

  useEffect(() => {
    fetchBookings(1, false);
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const now = new Date();
    const checkOut = new Date(booking.checkOut);
    switch (activeTab) {
      case 'upcoming':
        return booking.status !== 'cancelled' && checkOut >= now;
      case 'past':
        return booking.status === 'completed' || (booking.status !== 'cancelled' && checkOut < now);
      case 'cancelled':
        return booking.status === 'cancelled';
      default:
        return false;
    }
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadgeVariant = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <View style={styles.authRequired}>
          <Ionicons name="bag-handle-outline" size={64} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
          <Text style={[styles.authTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Sign in to view your trips</Text>
          <Text style={[styles.authSubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
            Your upcoming and past bookings will appear here once you sign in.
          </Text>
          <Button title="Sign in" variant="primary" onPress={() => router.push('/login')} style={styles.authButton} />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading && bookings.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonRow}>
                <View style={styles.skeletonImage} />
                <View style={styles.skeletonInfo}>
                  <View style={styles.skeletonLine} />
                  <View style={styles.skeletonLineShort} />
                  <View style={styles.skeletonLineShort} />
                  <View style={styles.skeletonLineShort} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Your trips</Text>
        <TouchableOpacity onPress={() => router.push('/search')} style={styles.bookButton}>
          <Ionicons name="add-outline" size={20} color="#ffffff" />
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: theme === 'dark' ? '#064e3b' : '#ffffff' }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as typeof activeTab)}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === tab.key
                    ? (theme === 'dark' ? '#34d399' : '#059669')
                    : (theme === 'dark' ? '#9ca3af' : '#6b7280'),
                  fontWeight: activeTab === tab.key ? '600' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme === 'dark' ? '#34d399' : '#059669']} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={activeTab === 'upcoming' ? 'calendar-clear-outline' : activeTab === 'past' ? 'time-outline' : 'close-circle-outline'}
              size={48}
              color={theme === 'dark' ? '#475569' : '#d1d5db'}
            />
            <Text style={[styles.emptyTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>
              {activeTab === 'upcoming' ? 'No upcoming trips' : activeTab === 'past' ? 'No past trips' : 'No cancelled trips'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              {activeTab === 'upcoming'
                ? 'When you book a stay, it will appear here.'
                : activeTab === 'past'
                ? 'Your completed trips will show up here.'
                : 'Cancelled bookings will appear here.'}
            </Text>
            {activeTab === 'upcoming' && (
              <Button title="Find a place to stay" variant="primary" onPress={() => router.push('/search')} style={styles.emptyButton} />
            )}
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/booking/${item.id}`)}
                style={styles.bookingCard}
                activeOpacity={0.95}
              >
                <View style={styles.bookingRow}>
                  <Image
                    source={{ uri: item.listing?.photos?.[0]?.cdnUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400' }}
                    style={styles.bookingImage}
                    resizeMode="cover"
                  />
                  <View style={styles.bookingInfo}>
                    <Text style={[styles.bookingTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{item.listing?.title}</Text>
                    <Text style={[styles.bookingLocation, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                      {item.listing?.city}{item.listing?.area ? `, ${item.listing?.area}` : ''}
                    </Text>
                    <Text style={[styles.bookingDates, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                      {formatDate(item.checkIn)} – {formatDate(item.checkOut)} · {item.guestsCount} guest{item.guestsCount !== 1 ? 's' : ''}
                    </Text>
                    {item.listing?.host && (
                      <Text style={[styles.bookingHost, { color: theme === 'dark' ? '#64748b' : '#9ca3af' }]}>
                        Hosted by {item.listing.host.fullName}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.bookingFooter}>
                  <View style={styles.bookingPrice}>
                    <Text style={[styles.bookingAmount, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{formatPrice(item.totalAmount)}</Text>
                    <Text style={[styles.bookingTotalLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Total</Text>
                  </View>
                  <View style={styles.bookingStatusContainer}>
                    <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                    <Ionicons name="chevron-forward-outline" size={20} color={theme === 'dark' ? '#64748b' : '#9ca3af'} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
        {hasMore && !isLoading && (
          <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton}>
            <Text style={[styles.loadMoreText, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>Load more</Text>
          </TouchableOpacity>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  authRequired: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  authTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
  authSubtext: { fontSize: 15, fontFamily: 'System', textAlign: 'center', lineHeight: 22 },
  authButton: { marginTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'System' },
  bookButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  bookButtonText: { color: '#ffffff', fontWeight: '600', fontFamily: 'System', fontSize: 14 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { paddingVertical: 12, paddingHorizontal: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#059669' },
  tabLabel: { fontSize: 14, fontFamily: 'System' },
  loadingContent: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  skeletonCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16 },
  skeletonRow: { flexDirection: 'row', gap: 12 },
  skeletonImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#e5e7eb' },
  skeletonInfo: { flex: 1, justifyContent: 'center', gap: 8 },
  skeletonLine: { height: 16, width: '70%', backgroundColor: '#e5e7eb', borderRadius: 4 },
  skeletonLineShort: { height: 12, width: '40%', backgroundColor: '#e5e7eb', borderRadius: 4 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  bookingCard: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  bookingRow: { flexDirection: 'row', padding: 12, gap: 12 },
  bookingImage: { width: 80, height: 80, borderRadius: 12 },
  bookingInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  bookingTitle: { fontSize: 15, fontWeight: '600', fontFamily: 'System' },
  bookingLocation: { fontSize: 12, fontFamily: 'System' },
  bookingDates: { fontSize: 12, fontFamily: 'System' },
  bookingHost: { fontSize: 11, fontFamily: 'System' },
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', marginHorizontal: 12 },
  bookingPrice: { alignItems: 'flex-end' },
  bookingAmount: { fontSize: 18, fontWeight: '700', fontFamily: 'System' },
  bookingTotalLabel: { fontSize: 11, fontFamily: 'System' },
  bookingStatusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'System' },
  emptySubtext: { fontSize: 14, fontFamily: 'System', textAlign: 'center', lineHeight: 20 },
  emptyButton: { marginTop: 8, width: '80%' },
  loadMoreButton: { paddingVertical: 16, alignItems: 'center' },
  loadMoreText: { fontSize: 15, fontWeight: '600', fontFamily: 'System' },
  bottomSpacer: { height: 20 },
});