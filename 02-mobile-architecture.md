# Raho MVP — Mobile Architecture
**Stack:** React Native · Expo · TypeScript · Zustand · React Query

---

## Overview

The mobile app is the primary product — it serves both guests (searching and booking) and hosts (listing and managing properties). One app, two modes, controlled by the `role` field on the user. Built with Expo for fast iteration and easy OTA updates. No ejecting for MVP.

---

## Technology Decisions

| Concern | Choice | Why |
|---|---|---|
| Framework | React Native + Expo SDK 51 | No ejecting, OTA updates, Camera/Maps/Notifications all built-in |
| Language | TypeScript (strict) | Shared types with backend DTOs |
| Navigation | Expo Router (file-based) | React Navigation v6 under the hood, cleaner file structure |
| Server state | TanStack React Query v5 | Caching, background refetch, optimistic updates |
| Client state | Zustand | Auth session, UI state — lightweight, no boilerplate |
| HTTP client | Axios with interceptors | Auto-attach JWT, auto-refresh on 401 |
| Forms | React Hook Form + Zod | Fast, uncontrolled inputs, runtime validation |
| Maps | `react-native-maps` | Google Maps on Android, Apple Maps on iOS |
| Calendar | `react-native-calendars` | Date range picker for check-in/out, block dates |
| Image picker | `expo-image-picker` | Photo upload for listings and avatar |
| Push notifications | `expo-notifications` + FCM | Booking alerts, messages, payment confirmations |
| Real-time | `socket.io-client` | In-app messaging WebSocket |
| Payments (webview) | `react-native-webview` | JazzCash and EasyPaisa redirect flows |
| Secure storage | `expo-secure-store` | JWT tokens — never AsyncStorage for auth tokens |
| Styling | StyleSheet API + custom theme | No extra lib, keeps bundle lean |

---

## Folder Structure

```
app/                              ← Expo Router pages (file = route)
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   └── verify-cnic.tsx
├── (guest)/
│   ├── _layout.tsx               ← bottom tab navigator for guest
│   ├── index.tsx                 ← home / search
│   ├── search.tsx                ← filtered search results
│   ├── listing/
│   │   └── [id].tsx              ← listing detail
│   ├── booking/
│   │   ├── checkout.tsx          ← booking summary + payment select
│   │   ├── payment.tsx           ← webview for gateway redirect
│   │   └── confirmation.tsx      ← success screen
│   ├── trips/
│   │   ├── index.tsx             ← my bookings list
│   │   └── [id].tsx              ← booking detail + messaging
│   └── profile/
│       └── index.tsx
├── (host)/
│   ├── _layout.tsx               ← bottom tab navigator for host
│   ├── dashboard.tsx             ← incoming bookings, earnings summary
│   ├── listings/
│   │   ├── index.tsx             ← my listings list
│   │   ├── new.tsx               ← create listing step 1
│   │   ├── [id]/
│   │   │   ├── edit.tsx          ← edit listing details
│   │   │   ├── photos.tsx        ← manage photos
│   │   │   └── availability.tsx  ← block/unblock calendar
│   ├── bookings/
│   │   ├── index.tsx             ← all booking requests
│   │   └── [id].tsx              ← approve/decline + messaging
│   └── profile/
│       └── index.tsx
└── _layout.tsx                   ← root layout, auth gate

src/
├── api/
│   ├── client.ts                 ← Axios instance + interceptors
│   ├── auth.api.ts
│   ├── listings.api.ts
│   ├── bookings.api.ts
│   ├── payments.api.ts
│   ├── messaging.api.ts
│   └── reviews.api.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useListings.ts
│   ├── useBooking.ts
│   └── useMessaging.ts           ← WebSocket hook
├── stores/
│   ├── auth.store.ts             ← Zustand: user session, tokens
│   └── ui.store.ts               ← Zustand: loading states, toasts
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   └── LoadingScreen.tsx
│   ├── listing/
│   │   ├── ListingCard.tsx       ← search result card
│   │   ├── PhotoGallery.tsx      ← swipeable photo carousel
│   │   ├── AmenitiesList.tsx
│   │   └── DateRangePicker.tsx
│   ├── booking/
│   │   ├── BookingCard.tsx
│   │   ├── PriceSummary.tsx
│   │   └── PaymentGatewayPicker.tsx
│   └── messaging/
│       ├── MessageBubble.tsx
│       └── MessageInput.tsx
├── types/
│   ├── user.types.ts
│   ├── listing.types.ts
│   ├── booking.types.ts
│   └── payment.types.ts
├── utils/
│   ├── format.ts                 ← formatPrice, formatDate, formatNights
│   ├── validation.ts             ← Zod schemas
│   └── notifications.ts          ← FCM setup, permission request
└── constants/
    ├── theme.ts                  ← colors, spacing, typography
    ├── cities.ts                 ← Pakistan city list
    └── amenities.ts              ← amenity options + icons
```

