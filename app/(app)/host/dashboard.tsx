import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { listingsApi, bookingsApi, usersApi } from '@/services/api';
import { Card, CardSection } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import { Listing, Booking, BookingStatus } from '@/types';

export default function HostDashboardScreen() {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [listingsRes, bookingsRes, statsRes] = await Promise.all([
        listingsApi.getMyListings({ page: 1, limit: 10 }),
        bookingsApi.getAll({ page: 1, limit: 10, role: 'host' }),
        usersApi.getHostStats(),
      ]);

      if (listingsRes.data.success && listingsRes.data.data) {
        setListings(listingsRes.data.data);
      }
      if (bookingsRes.data.success && bookingsRes.data.data) {
        setBookings(bookingsRes.data.data);
      }
      if (statsRes.data.success && statsRes.data.data) {
        setStats(statsRes.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch host dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  const getListingStatusBadge = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <View style={styles.authRequired}>
          <Ionicons name="home-outline" size={64} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
          <Text style={[styles.authTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Sign in to access host dashboard</Text>
          <Text style={[styles.authSubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
            Manage your listings and bookings from here.
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
          <View style={styles.skeletonStats} />
          <View style={styles.skeletonSection} />
          <View style={styles.skeletonSection} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme === 'dark' ? '#34d399' : '#059669']} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Host Dashboard</Text>
          <TouchableOpacity onPress={() => router.push('/host/create-listing')} style={styles.addButton}>
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#064e3b' : '#ecfdf5' }]}>
            <Ionicons name="home-outline" size={24} color={theme === 'dark' ? '#34d399' : '#059669'} style={styles.statIcon} />
            <Text style={[styles.statValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{stats.totalListings}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Total Listings</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#065f46' : '#d1fae5' }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color={theme === 'dark' ? '#34d399' : '#059669'} style={styles.statIcon} />
            <Text style={[styles.statValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{stats.activeListings}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe' }]}>
            <Ionicons name="bag-handle-outline" size={24} color={theme === 'dark' ? '#60a5fa' : '#2563eb'} style={styles.statIcon} />
            <Text style={[styles.statValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{stats.totalBookings}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Total Bookings</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#7c2d12' : '#fffbeb' }]}>
            <Ionicons name="time-outline" size={24} color={theme === 'dark' ? '#fbbf24' : '#f59e0b'} style={styles.statIcon} />
            <Text style={[styles.statValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{stats.pendingBookings}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? '#4c1d95' : '#f3e8ff' }]}>
            <Ionicons name="cash-outline" size={24} color={theme === 'dark' ? '#a855f7' : '#7c3aed'} style={styles.statIcon} />
            <Text style={[styles.statValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }, { fontSize: 18 }]}>{formatPrice(stats.totalRevenue).replace('PKR', '')}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Revenue</Text>
          </View>
        </View>

        {/* Pending Bookings */}
        {bookings.filter(b => b.status === 'pending').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Pending Requests</Text>
              <TouchableOpacity onPress={() => router.push('/host/bookings')} style={styles.viewAll}>
                <Text style={[styles.viewAllText, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>View all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pendingScroll}>
              {bookings.filter(b => b.status === 'pending').slice(0, 5).map((booking) => (
                <TouchableOpacity key={booking.id} onPress={() => router.push(`/booking/${booking.id}`)} style={styles.pendingCard}>
                  <Image source={{ uri: booking.listing?.photos?.[0]?.cdnUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400' }} style={styles.pendingImage} resizeMode="cover" />
                  <View style={styles.pendingInfo}>
                    <Text style={[styles.pendingTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{booking.listing?.title}</Text>
                    <Text style={[styles.pendingGuest, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>{booking.guest?.fullName}</Text>
                    <Text style={[styles.pendingDates, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                      {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
                    </Text>
                    <Text style={[styles.pendingAmount, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>{formatPrice(booking.totalAmount)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Your Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Your Listings</Text>
            <TouchableOpacity onPress={() => router.push('/host/listings')} style={styles.viewAll}>
              <Text style={[styles.viewAllText, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>Manage all</Text>
            </TouchableOpacity>
          </View>
          {listings.length === 0 ? (
            <View style={styles.emptyListings}>
              <Ionicons name="home-outline" size={48} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
              <Text style={[styles.emptyTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>No listings yet</Text>
              <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                Create your first listing to start hosting
              </Text>
              <Button title="Create Listing" variant="primary" onPress={() => router.push('/host/create-listing')} style={styles.emptyButton} />
            </View>
          ) : (
            <FlatList
              data={listings.slice(0, 4)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => router.push(`/host/listings/${item.id}`)} style={styles.listingCard}>
                  <Image source={{ uri: item.photos?.[0]?.cdnUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400' }} style={styles.listingCardImage} resizeMode="cover" />
                  <View style={styles.listingCardOverlay}>
                    <View style={styles.listingCardStatus}>
                      <Badge variant={getListingStatusBadge(item.isActive)} size="sm">
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </View>
                    <View style={styles.listingCardInfo}>
                      <Text style={styles.listingCardTitle}>{item.title}</Text>
                      <Text style={styles.listingCardLocation}>{item.city}, {item.area}</Text>
                      <Text style={styles.listingCardPrice}>{formatPrice(item.pricePerNight)}/night</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.cardGap} />}
            />
          )}
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/host/bookings')} style={styles.viewAll}>
              <Text style={[styles.viewAllText, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>View all</Text>
            </TouchableOpacity>
          </View>
          {bookings.length === 0 ? (
            <View style={styles.emptyBookings}>
              <Ionicons name="calendar-outline" size={48} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
              <Text style={[styles.emptyTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>No bookings yet</Text>
              <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                Bookings will appear here when guests book your listings
              </Text>
            </View>
          ) : (
            <FlatList
              data={bookings.slice(0, 5)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => router.push(`/booking/${item.id}`)} style={styles.bookingCard}>
                  <View style={styles.bookingRow}>
                    <Image source={{ uri: item.listing?.photos?.[0]?.cdnUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400' }} style={styles.bookingImage} resizeMode="cover" />
                    <View style={styles.bookingInfo}>
                      <Text style={[styles.bookingTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{item.listing?.title}</Text>
                      <Text style={[styles.bookingGuest, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Guest: {item.guest?.fullName}</Text>
                      <Text style={[styles.bookingDates, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                        {formatDate(item.checkIn)} – {formatDate(item.checkOut)} · {item.guestsCount} guest{item.guestsCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.bookingFooter}>
                    <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                    <Text style={[styles.bookingAmount, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{formatPrice(item.totalAmount)}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.cardGap} />}
            />
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  authRequired: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  authTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
  authSubtext: { fontSize: 15, fontFamily: 'System', textAlign: 'center', lineHeight: 22 },
  authButton: { marginTop: 8, width: '80%' },
  loadingContent: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  skeletonStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  skeletonSection: { paddingHorizontal: 16, height: 200, backgroundColor: '#e5e7eb', borderRadius: 16, marginTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'System' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, marginBottom: 8 },
  statCard: { flex: 1, minWidth: '30%', maxWidth: '32%', borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 },
  statIcon: { marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '700', fontFamily: 'System' },
  statLabel: { fontSize: 12, fontFamily: 'System', textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'System' },
  viewAll: { padding: 4 },
  viewAllText: { fontSize: 13, fontWeight: '600', fontFamily: 'System' },
  pendingScroll: { paddingHorizontal: 16, gap: 12 },
  pendingCard: { width: 200, backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  pendingImage: { width: '100%', height: 100 },
  pendingInfo: { padding: 12, gap: 4 },
  pendingTitle: { fontSize: 13, fontWeight: '600', fontFamily: 'System' },
  pendingGuest: { fontSize: 12, fontFamily: 'System' },
  pendingDates: { fontSize: 11, fontFamily: 'System' },
  pendingAmount: { fontSize: 14, fontWeight: '700', fontFamily: 'System', marginTop: 4 },
  emptyListings: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 12 },
  emptyBookings: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
  emptySubtext: { fontSize: 13, fontFamily: 'System', textAlign: 'center', lineHeight: 18 },
  emptyButton: { marginTop: 8, width: '80%' },
  listingCard: { position: 'relative', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  listingCardImage: { width: '100%', height: 160 },
  listingCardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  listingCardStatus: { marginBottom: 8 },
  listingCardInfo: { flex: 1 },
  listingCardTitle: { color: '#ffffff', fontSize: 14, fontWeight: '600', fontFamily: 'System' },
  listingCardLocation: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'System', marginTop: 2 },
  listingCardPrice: { color: '#34d399', fontSize: 13, fontWeight: '600', fontFamily: 'System', marginTop: 2 },
  cardGap: { height: 12 },
  bookingCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  bookingRow: { flexDirection: 'row', gap: 12 },
  bookingImage: { width: 70, height: 70, borderRadius: 12 },
  bookingInfo: { flex: 1, justifyContent: 'center', minWidth: 0 },
  bookingTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'System' },
  bookingGuest: { fontSize: 12, fontFamily: 'System', marginTop: 2 },
  bookingDates: { fontSize: 11, fontFamily: 'System', marginTop: 2 },
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  bookingAmount: { fontSize: 15, fontWeight: '700', fontFamily: 'System' },
  bottomSpacer: { height: 20 },
});