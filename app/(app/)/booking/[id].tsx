import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { bookingsApi } from '@/services/api';
import { Card, CardSection } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import { Booking, BookingStatus, PaymentGateway, PaymentStatus } from '@/types';

export default function BookingDetailScreen() {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { id: bookingId } = useLocalSearchParams();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('jazzcash');
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      const response = await bookingsApi.getById(bookingId as string);
      if (response.data.success && response.data.data) {
        setBooking(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load booking');
      }
    } catch (error: any) {
      console.error('Failed to fetch booking:', error);
      setError(error.response?.data?.message || 'Failed to load booking');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchBooking();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const handlePayment = async () => {
    if (!booking || isProcessing) return;
    setIsProcessing(true);
    try {
      const response = await bookingsApi.initiatePayment(bookingId as string, { gateway: selectedGateway });
      if (response.data.success && response.data.data?.paymentUrl) {
        await Linking.openURL(response.data.data.paymentUrl);
      } else {
        Alert.alert('Payment Error', 'Unable to initiate payment');
      }
    } catch (error: any) {
      console.error('Failed to initiate payment:', error);
      Alert.alert('Payment Error', error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await bookingsApi.cancel(bookingId as string);
              if (response.data.success) {
                setBooking(response.data.data);
                Alert.alert('Cancelled', 'Your booking has been cancelled');
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel');
            }
          },
        },
      ]
    );
  };

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

  const getPaymentStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const paymentGateways: { key: PaymentGateway; label: string; icon: string; color: string }[] = [
    { key: 'jazzcash', label: 'JazzCash', icon: 'phone-portrait-outline', color: '#e11d48' },
    { key: 'easypaisa', label: 'EasyPaisa', icon: 'phone-portrait-outline', color: '#059669' },
    { key: 'safepay', label: 'SafePay', icon: 'card-outline', color: '#7c3aed' },
  ];

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <View style={styles.authRequired}>
          <Ionicons name="lock-closed-outline" size={64} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
          <Text style={[styles.authTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Sign in to view booking</Text>
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
          <Text style={[styles.errorTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Unable to load booking</Text>
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
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
          <Text style={[styles.emptyTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isHost = booking.listing?.host?.id === user?.id;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back-outline" size={28} color={theme === 'dark' ? '#f1f5f9' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Booking details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme === 'dark' ? '#34d399' : '#059669']} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: booking.status === 'cancelled' ? '#fee2e2' : booking.status === 'completed' ? '#dbeafe' : '#ecfdf5' }]}>
          <View style={styles.statusRow}>
            <Badge variant={getStatusBadgeVariant(booking.status)} size="sm">
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
            <Badge variant={getPaymentStatusBadgeVariant(booking.paymentStatus)} size="sm">
              {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
            </Badge>
          </View>
          {booking.status === 'pending' && (
            <Text style={[styles.statusNote, { color: theme === 'dark' ? '#065f46' : '#065f46' }]}>
              {isHost ? 'Guest has requested to book. Review and respond.' : 'Your booking request is pending host approval.'}
            </Text>
          )}
        </View>

        {/* Listing Card */}
        <TouchableOpacity onPress={() => router.push(`/listing/${booking.listing?.id}`)} style={styles.listingCard}>
          <Image
            source={{ uri: booking.listing?.photos?.[0]?.cdnUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400' }}
            style={styles.listingImage}
            resizeMode="cover"
          />
          <View style={styles.listingInfo}>
            <Text style={[styles.listingTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]} numberOfLines={2}>
              {booking.listing?.title}
            </Text>
            <Text style={[styles.listingLocation, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              {booking.listing?.city}, {booking.listing?.area}
            </Text>
            <View style={styles.hostInfo}>
              <Avatar source={booking.listing?.host?.avatarUrl ? { uri: booking.listing.host.avatarUrl } : undefined} name={booking.listing?.host?.fullName || 'Host'} size="xs" />
              <Text style={[styles.hostName, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>
                Hosted by {booking.listing?.host?.fullName}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Booking Details */}
        <Card style={styles.detailsCard}>
          <CardSection title="Booking details" style={styles.sectionTitle}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={18} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <View style={styles.detailText}>
                  <Text style={[styles.detailLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Check-in</Text>
                  <Text style={[styles.detailValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{formatDate(booking.checkIn)}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={18} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <View style={styles.detailText}>
                  <Text style={[styles.detailLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Check-out</Text>
                  <Text style={[styles.detailValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{formatDate(booking.checkOut)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={18} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <View style={styles.detailText}>
                  <Text style={[styles.detailLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Guests</Text>
                  <Text style={[styles.detailValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>
                    {booking.guestsCount} guest{booking.guestsCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="bed-outline" size={18} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <View style={styles.detailText}>
                  <Text style={[styles.detailLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Nights</Text>
                  <Text style={[styles.detailValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>
                    {Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)} nights
                  </Text>
                </View>
              </View>
            </View>
            {booking.guestNote && (
              <>
                <View style={styles.divider} />
                <Text style={[styles.guestNote, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>"{booking.guestNote}"</Text>
              </>
            )}
          </CardSection>
        </Card>

        {/* Price Breakdown */}
        <Card style={styles.priceCard}>
          <CardSection title="Price breakdown" style={styles.sectionTitle}>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                {formatPrice(booking.basePrice)} × {Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000)} nights
              </Text>
              <Text style={[styles.priceValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{formatPrice(booking.subtotal)}</Text>
            </View>
            {booking.cleaningFee > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Cleaning fee</Text>
                <Text style={[styles.priceValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{formatPrice(booking.cleaningFee)}</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Service fee</Text>
              <Text style={[styles.priceValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{formatPrice(booking.serviceFee)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={[styles.priceTotalLabel, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Total</Text>
              <Text style={[styles.priceTotalValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{formatPrice(booking.totalAmount)}</Text>
            </View>
          </CardSection>
        </Card>

        {/* Payment Section (for guest, pending payment) */}
        {!isHost && booking.paymentStatus === 'pending' && (
          <Card style={styles.paymentCard}>
            <CardSection title="Payment" style={styles.sectionTitle}>
              <Text style={[styles.paymentNote, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                Choose your preferred payment method to complete this booking.
              </Text>
              {paymentGateways.map((gateway) => (
                <TouchableOpacity
                  key={gateway.key}
                  onPress={() => setSelectedGateway(gateway.key)}
                  style={[
                    styles.gatewayOption,
                    selectedGateway === gateway.key && styles.gatewaySelected,
                  ]}
                >
                  <View style={[styles.gatewayIcon, { backgroundColor: gateway.color }]}>
                    <Ionicons name={gateway.icon as any} size={20} color="#ffffff" />
                  </View>
                  <Text style={[styles.gatewayLabel, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{gateway.label}</Text>
                  <View style={[styles.radioButton, selectedGateway === gateway.key && styles.radioSelected]}>
                    {selectedGateway === gateway.key && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
              <Button
                title={isProcessing ? 'Processing...' : `Pay ${formatPrice(booking.totalAmount)}`}
                variant="primary"
                onPress={handlePayment}
                disabled={isProcessing}
                style={styles.payButton}
              />
            </CardSection>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          {!isHost && booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <Button title="Cancel booking" variant="danger" onPress={handleCancelBooking} style={styles.actionButton} />
          )}
          {isHost && booking.status === 'pending' && (
            <>
              <Button title="Accept booking" variant="primary" onPress={() => {}} style={styles.actionButton} />
              <Button title="Decline" variant="danger" onPress={() => {}} style={styles.actionButton} />
            </>
          )}
          <Button
            title="Message host"
            variant="outline"
            onPress={() => router.push(`/messages/${booking.id}`)}
            style={styles.actionButton}
          />
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
  authButton: { marginTop: 8, width: '80%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
  headerSpacer: { width: 44 },
  loadingContent: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  skeletonCard: { backgroundColor: '#ffffff', borderRadius: 16, height: 120, padding: 16 },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
  errorSubtext: { fontSize: 14, fontFamily: 'System', textAlign: 'center' },
  errorButton: { marginTop: 8, width: '60%' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
  statusBanner: { padding: 16, marginHorizontal: 16, marginTop: 16, borderRadius: 12 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusNote: { fontSize: 13, fontFamily: 'System', marginTop: 8 },
  listingCard: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: '#ffffff', borderRadius: 16, marginHorizontal: 16, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  listingImage: { width: 80, height: 80, borderRadius: 12 },
  listingInfo: { flex: 1, minWidth: 0, justifyContent: 'center' },
  listingTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'System' },
  listingLocation: { fontSize: 13, fontFamily: 'System', marginTop: 2 },
  hostInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  hostName: { fontSize: 12, fontFamily: 'System' },
  detailsCard: { marginHorizontal: 16, marginTop: 16, padding: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'System', paddingHorizontal: 16, paddingTop: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 12, fontFamily: 'System' },
  detailValue: { fontSize: 14, fontWeight: '500', fontFamily: 'System' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginHorizontal: 16 },
  guestNote: { fontSize: 14, fontFamily: 'System', fontStyle: 'italic', paddingHorizontal: 16, paddingBottom: 16 },
  priceCard: { marginHorizontal: 16, marginTop: 16, padding: 0 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  priceLabel: { fontSize: 14, fontFamily: 'System', flex: 1 },
  priceValue: { fontSize: 14, fontFamily: 'System' },
  priceTotalLabel: { fontSize: 18, fontWeight: '700', fontFamily: 'System' },
  priceTotalValue: { fontSize: 18, fontWeight: '700', fontFamily: 'System' },
  paymentCard: { marginHorizontal: 16, marginTop: 16, padding: 0 },
  paymentNote: { fontSize: 14, fontFamily: 'System', paddingHorizontal: 16, paddingTop: 8 },
  gatewayOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, marginTop: 12 },
  gatewaySelected: { borderColor: '#059669', backgroundColor: '#ecfdf5' },
  gatewayIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  gatewayLabel: { flex: 1, fontSize: 15, fontWeight: '500', fontFamily: 'System' },
  radioButton: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#059669' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#059669' },
  payButton: { marginTop: 16, width: '100%' },
  actionsSection: { paddingHorizontal: 16, marginTop: 16, gap: 12 },
  actionButton: { width: '100%' },
  bottomSpacer: { height: 20 },
});