---

## Auth Flow

```
App opens
    │
    ├── No tokens in SecureStore ──▶ redirect to /login
    │
    └── Tokens found
            │
            ├── Access token valid ──▶ go to app (guest or host tab)
            │
            └── Access token expired
                    │
                    └── Call /auth/refresh
                            │
                            ├── Success ──▶ store new tokens, go to app
                            │
                            └── Fail (refresh expired) ──▶ logout, go to /login
```

```typescript
// src/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Attach access token to every request
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, attempt token refresh
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
      const { data } = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`, { refreshToken });
      await SecureStore.setItemAsync('access_token', data.data.accessToken);
      error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return client(error.config);
    }
    return Promise.reject(error);
  }
);

export default client;
```

---

## State Management

### Zustand auth store
```typescript
// src/stores/auth.store.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (tokens: Tokens, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (tokens, user) => {
    await SecureStore.setItemAsync('access_token', tokens.accessToken);
    await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (updates) =>
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
}));
```

### React Query for server state
```typescript
// src/hooks/useListings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsApi } from '../api/listings.api';

export function useSearchListings(params: SearchParams) {
  return useQuery({
    queryKey: ['listings', 'search', params],
    queryFn: () => listingsApi.search(params),
    staleTime: 2 * 60 * 1000, // 2 min — search results don't need to be real-time
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listings', id],
    queryFn: () => listingsApi.getById(id),
    staleTime: 30 * 1000,
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: listingsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings', 'mine'] });
    },
  });
}
```

---

## Navigation Structure

```
Root Layout (_layout.tsx)
├── Auth gate: reads from Zustand, redirects unauthenticated users
│
├── (auth) group — no bottom tabs
│   ├── /login
│   ├── /register
│   └── /verify-cnic
│
├── (guest) group — bottom tabs: Search · Trips · Profile
│   ├── /                    ← Home (featured cities, search bar)
│   ├── /search              ← Results with map toggle
│   ├── /listing/[id]        ← Detail: photos, info, reviews, book button
│   ├── /booking/checkout    ← Date confirmation, price breakdown
│   ├── /booking/payment     ← Gateway picker → WebView for redirect
│   ├── /booking/confirmation
│   ├── /trips               ← Upcoming / past bookings
│   ├── /trips/[id]          ← Booking detail + messaging thread
│   └── /profile
│
└── (host) group — bottom tabs: Dashboard · Listings · Requests · Profile
    ├── /dashboard           ← Upcoming checkins, recent requests
    ├── /listings            ← All listings with status badges
    ├── /listings/new        ← Multi-step listing creation
    ├── /listings/[id]/edit
    ├── /listings/[id]/photos
    ├── /listings/[id]/availability
    ├── /bookings            ← Pending requests + all bookings
    ├── /bookings/[id]       ← Approve/decline + messaging
    └── /profile
```

Users with `role: 'both'` get a toggle in the tab bar to switch between guest and host mode.

---

## Payment Flow (WebView)

JazzCash and EasyPaisa both redirect users to a hosted payment page. Safepay has an SDK but the WebView approach works for all three uniformly for MVP.

```typescript
// app/(guest)/booking/payment.tsx
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function PaymentScreen() {
  const { redirectUrl, bookingId } = useLocalSearchParams();
  const router = useRouter();

  const handleNavChange = (navState: any) => {
    const url: string = navState.url;

    // Backend redirects to this URL after gateway callback
    if (url.includes('/payment/success')) {
      router.replace({ pathname: '/booking/confirmation', params: { bookingId } });
    }
    if (url.includes('/payment/failed')) {
      router.replace({ pathname: '/booking/checkout', params: { bookingId, error: 'payment_failed' } });
    }
  };

  return (
    <WebView
      source={{ uri: redirectUrl as string }}
      onNavigationStateChange={handleNavChange}
      startInLoadingState
    />
  );
}
```

---

## Real-time Messaging

```typescript
// src/hooks/useMessaging.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

