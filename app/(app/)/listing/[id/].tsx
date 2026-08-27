import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Image, TouchableOpacity, Modal, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { listingsApi, bookingsApi } from '@/services/api';
import { Button } from '@/components/Button';
import { Card, CardSection } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Input } from '@/components/Input';
import { Listing } from '@/types';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [priceBreakdown, setPriceBreakdown] = useState<{
    baseAmount: number;
    cleaningFee: number;
    serviceFee: number;
    taxes: number;
    totalAmount: number;
  } | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  const fetchListing = async () => {
    try {
      const response = await listingsApi.getById(id as string);
      if (response.data.success && response.data.data) {
        setListing(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrice = async () => {
    if (!checkIn || !checkOut || !listing) return;
    setIsCalculatingPrice(true);
    try {
      const response = await listingsApi.calculatePrice(id as string, checkIn, checkOut, guests);
      if (response.data.success && response.data.data) {
        setPriceBreakdown(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to calculate price:', error);
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!checkIn || !checkOut) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const response = await bookingsApi.create({
        listingId: id as string,
        checkIn,
        checkOut,
        guestsCount: guests,
      });
      if (response.data.success && response.data.data) {
        setShowBookingModal(false);
        router.push(`/booking/${response.data.data.id}`);
      }
    } catch (error: any) {
      console.error('Booking failed:', error);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  const primaryPhotos = listing?.photos?.filter((p) => p.isPrimary) || [];
  const otherPhotos = listing?.photos?.filter((p) => !p.isPrimary) || [];
  const allPhotos = [...primaryPhotos, ...otherPhotos];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLineShort} />
            <View style={styles.skeletonLineShort} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLineShort} />
            <View style={styles.skeletonLineShort} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLine} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color={theme === 'dark' ? '#64748b' : '#9ca3af'} />
          <Text style={[styles.errorText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Listing not found</Text>
          <Button title="Back to search" variant="primary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: 'Apartment', house: 'House', villa: 'Villa', cottage: 'Cottage',
      farmhouse: 'Farmhouse', guesthouse: 'Guesthouse', hotel: 'Hotel', resort: 'Resort',
      campsite: 'Campsite', unique: 'Unique',
    };
    return labels[type] || type;
  };

  const amenityIcons: Record<string, string> = {
    wifi: 'wifi-outline', air_conditioning: 'snow-outline', heating: 'thermometer-outline',
    kitchen: 'restaurant-outline', washer: 'cd-outline', dryer: 'cd-outline',
    tv: 'tv-outline', parking: 'car-outline', pool: 'water-outline', gym: 'barbell-outline',
    elevator: 'expand-outline', doorman: 'person-outline', security: 'shield-outline',
    balcony: 'expand-outline', garden: 'leaf-outline', bbq: 'flame-outline',
    fireplace: 'flame-outline', workspace: 'desktop-outline', crib: 'baby-outline',
    high_chair: 'restaurant-outline', pets_allowed: 'paw-outline',
    smoking_allowed: 'cloud-outline', events_allowed: 'people-outline',
  };

  const getAmenityItemStyle = () => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: theme === 'dark' ? '#0f172a' : '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <FlatList
            data={allPhotos.length > 0 ? allPhotos : [{ cdnUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800' }]}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.cdnUrl }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setSelectedImageIndex(index);
            }}
          />
          {/* Image Indicators */}
          {allPhotos.length > 1 && (
            <View style={styles.indicators}>
              {allPhotos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor: selectedImageIndex === index ? '#ffffff' : 'rgba(255,255,255,0.5)',
                    },
                  ]}
                />
              ))}
            </View>
          )}
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
          {/* Favorite Button */}
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Rating */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.badgesRow}>
                {listing.instantBook && <Badge variant="success" size="sm">Instant Book</Badge>}
                <Badge variant="outline" size="sm">{getPropertyTypeLabel(listing.propertyType)}</Badge>
              </View>
              <Text style={[styles.title, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{listing.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <Text style={[styles.location, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                  {listing.address}, {listing.city}{listing.area ? `, ${listing.area}` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {listing.averageRating && listing.averageRating > 0 && (
                <View style={styles.rating}>
                  <Ionicons name="star" size={18} color="#fbbf24" />
                  <Text style={[styles.ratingValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{listing.averageRating.toFixed(1)}</Text>
                  <Text style={[styles.ratingCount, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                    ({listing.reviewCount} reviews)
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Price & Booking */}
          <View style={styles.priceBookingRow}>
            <View style={styles.priceColumn}>
              <Text style={[styles.price, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>{formatPrice(listing.basePrice)}</Text>
              <Text style={[styles.priceNight, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                /night + fees
              </Text>
            </View>
            <Button
              title={listing.instantBook ? 'Reserve' : 'Request to book'}
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => setShowBookingModal(true)}
              loading={isCalculatingPrice}
            />
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#1e293b' : '#e5e7eb' }]} />

          {/* About this space */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>About this space</Text>
            <Text style={[styles.description, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>{listing.description}</Text>
          </View>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>What this place offers</Text>
              <View style={styles.amenitiesGrid}>
                {listing.amenities.map((amenity) => (
                  <TouchableOpacity key={amenity} style={getAmenityItemStyle()}>
                    <Ionicons name={amenityIcons[amenity] || 'checkmark-outline'} size={22} color={theme === 'dark' ? '#34d399' : '#059669'} />
                    <Text style={[styles.amenityLabel, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>{amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* House Rules */}
          {listing.houseRules && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>House rules</Text>
              <Text style={[styles.description, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>{listing.houseRules}</Text>
            </View>
          )}

          {/* Cancellation Policy */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Cancellation policy</Text>
            <Text style={[styles.description, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>
              {listing.cancellationPolicy === 'flexible' && 'Full refund if cancelled 24 hours before check-in.'}
              {listing.cancellationPolicy === 'moderate' && 'Full refund if cancelled 5 days before check-in.'}
              {listing.cancellationPolicy === 'strict' && '50% refund if cancelled 7 days before check-in.'}
              {listing.cancellationPolicy === 'super_strict' && 'No refunds. Contact host for extenuating circumstances.'}
            </Text>
          </View>

          {/* Host */}
          {listing.host && (
            <View style={styles.section}>
              <View style={styles.hostCard}>
                <Avatar source={listing.host.avatarUrl ? { uri: listing.host.avatarUrl } : undefined} name={listing.host.fullName} size="lg" />
                <View style={styles.hostInfo}>
                  <Text style={[styles.hostName, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Hosted by {listing.host.fullName}</Text>
                  <View style={styles.hostMeta}>
                    {listing.host.isCnicVerified && (
                      <Badge variant="success" size="sm" dot>Verified</Badge>
                    )}
                    <Text style={[styles.hostJoinDate, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                      Joined {new Date(listing.host.createdAt).getFullYear()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Reviews Preview */}
          {listing.reviewCount > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Reviews ({listing.reviewCount})</Text>
              </View>
              <Text style={[styles.reviewPreview, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>View all reviews on the web app</Text>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
          <View style={[styles.modalHandle, { backgroundColor: theme === 'dark' ? '#064e3b' : '#ffffff' }]} />
          <View style={[styles.modalHeader, { backgroundColor: theme === 'dark' ? '#064e3b' : '#ffffff' }]}>
            <TouchableOpacity onPress={() => setShowBookingModal(false)} style={styles.modalClose}>
              <Ionicons name="close-outline" size={24} color={theme === 'dark' ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme === 'dark' ? '#ffffff' : '#111827' }]}>Reserve</Text>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Date Pickers */}
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Check-in</Text>
              <Input
                placeholder="Select date"
                value={checkIn}
                onChangeText={setCheckIn}
                leftIcon={<Ionicons name="calendar-outline" size={20} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />}
              />
            </View>
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Check-out</Text>
              <Input
                placeholder="Select date"
                value={checkOut}
                onChangeText={setCheckOut}
                leftIcon={<Ionicons name="calendar-outline" size={20} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />}
              />
            </View>

            {/* Guests */}
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Guests</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  onPress={() => setGuests(Math.max(1, guests - 1))}
                  style={[styles.stepperButton, { borderColor: theme === 'dark' ? '#334155' : '#d1d5db' }]}
                  disabled={guests <= 1}
                >
                  <Ionicons name="remove-outline" size={20} color={theme === 'dark' ? '#e5e7eb' : '#374151'} />
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{guests}</Text>
                <TouchableOpacity
                  onPress={() => setGuests(Math.min(listing.maxGuests, guests + 1))}
                  style={[styles.stepperButton, { borderColor: theme === 'dark' ? '#334155' : '#d1d5db' }]}
                  disabled={guests >= listing.maxGuests}
                >
                  <Ionicons name="add-outline" size={20} color={theme === 'dark' ? '#e5e7eb' : '#374151'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Price Breakdown */}
            {priceBreakdown && (
              <View style={[styles.modalSection, { paddingTop: 16 }]}>
                <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#1e293b' : '#e5e7eb' }]} />
                <View style={styles.priceBreakdown}>
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>{formatPrice(priceBreakdown.baseAmount)} x {Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights</Text>
                    <Text style={[styles.priceValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{formatPrice(priceBreakdown.baseAmount)}</Text>
                  </View>
                  {priceBreakdown.cleaningFee > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>Cleaning fee</Text>
                      <Text style={[styles.priceValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{formatPrice(priceBreakdown.cleaningFee)}</Text>
                    </View>
                  )}
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>Service fee</Text>
                    <Text style={[styles.priceValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{formatPrice(priceBreakdown.serviceFee)}</Text>
                  </View>
                  {priceBreakdown.taxes > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>Taxes</Text>
                      <Text style={[styles.priceValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{formatPrice(priceBreakdown.taxes)}</Text>
                    </View>
                  )}
                  <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#1e293b' : '#e5e7eb' }]} />
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceTotalLabel, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Total</Text>
                    <Text style={[styles.priceTotalValue, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>{formatPrice(priceBreakdown.totalAmount)}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#1e293b' : '#e5e7eb' }]} />

            {/* Book Button */}
            <Button
              title={`${listing.instantBook ? 'Reserve' : 'Request to book'} for ${priceBreakdown ? formatPrice(priceBreakdown.totalAmount) : 'selected dates'}`}
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleBook}
              disabled={!checkIn || !checkOut || isCalculatingPrice}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  loadingContent: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  skeletonImage: { height: 300, backgroundColor: '#e5e7eb' },
  skeletonContent: { padding: 16, gap: 12 },
  skeletonLine: { height: 20, width: '70%', backgroundColor: '#e5e7eb', borderRadius: 4 },
  skeletonLineShort: { height: 14, width: '40%', backgroundColor: '#e5e7eb', borderRadius: 4 },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  errorText: { fontSize: 18, fontWeight: '600', fontFamily: 'System' },
  galleryContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: '#e5e7eb',
  },
  galleryImage: { width: SCREEN_WIDTH, height: 300 },
  indicators: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  indicator: { width: 8, height: 8, borderRadius: 4 },
  backButton: { position: 'absolute', top: 50, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  favoriteButton: { position: 'absolute', top: 50, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingTop: 8, gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  headerLeft: { flex: 1 },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', fontFamily: 'System', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 14, fontFamily: 'System' },
  headerRight: { alignItems: 'flex-end' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  ratingValue: { fontSize: 16, fontWeight: '700', fontFamily: 'System' },
  ratingCount: { fontSize: 13, fontFamily: 'System' },
  priceBookingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  priceColumn: {},
  price: { fontSize: 24, fontWeight: '800', fontFamily: 'System' },
  priceNight: { fontSize: 13, fontFamily: 'System' },
  divider: { height: 1, marginHorizontal: -16, marginVertical: 8 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'System' },
  description: { fontSize: 15, lineHeight: 24, fontFamily: 'System' },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  amenityLabel: { fontSize: 13, fontWeight: '500', fontFamily: 'System' },
  hostCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hostInfo: { flex: 1 },
  hostName: { fontSize: 16, fontWeight: '600', fontFamily: 'System' },
  hostMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  hostJoinDate: { fontSize: 13, fontFamily: 'System' },
  reviewPreview: { fontSize: 14, fontFamily: 'System', textAlign: 'center', paddingVertical: 8 },
  bottomSpacer: { height: 20 },
  modalContainer: { flex: 1 },
  modalHandle: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: '#9ca3af', alignSelf: 'center', marginTop: 8, marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalClose: { padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'System' },
  modalContent: { padding: 16, gap: 16 },
  modalSection: { gap: 8 },
  modalSectionTitle: { fontSize: 14, fontWeight: '500', fontFamily: 'System' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  stepperButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  stepperValue: { fontSize: 20, fontWeight: '600', fontFamily: 'System', minWidth: 30, textAlign: 'center' },
  priceBreakdown: { gap: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, fontFamily: 'System' },
  priceValue: { fontSize: 14, fontWeight: '600', fontFamily: 'System' },
  priceTotalLabel: { fontSize: 16, fontWeight: '600', fontFamily: 'System' },
  priceTotalValue: { fontSize: 18, fontWeight: '700', fontFamily: 'System' },
});