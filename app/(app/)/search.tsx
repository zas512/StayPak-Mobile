import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { listingsApi } from '@/services/api';
import { ListingCard } from '@/components/ListingCard';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Listing, PaginatedResponse, PropertyType, Amenity } from '@/types';

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: 'apartment', label: 'Apartment', icon: 'home-outline' },
  { value: 'house', label: 'House', icon: 'business-outline' },
  { value: 'villa', label: 'Villa', icon: 'castle-outline' },
  { value: 'cottage', label: 'Cottage', icon: 'home-outline' },
  { value: 'farmhouse', label: 'Farmhouse', icon: 'leaf-outline' },
  { value: 'guesthouse', label: 'Guesthouse', icon: 'bed-outline' },
  { value: 'hotel', label: 'Hotel', icon: 'bed-outline' },
  { value: 'resort', label: 'Resort', icon: 'water-outline' },
  { value: 'campsite', label: 'Campsite', icon: 'flame-outline' },
  { value: 'unique', label: 'Unique', icon: 'diamond-outline' },
];

const AMENITIES: { value: Amenity; label: string; icon: string }[] = [
  { value: 'wifi', label: 'WiFi', icon: 'wifi-outline' },
  { value: 'air_conditioning', label: 'AC', icon: 'snow-outline' },
  { value: 'kitchen', label: 'Kitchen', icon: 'restaurant-outline' },
  { value: 'parking', label: 'Parking', icon: 'car-outline' },
  { value: 'pool', label: 'Pool', icon: 'water-outline' },
  { value: 'tv', label: 'TV', icon: 'tv-outline' },
  { value: 'washer', label: 'Washer', icon: 'cd-outline' },
  { value: 'gym', label: 'Gym', icon: 'barbell-outline' },
  { value: 'balcony', label: 'Balcony', icon: 'expand-outline' },
  { value: 'garden', label: 'Garden', icon: 'leaf-outline' },
];

