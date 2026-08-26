import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Listing } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from './Badge';
import { Avatar } from './Avatar';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  style?: any;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  onFavorite,
  isFavorite = false,
  style,
}) => {
  const { theme } = useTheme();

  const primaryPhoto = listing.photos?.find((p) => p.isPrimary) || listing.photos?.[0];
  const imageUrl = primaryPhoto?.cdnUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400';

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
      apartment: 'Apartment',
      house: 'House',
      villa: 'Villa',
      cottage: 'Cottage',
      farmhouse: 'Farmhouse',
      guesthouse: 'Guesthouse',
      hotel: 'Hotel',
      resort: 'Resort',
      campsite: 'Campsite',
      unique: 'Unique',
    };
    return labels[type] || type;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.card, style]}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Badges */}
        <View style={styles.badgesContainer}>
          {listing.instantBook && (
            <Badge variant="success" size="sm">Instant Book</Badge>
          )}
          <Badge variant="outline" size="sm">{getPropertyTypeLabel(listing.propertyType)}</Badge>
        </View>

        {/* Favorite Button */}
        {onFavorite && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onFavorite();
            }}
            style={[
              styles.favoriteButton,
              { backgroundColor: isFavorite ? '#ef4444' : 'rgba(0,0,0,0.4)' },
            ]}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>
        )}

        {/* Rating */}
        {listing.averageRating && listing.averageRating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={styles.ratingText}>{listing.averageRating.toFixed(1)}</Text>
            <Text style={styles.reviewCountText}>({listing.reviewCount})</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]} numberOfLines={1}>
            {listing.title}
          </Text>
          <Text style={[styles.price, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>
            {formatPrice(listing.basePrice)}<Text style={styles.priceNight}>/night</Text>
          </Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
          <Text style={[styles.location, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
            {listing.city}{listing.area ? `, ${listing.area}` : ''}
          </Text>
        </View>

        <View style={styles.amenitiesRow}>
          <View style={styles.amenityItem}>
            <Ionicons name="people-outline" size={14} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.amenityText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              {listing.maxGuests} guests
            </Text>
          </View>
          <View style={styles.amenityItem}>
            <Ionicons name="bed-outline" size={14} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.amenityText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              {listing.bedrooms} {listing.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
            </Text>
          </View>
          <View style={styles.amenityItem}>
            <Ionicons name="wifi-outline" size={14} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.amenityText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              WiFi
            </Text>
          </View>
        </View>

        {listing.host && (
          <View style={styles.hostRow}>
            <Avatar source={listing.host.avatarUrl ? { uri: listing.host.avatarUrl } : undefined} name={listing.host.fullName} size="sm" />
            <Text style={[styles.hostName, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>
              Hosted by {listing.host.fullName}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgesContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  ratingContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  reviewCountText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontFamily: 'System',
  },
  content: {
    padding: 16,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  priceNight: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 13,
    fontFamily: 'System',
  },
  amenitiesRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amenityText: {
    fontSize: 12,
    fontFamily: 'System',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  hostName: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'System',
  },
});