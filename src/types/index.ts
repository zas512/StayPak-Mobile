// Core Types for StayPak Mobile App

export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  avatarUrl?: string;
  role: 'guest' | 'host' | 'both';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isCnicVerified: boolean;
  cnicNumber?: string;
  cnicDocUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  propertySubtype?: string;
  address: string;
  city: string;
  area?: string;
  latitude: number;
  longitude: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  basePrice: number;
  currency: string;
  cleaningFee?: number;
  securityDeposit?: number;
  minStay: number;
  maxStay?: number;
  instantBook: boolean;
  amenities: Amenity[];
  houseRules?: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: CancellationPolicy;
  status: ListingStatus;
  hostId: string;
  host?: User;
  photos: ListingPhoto[];
  averageRating?: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListingPhoto {
  id: string;
  cdnUrl: string;
  caption?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Booking {
  id: string;
  listingId: string;
  listing?: Listing;
  guestId: string;
  guest?: User;
  hostId: string;
  host?: User;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsCount: number;
  baseAmount: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentGateway?: PaymentGateway;
  paymentReference?: string;
  specialRequests?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  confirmedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  listingId: string;
  authorId: string;
  author?: User;
  rating: number;
  comment: string;
  response?: string;
  respondedAt?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  sender?: User;
  body: string;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
}

export interface Conversation {
  bookingId: string;
  listing: Listing;
  otherUser: User;
  lastMessage?: Message;
  unreadCount: number;
}

// Enums
export type PropertyType =
  | 'apartment'
  | 'house'
  | 'villa'
  | 'cottage'
  | 'farmhouse'
  | 'guesthouse'
  | 'hotel'
  | 'resort'
  | 'campsite'
  | 'unique';

export type Amenity =
  | 'wifi'
  | 'air_conditioning'
  | 'heating'
  | 'kitchen'
  | 'washer'
  | 'dryer'
  | 'tv'
  | 'parking'
  | 'pool'
  | 'gym'
  | 'elevator'
  | 'doorman'
  | 'security'
  | 'balcony'
  | 'garden'
  | 'bbq'
  | 'fireplace'
  | 'workspace'
  | 'crib'
  | 'high_chair'
  | 'pets_allowed'
  | 'smoking_allowed'
  | 'events_allowed';

export type CancellationPolicy = 'flexible' | 'moderate' | 'strict' | 'super_strict';

export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'inactive' | 'suspended';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'disputed';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed' | 'partial';

export type PaymentGateway = 'jazzcash' | 'easypaisa' | 'safepay' | 'stripe';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role?: 'guest' | 'host' | 'both';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface GoogleAuthResponse {
  idToken: string;
  accessToken: string;
}

// Search & Filter Types
export interface SearchFilters {
  query?: string;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyTypes?: PropertyType[];
  amenities?: Amenity[];
  instantBook?: boolean;
  minRating?: number;
}

export interface SearchParams extends SearchFilters {
  page?: number;
  limit?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity';
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'message'
  | 'review'
  | 'payment'
  | 'verification'
  | 'promo'
  | 'system';

// Settings Types
export interface AppSettings {
  darkMode: 'system' | 'light' | 'dark';
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    bookingUpdates: boolean;
    messages: boolean;
    promotions: boolean;
  };
  currency: 'PKR' | 'USD';
  language: 'en' | 'ur';
}