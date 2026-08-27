import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthTokens, ApiResponse, PaginatedResponse } from '@/types';

// API Configuration
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api'  // Android emulator
  : 'https://api.staypak.com/api';  // Production

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const ACCESS_TOKEN_KEY = 'staypak_access_token';
const REFRESH_TOKEN_KEY = 'staypak_refresh_token';

// Request interceptor - add auth header
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post<ApiResponse<AuthTokens>>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data!;

        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        await clearAuthTokens();
        // Navigate to login - handled by auth context
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth token management
export const setAuthTokens = async (tokens: AuthTokens): Promise<void> => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const getAccessToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const clearAuthTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAccessToken();
  return !!token;
};

// API Methods
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: any; tokens: AuthTokens }>>('/auth/login', credentials),

  register: (data: { email: string; password: string; fullName: string; phoneNumber: string; role?: string }) =>
    api.post<ApiResponse<{ user: any; tokens: AuthTokens }>>('/auth/register', data),

  googleAuth: (idToken: string) =>
    api.post<ApiResponse<{ user: any; tokens: AuthTokens }>>('/auth/google', { idToken }),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),

  logout: () =>
    api.post<ApiResponse<void>>('/auth/logout'),

  me: () =>
    api.get<ApiResponse<any>>('/auth/me'),
};

export const listingsApi = {
  search: (params: Record<string, any>) =>
    api.get<PaginatedResponse<any>>('/listings', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/listings/${id}`),

  getHostListings: (params: Record<string, any>) =>
    api.get<PaginatedResponse<any>>('/listings/host/mine', { params }),

  getMyListings: (params: Record<string, any>) =>
    api.get<PaginatedResponse<any>>('/listings/host/mine', { params }),

  create: (data: FormData) =>
    api.post<ApiResponse<any>>('/listings', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: FormData) =>
    api.patch<ApiResponse<any>>(`/listings/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/listings/${id}`),

  toggleStatus: (id: string) =>
    api.patch<ApiResponse<any>>(`/listings/${id}/toggle-status`),

  checkAvailability: (id: string, checkIn: string, checkOut: string) =>
    api.get<ApiResponse<{ available: boolean; conflictingBookings?: any[] }>>(`/listings/${id}/availability`, {
      params: { checkIn, checkOut },
    }),

  calculatePrice: (id: string, checkIn: string, checkOut: string, guests: number) =>
    api.get<ApiResponse<any>>(`/listings/${id}/price`, { params: { checkIn, checkOut, guests } }),
};

export const bookingsApi = {
  create: (data: { listingId: string; checkIn: string; checkOut: string; guestsCount: number; specialRequests?: string }) =>
    api.post<ApiResponse<any>>('/bookings', data),

  getAll: (params: Record<string, any>) =>
    api.get<PaginatedResponse<any>>('/bookings', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/bookings/${id}`),

  cancel: (id: string, reason?: string) =>
    api.post<ApiResponse<any>>(`/bookings/${id}/cancel`, { reason }),

  initiatePayment: (id: string, gateway: string) =>
    api.post<ApiResponse<any>>(`/bookings/${id}/payment/initiate`, { gateway }),

  paymentCallback: (gateway: string, data: Record<string, any>) =>
    api.post<ApiResponse<any>>(`/bookings/payment/${gateway}/callback`, data),

  // Host actions
  confirm: (id: string) =>
    api.post<ApiResponse<any>>(`/bookings/${id}/confirm`),

  reject: (id: string) =>
    api.post<ApiResponse<any>>(`/bookings/${id}/reject`),

  getMessages: (bookingId: string) =>
    api.get<ApiResponse<any[]>>(`/bookings/${bookingId}/messages`),

  sendMessage: (bookingId: string, body: string) =>
    api.post<ApiResponse<any>>(`/bookings/${bookingId}/messages`, { body }),

  getConversations: () =>
    api.get<ApiResponse<any[]>>('/bookings/conversations'),
};

export const reviewsApi = {
  create: (data: { bookingId: string; rating: number; comment: string }) =>
    api.post<ApiResponse<any>>('/reviews', data),

  getByListing: (listingId: string, params: Record<string, any>) =>
    api.get<PaginatedResponse<any>>(`/reviews/listing/${listingId}`, { params }),

  respond: (id: string, response: string) =>
    api.post<ApiResponse<any>>(`/reviews/${id}/respond`, { response }),

  getListingStats: (listingId: string) =>
    api.get<ApiResponse<any>>(`/reviews/listing/${listingId}/stats`),
};

export const usersApi = {
  getProfile: () =>
    api.get<ApiResponse<any>>('/users/profile'),

  updateProfile: (data: FormData) =>
    api.patch<ApiResponse<any>>('/users/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<ApiResponse<void>>('/users/change-password', data),

  uploadAvatar: (file: any) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<ApiResponse<{ avatarUrl: string }>>('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadCnic: (file: any, cnicNumber: string) => {
    const formData = new FormData();
    formData.append('cnicDoc', file);
    formData.append('cnicNumber', cnicNumber);
    return api.post<ApiResponse<{ cnicDocUrl: string }>>('/users/cnic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  verifyCnic: (cnicNumber: string) =>
    api.post<ApiResponse<any>>('/users/verify-cnic', { cnicNumber }),

  getHostStats: () =>
    api.get<ApiResponse<any>>('/users/host/stats'),

  deleteAccount: () =>
    api.delete<ApiResponse<void>>('/users/account'),
};

export default api;