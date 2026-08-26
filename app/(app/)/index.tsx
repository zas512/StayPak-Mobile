import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { listingsApi } from '@/services/api';
import { ListingCard } from '@/components/ListingCard';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Avatar } from '@/components/Avatar';
import { Card, CardSection } from '@/components/Card';
import { Listing, PaginatedResponse } from '@/types';

export default function ExploreScreen() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  // Search filters
  const [filters, setFilters] = useState({
    query: searchParams.get('query') || '',
    city: searchParams.get('city') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests') || '1'),
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
  });

  const fetchListings = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (!append) setIsLoading(true);
      const params = {
        page: pageNum,
        limit: 20,
        ...filters,
      };
      const response = await listingsApi.search(params);
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        const meta = response.data.meta;
        if (append) {
          setListings((prev) => [...prev, ...data]);
        } else {
          setListings(data);
        }
        setPage(meta.page);
        setHasMore(meta.page < meta.totalPages);
        setTotalResults(meta.total);
      }
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

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

  const handleSearch = () => {
    setSearchParams({
      query: filters.query,
      city: filters.city,
      checkIn: filters.checkIn,
      checkOut: filters.checkOut,
      guests: filters.guests.toString(),
      minPrice: filters.minPrice?.toString(),
      maxPrice: filters.maxPrice?.toString(),
    });
    fetchListings(1, false);
  };

  const navigateToSearch = () => {
    router.push('/search');
  };

  const popularCities = [
    { name: 'Karachi', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400', count: 245 },
    { name: 'Lahore', image: 'https://images.unsplash.com/photo-1591772521997-034930299611?w=400', count: 189 },
    { name: 'Islamabad', image: 'https://images.unsplash.com/photo-1591772521997-034930299611?w=400', count: 156 },
    { name: 'Murree', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', count: 87 },
    { name: 'Hunza', image: 'https://images.unsplash.com/photo-1464822759844-d150ba31a3aa?w=400', count: 64 },
    { name: 'Skardu', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', count: 52 },
  ];

  const propertyTypes = [
    { name: 'Apartments', icon: 'home-outline', count: 892 },
    { name: 'Villas', icon: 'castle-outline', count: 234 },
    { name: 'Farmhouses', icon: 'leaf-outline', count: 156 },
    { name: 'Guesthouses', icon: 'bed-outline', count: 445 },
  ];

  if (isLoading && listings.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <View style={styles.loadingContainer}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonImage} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonLine} />
                <View style={styles.skeletonLineShort} />
                <View style={styles.skeletonLineShort} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme === 'dark' ? '#34d399' : '#059669']} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <TouchableOpacity onPress={navigateToSearch} style={styles.searchButton}>
            <Ionicons name="search-outline" size={22} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.searchPlaceholder, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              Where are you going?
            </Text>
          </TouchableOpacity>

          <View style={styles.quickFilters}>
            <TouchableOpacity
              onPress={() => router.push('/search?tab=dates')}
              style={styles.quickFilter}
            >
              <Ionicons name="calendar-outline" size={18} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              <Text style={[styles.quickFilterText, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>
                {filters.checkIn ? 'Dates set' : 'Add dates'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/search?tab=guests')}
              style={styles.quickFilter}
            >
              <Ionicons name="people-outline" size={18} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
              <Text style={[styles.quickFilterText, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>
                {filters.guests} guest{filters.guests !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular Cities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Popular destinations</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.citiesContainer}>
            {popularCities.map((city) => (
              <TouchableOpacity
                key={city.name}
                onPress={() => {
                  setFilters((prev) => ({ ...prev, city: city.name }));
                  handleSearch();
                }}
                style={styles.cityCard}
              >
                <Image source={{ uri: city.image }} style={styles.cityImage} />
                <View style={styles.cityOverlay}>
                  <Text style={styles.cityName}>{city.name}</Text>
                  <Text style={styles.cityCount}>{city.count} stays</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Property Types */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Types of stays</Text>
          </View>
          <View style={styles.typesGrid}>
            {propertyTypes.map((type) => (
              <TouchableOpacity
                key={type.name}
                onPress={() => router.push(`/search?propertyType=${type.name.toLowerCase()}`)}
                style={styles.typeCard}
              >
                <View style={styles.typeIconContainer}>
                  <Ionicons name={type.icon} size={24} color={theme === 'dark' ? '#34d399' : '#059669'} />
                </View>
                <Text style={[styles.typeName, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{type.name}</Text>
                <Text style={[styles.typeCount, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>{type.count} stays</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>
              Featured stays
              {totalResults > 0 && (
                <Text style={[styles.resultCount, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                  {totalResults} results
                </Text>
              )}
            </Text>
          </View>
          {listings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="home-outline" size={48} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
              <Text style={[styles.emptyText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>No stays found</Text>
              <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#64748b' : '#9ca3af' }]}>
                Try adjusting your search filters
              </Text>
            </View>
          ) : (
            <>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onPress={() => router.push(`/listing/${listing.id}`)} />
              ))}
              {hasMore && !isLoading && (
                <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton}>
                  <Text style={[styles.loadMoreText, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>Load more</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* CTA for non-authenticated users */}
        {!isAuthenticated && (
          <View style={styles.ctaSection}>
            <Card style={styles.ctaCard}>
              <View style={styles.ctaContent}>
                <View>
                  <Text style={[styles.ctaTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>List your property on StayPak</Text>
                  <Text style={[styles.ctaDescription, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                    Earn money by hosting travelers. Free to list, no hidden fees.
                  </Text>
                </View>
                <Button title="Become a host" variant="primary" onPress={() => router.push('/host/dashboard')} />
              </View>
            </Card>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 16,
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
  searchSection: {
    marginBottom: 24,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: 16,
    fontFamily: 'System',
    flex: 1,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  quickFilter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickFilterText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'System',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'System',
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
  },
  citiesContainer: {
    gap: 12,
    paddingRight: 16,
  },
  cityCard: {
    width: 160,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cityImage: {
    width: '100%',
    height: '100%',
  },
  cityOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cityName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  cityCount: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontFamily: 'System',
    marginTop: 2,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'center',
  },
  typeCount: {
    fontSize: 11,
    fontFamily: 'System',
    textAlign: 'center',
    marginTop: 2,
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
  loadMoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'System',
  },
  ctaSection: {
    marginTop: 16,
  },
  ctaCard: {
    padding: 0,
  },
  ctaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  ctaDescription: {
    fontSize: 13,
    fontFamily: 'System',
  },
  bottomSpacer: {
    height: 20,
  },
});