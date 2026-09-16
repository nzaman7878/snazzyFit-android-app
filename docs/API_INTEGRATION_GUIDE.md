# SnazzyFit Android Application - API Integration & Architecture Guide

## 1. Overview
SnazzyFit is a high-performance Android eCommerce application built with **React Native (0.86)**, **Expo SDK 57**, and **TypeScript**, connected directly to an existing **Express.js + MongoDB** backend.

---

## 2. Architecture & Directory Structure

```
snazzyfit/
├── backend/                       # Node.js + Express + MongoDB backend
├── docs/                          # Developer integration guides & specs
│   └── API_INTEGRATION_GUIDE.md
├── scripts/                       # End-to-end phase automated test scripts
├── src/
│   ├── app/                       # Expo Router file-based navigation
│   │   ├── (auth)/                # Login, Register, Forgot Password
│   │   ├── checkout/              # Multi-step checkout & Order Confirmation
│   │   ├── orders/                # Order history & Tracking
│   │   ├── product/[id].tsx       # Product details, Stock check, Reviews
│   │   ├── index.tsx              # Home storefront
│   │   ├── explore.tsx            # Catalog & search filter
│   │   ├── cart.tsx               # Cart drawer / screen
│   │   ├── wishlist.tsx           # Saved items
│   │   └── profile.tsx            # Account & saved delivery addresses
│   ├── components/                # UI design system & modular components
│   ├── context/                   # Global state (AuthContext, CartContext)
│   ├── hooks/                     # Custom React Query & API hooks
│   ├── services/
│   │   ├── api/                   # Axios client, auth, products, orders, cart
│   │   └── storage/               # Encrypted SecureStore token management
│   └── types/                     # Strict TypeScript data contracts
```

---

## 3. Backend API Connection & Configuration

### Environment Variables
Environment variables are configured in `.env.development`:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api
```

### Network Addresses by Environment:
1. **Android Studio Emulator**:
   - URL: `http://10.0.2.2:4000/api`
   - Maps automatically to the host machine's `localhost:4000`.
2. **Physical Android Device (Expo Go / Development Build)**:
   - Must be on the same local Wi-Fi network as the backend server.
   - URL: `http://<YOUR_LOCAL_IP>:4000/api` (e.g., `http://192.168.1.15:4000/api`).
3. **Production Cloud Deployment**:
   - URL: `https://api.snazzyfit.com/api`

---

## 4. Key API Contracts & Authentication

### Token Header Convention
The backend Express middleware (`authUser.js`) reads tokens from request headers:
```javascript
const { token } = req.headers;
```
The Android app's Axios interceptor (`src/services/api/client.ts`) attaches both:
- `headers['token'] = token;`
- `headers['Authorization'] = 'Bearer ' + token;`

### Secure Token Persistence
Tokens are saved using `expo-secure-store`, backed by Android's hardware-backed **Android Keystore System** rather than plain `AsyncStorage`.

### Response Enveloping
The backend returns standardized envelopes:
```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
```
Client errors and validation failures (`success === false`) are intercepted and converted into standardized `AppApiError` exceptions for seamless UI handling.

---

## 5. End-to-End Workflows

1. **Authentication**:
   - Register (`POST /api/user/register`)
   - Login (`POST /api/user/login`)
   - Auto-session restoration from hardware Keystore on app launch.
2. **Catalog & Filtering**:
   - Product list (`GET /api/product/list`)
   - Category filtering (Men, Women, Kids) & live search debounce
   - Real-time stock verification by size (`S`, `M`, `L`, `XL`, `XXL`).
3. **Cart & Wishlist**:
   - Synchronized with user MongoDB document (`POST /api/cart/update`, `POST /api/cart/get`).
   - Size-specific item quantity increments and decrements.
4. **Checkout & Discounts**:
   - Address book management (`POST /api/user/add-address`, `POST /api/user/get-addresses`).
   - Dynamic server-side coupon code validation (`POST /api/cart/calculate`).
   - Payment choices: Cash on Delivery (COD) and Razorpay integration readiness.
5. **Orders & Reviews**:
   - Order placement (`POST /api/order/place`).
   - Order history listing (`POST /api/order/userorders`).
   - Verified buyer product reviews and star ratings (`POST /api/review/add`).

---

## 6. Offline Resilience

The app includes `@react-native-community/netinfo` monitoring:
- Detects network drops instantaneously.
- Displays an `OfflineBanner` indicating cached browsing mode.
- React Query handles caching and automatic background refetching when network connectivity is re-established.

---

## 7. Building for Production Android (APK / AAB)

### Prerequisites:
Install EAS CLI:
```bash
npm install -g eas-cli
eas login
```

### Configure EAS:
```bash
eas build:configure
```

### Build APK (for direct device installation & testing):
```bash
eas build -p android --profile preview
```

### Build Production AAB (for Google Play Store release):
```bash
eas build -p android --profile production
```