export default function SearchScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useLocalSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [query, setQuery] = useState(searchParams.query as string || '');
  const [city, setCity] = useState(searchParams.city as string || '');
  const [guests, setGuests] = useState(parseInt(searchParams.guests as string || '1'));
  const [checkIn, setCheckIn] = useState(searchParams.checkIn as string || '');
  const [checkOut, setCheckOut] = useState(searchParams.checkOut as string || '');
  const [minPrice, setMinPrice] = useState(searchParams.minPrice as string || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.maxPrice as string || '');
  const [selectedTypes, setSelectedTypes] = useState<PropertyType[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<Amenity[]>([]);
  const [instantBook, setInstantBook] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating' | 'newest'>('rating');

  const fetchListings = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (!append) setIsLoading(true);
      const params = {
        page: pageNum,
        limit: 20,
        query: query || undefined,
        city: city || undefined,
        guests: guests > 1 ? guests : undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        propertyTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        instantBook: instantBook || undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sortBy,
      };
      const response = await listingsApi.search(params);
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        if (append) {
          setListings((prev) => [...prev, ...data]);
        } else {
          setListings(data);
        }
        setPage(response.data.meta.page);
        setHasMore(response.data.meta.page < response.data.meta.totalPages);
        setTotalResults(response.data.meta.total);
      }
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [query, city, guests, checkIn, checkOut, minPrice, maxPrice, selectedTypes, selectedAmenities, instantBook, minRating, sortBy]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchListings(1, false);
  }, [fetchListings]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchListings(page + 1, true);
    }
  }, [fetchListings, page, hasMore, isLoading]);

  useEffect(() => {
    fetchListings(1, false);
  }, []);

  const toggleType = (type: PropertyType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity: Amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchListings(1, false);
  };

  const resetFilters = () => {
    setQuery('');
    setCity('');
    setGuests(1);
    setCheckIn('');
    setCheckOut('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setInstantBook(false);
    setMinRating(0);
    setSortBy('rating');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (query) count++;
    if (city) count++;
    if (guests > 1) count++;
    if (checkIn) count++;
    if (checkOut) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    count += selectedTypes.length;
    count += selectedAmenities.length;
    if (instantBook) count++;
    if (minRating > 0) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme === 'dark' ? '#064e3b' : '#ffffff' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color={theme === 'dark' ? '#ffffff' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#ffffff' : '#111827' }]}>Search</Text>
        <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color={theme === 'dark' ? '#ffffff' : '#111827'} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Input
          placeholder="Search by city, area, or listing name"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => fetchListings(1, false)}
          leftIcon={<Ionicons name="search-outline" size={20} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />}
        />
      </View>

      {/* Sort */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, { borderColor: theme === 'dark' ? '#334155' : '#d1d5db' }]}
          onPress={() => {
            const options: typeof sortBy[] = ['rating', 'price_asc', 'price_desc', 'newest'];
            const currentIndex = options.indexOf(sortBy);
            setSortBy(options[(currentIndex + 1) % options.length]);
            fetchListings(1, false);
          }}
        >
          <Ionicons name="swap-vertical-outline" size={16} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
          <Text style={[styles.sortText, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>
            {sortBy === 'rating' ? 'Top rated' : sortBy === 'price_asc' ? 'Price: Low to High' : sortBy === 'price_desc' ? 'Price: High to Low' : 'Newest'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <FlatList
        data={listings.length === 0 ? [] : listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() => router.push(`/listing/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          <>
            <Text style={[styles.resultsHeader, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              {totalResults} stays found
            </Text>
            {isLoading && listings.length === 0 && (
              <View style={styles.loadingContainer}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <View key={i} style={styles.skeletonCard}>
                    <View style={styles.skeletonImage} />
                    <View style={styles.skeletonContent}>
                      <View style={styles.skeletonLine} />
                      <View style={styles.skeletonLineShort} />
                    </View>
                  </View>
                ))}
              </View>
            )}
            {listings.length === 0 && !isLoading && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
                <Text style={[styles.emptyText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>No stays found</Text>
                <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#64748b' : '#9ca3af' }]}>
                  Try adjusting your search or filters
                </Text>
                <Button title="Clear filters" variant="outline" onPress={resetFilters} style={styles.clearButton} />
              </View>
            )}
          </>
        }
        ListFooterComponent={
          <>
            {hasMore && !isLoading && (
              <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton}>
                <Text style={[styles.loadMoreText, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>Load more</Text>
              </TouchableOpacity>
            )}
            <View style={styles.bottomSpacer} />
          </>
        }
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme === 'dark' ? '#34d399' : '#059669']} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme === 'dark' ? '#064e3b' : '#ffffff' }]}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close-outline" size={24} color={theme === 'dark' ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme === 'dark' ? '#ffffff' : '#111827' }]}>Filters</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={[styles.resetText, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Price range (PKR/night)</Text>
              <View style={styles.priceRow}>
                <Input
                  placeholder="Min"
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="numeric"
                  inputStyle={styles.priceInput}
                />
                <Text style={[styles.priceDash, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>-</Text>
                <Input
                  placeholder="Max"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="numeric"
                  inputStyle={styles.priceInput}
                />
              </View>
            </View>

            {/* Property Types */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Property type</Text>
              <View style={styles.chipGrid}>
                {PROPERTY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selectedTypes.includes(type.value) ? (theme === 'dark' ? '#059669' : '#059669') : (theme === 'dark' ? '#0f172a' : '#f3f4f6'),
                        borderColor: selectedTypes.includes(type.value) ? (theme === 'dark' ? '#059669' : '#059669') : (theme === 'dark' ? '#334155' : '#d1d5db'),
                      },
                    ]}
                    onPress={() => toggleType(type.value)}
                  >
                    <Ionicons name={type.icon} size={18} color={selectedTypes.includes(type.value) ? '#ffffff' : (theme === 'dark' ? '#9ca3af' : '#6b7280')} />
                    <Text style={[styles.chipText, { color: selectedTypes.includes(type.value) ? '#ffffff' : (theme === 'dark' ? '#e5e7eb' : '#374151') }]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amenities */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Amenities</Text>
              <View style={styles.chipGrid}>
                {AMENITIES.map((amenity) => (
                  <TouchableOpacity
                    key={amenity.value}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selectedAmenities.includes(amenity.value) ? (theme === 'dark' ? '#059669' : '#059669') : (theme === 'dark' ? '#0f172a' : '#f3f4f6'),
                        borderColor: selectedAmenities.includes(amenity.value) ? (theme === 'dark' ? '#059669' : '#059669') : (theme === 'dark' ? '#334155' : '#d1d5db'),
                      },
                    ]}
                    onPress={() => toggleAmenity(amenity.value)}
                  >
                    <Ionicons name={amenity.icon} size={18} color={selectedAmenities.includes(amenity.value) ? '#ffffff' : (theme === 'dark' ? '#9ca3af' : '#6b7280')} />
                    <Text style={[styles.chipText, { color: selectedAmenities.includes(amenity.value) ? '#ffffff' : (theme === 'dark' ? '#e5e7eb' : '#374151') }]}>{amenity.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Guests */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Guests</Text>
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
                  onPress={() => setGuests(guests + 1)}
                  style={[styles.stepperButton, { borderColor: theme === 'dark' ? '#334155' : '#d1d5db' }]}
                >
                  <Ionicons name="add-outline" size={20} color={theme === 'dark' ? '#e5e7eb' : '#374151'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Instant Book */}
            <View style={styles.filterSection}>
              <TouchableOpacity style={styles.toggleRow} onPress={() => setInstantBook(!instantBook)}>
                <View>
                  <Text style={[styles.toggleLabel, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Instant Book</Text>
                  <Text style={[styles.toggleSubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Book without waiting for approval</Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: instantBook ? '#059669' : '#d1d5db' }]}>
                  <View style={[styles.toggleKnob, { transform: [{ translateX: instantBook ? 20 : 0 }] }]} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Min Rating */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Minimum rating</Text>
              <View style={styles.ratingOptions}>
                {[0, 3, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingOption,
                      {
                        backgroundColor: minRating === rating ? '#059669' : (theme === 'dark' ? '#0f172a' : '#f3f4f6'),
                        borderColor: minRating === rating ? '#059669' : (theme === 'dark' ? '#334155' : '#d1d5db'),
                      },
                    ]}
                    onPress={() => setMinRating(rating)}
                  >
                    <Text style={[styles.ratingOptionText, { color: minRating === rating ? '#ffffff' : (theme === 'dark' ? '#e5e7eb' : '#374151') }]}>
                      {rating === 0 ? 'Any' : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={[styles.modalFooter, { backgroundColor: theme === 'dark' ? '#064e3b' : '#ffffff' }]}>
            <Button title={`Show ${totalResults} results`} variant="primary" onPress={applyFilters} fullWidth />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  filterButton: {
    padding: 4,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'System',
  },
  searchBarContainer: {
    padding: 16,
    paddingBottom: 12,
  },
  sortContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  sortText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'System',
  },
  results: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultsHeader: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 12,
  },
  loadingContainer: {
    gap: 16,
  },
  skeletonCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  skeletonImage: {
    height: 200,
    backgroundColor: '#e5e7eb',
  },
  skeletonContent: {
    padding: 16,
    gap: 8,
  },
  skeletonLine: {
    height: 20,
    width: '70%',
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  skeletonLineShort: {
    height: 14,
    width: '40%',
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: 'System',
  },
  clearButton: {
    marginTop: 8,
  },
  loadMoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'System',
  },
  bottomSpacer: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  filterContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
  },
  priceDash: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'System',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'System',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    minWidth: 30,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'System',
  },
  toggleSubtext: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  ratingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});