export function useMessaging(bookingId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    let socket: Socket;

    (async () => {
      const token = await SecureStore.getItemAsync('access_token');
      socket = io(`${process.env.EXPO_PUBLIC_WS_URL}/messaging`, {
        auth: { token },
        transports: ['websocket'],
      });
      socketRef.current = socket;

      socket.emit('join_booking', { bookingId });

      socket.on('new_message', (message: Message) => {
        setMessages((prev) => [...prev, message]);
      });
    })();

    return () => socket?.disconnect();
  }, [bookingId]);

  const sendMessage = (body: string) => {
    socketRef.current?.emit('send_message', { bookingId, body });
  };

  return { messages, sendMessage };
}
```

---

## Push Notifications Setup

```typescript
// src/utils/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { usersApi } from '../api/users.api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return; // skip on simulator

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const { data: fcmToken } = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
  });

  // Save FCM token to backend so server can push to this device
  await usersApi.updateFcmToken(fcmToken);
}
```

---

## Multi-Step Listing Creation

New listing is broken into 4 screens to reduce cognitive load:

```
Step 1: Property basics
  - property_type (apartment / house / room / villa)
  - title, description
  - city, area, address

Step 2: Details
  - bedrooms, bathrooms, max_guests
  - amenities (multi-select grid: WiFi, AC, parking, kitchen, ...)

Step 3: Photos
  - minimum 3, maximum 15
  - drag to reorder, tap to mark as cover

Step 4: Pricing
  - price_per_night (PKR)
  - instant_book toggle
  - review summary → submit as draft
```

State for the multi-step form lives in a single Zustand slice, not React Router params, so you can navigate back and forward without losing data.

---

## Theme and Design Tokens

```typescript
// src/constants/theme.ts
export const colors = {
  primary: '#1D9E75',       // Raho brand teal
  primaryDark: '#0F6E56',
  primaryLight: '#E1F5EE',
  secondary: '#FF6B35',     // accent for CTAs
  background: '#FFFFFF',
  surface: '#F8F8F6',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#A0A0A0',
  border: '#E5E5E5',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  small: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
};

export const borderRadius = {
  sm: 4, md: 8, lg: 12, xl: 16, full: 9999,
};
```

---

## Key Screens — Component Breakdown

### Listing Detail (`/listing/[id]`)
```
<ScrollView>
  <PhotoGallery />               ← swipeable, full-width
  <PriceHeader />                ← PKR X / night · ★ 4.8 (23)
  <HostInfo />                   ← avatar, name, verified badge
  <Divider />
  <PropertyDetails />            ← bedrooms, bathrooms, guests
  <AmenitiesList />
  <Divider />
  <ReviewsList limit={3} />
  <Divider />
  <LocationMap />                ← approximate pin, no exact address
</ScrollView>
<BookingBar />                   ← sticky bottom: "Select dates" → "Book"
```

### Search Results (`/search`)
```
<SearchHeader />                 ← city, dates, guests (sticky)
<SegmentedControl               ← "List" | "Map"
  listView={<FlatList />}        ← ListingCard × N
  mapView={<MapView />}          ← markers, tap = bottom sheet
/>
```

---

## Environment Variables

```bash
# .env (committed as .env.example, actual values in EAS Secrets)
EXPO_PUBLIC_API_URL=https://api.raho.pk/v1
EXPO_PUBLIC_WS_URL=wss://api.raho.pk
EXPO_PUBLIC_CDN_URL=https://cdn.raho.pk
EXPO_PUBLIC_GOOGLE_MAPS_KEY=...
EXPO_PUBLIC_EAS_PROJECT_ID=...
```

---

## Development Setup

```bash
# Install Expo CLI
npm install -g expo-cli eas-cli

# Bootstrap project
npx create-expo-app raho-mobile --template expo-template-blank-typescript

# Core dependencies
npx expo install expo-router expo-secure-store expo-notifications
npx expo install expo-image-picker expo-device
npx expo install react-native-maps react-native-webview react-native-calendars

npm install @tanstack/react-query axios zustand
npm install react-hook-form @hookform/resolvers zod
npm install socket.io-client

# Run on device / simulator
npx expo start
```

---

## Build and Deploy

```bash
# Development build (for device testing with native modules)
eas build --profile development --platform android

# Production build
eas build --profile production --platform all

# OTA update (JS-only changes, no native rebuild needed)
eas update --branch production --message "fix booking confirmation screen"
```

**EAS Build profiles** (`eas.json`):
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    }
  }
}
```

---

## Error Handling Strategy

- Network errors: React Query `onError` callbacks show a toast via UI store
- 401 errors: Axios interceptor handles silently (refresh or logout)
- Form errors: Zod schema + React Hook Form inline messages
- Payment WebView errors: `onError` prop redirects to failure screen
- WebSocket disconnect: socket.io auto-reconnect with exponential backoff

---

## MVP Scope Boundaries

The following are explicitly out of scope for mobile MVP:

- In-app CNIC verification (manual admin review via backend flag)
- Saved / wishlisted listings
- Promo codes or discounts
- Multi-currency (PKR only)
- Guest count breakdown (adults / children)
- Host calendar sync (iCal / Google Calendar)
- Offline support
