# Snazzyfit Android Application: Backend Analysis & Implementation Plan

Comprehensive architectural review of the existing Node.js / Express backend and the phased implementation plan for the Android mobile application (Expo SDK 57, React Native 0.86, React 19, TypeScript).

---

## Part 1: Thorough Backend Analysis

### 1. Technology Stack & Server Architecture
* **Server Framework**: Node.js (ES Modules), Express.js (Express 5 compatible).
* **Database**: MongoDB with Mongoose (`connectDB()` in `backend/config/mongoDB.js`).
* **Media Storage**: Cloudinary (`backend/config/cloudinary.js`) for CDN-hosted multi-image uploads.
* **Security Layer**: 
  - `helmet()` for secure HTTP headers.
  - Rate limiting via `express-rate-limit`: 500 requests per 15 minutes per IP on `/api`.
  - Data sanitization against NoSQL injection (`express-mongo-sanitize`).
  - XSS sanitization (`xss-clean`).
* **Communications**: Nodemailer (`backend/utils/mailer.js`) for order confirmation, shipping updates, and password resets.
* **Payment Gateways**: Cash on Delivery (COD), Razorpay (order creation & HMAC SHA256 verification), Stripe.

### 2. Authentication & Authorization Mechanism
* **Token Strategy**: JSON Web Token (JWT) signed with `JWT_SECRET` expiring in 7 days for users, 1 day for admins.
* **Header Convention**: 
  - The backend middleware (`authUser.js` and `adminAuth.js`) inspects `req.headers.token` (i.e. `token: "<JWT>"` in HTTP headers), rather than the standard `Authorization: Bearer <token>`. The mobile client HTTP interceptor must send the token in the `token` header.
* **Error Response Envelope**:
  - Authentication failures and business logic errors return HTTP 200 (or 400/500) with a JSON payload:
    `{ success: false, message: "..." }`. The mobile API client must check `response.data.success === false` and treat it as an error condition.

### 3. Database Models & Schema Summary
1. **User (`userModel.js`)**:
   - `name`: String, `email`: String (unique), `password`: String (bcrypt hashed, `select: false`).
   - `cartData`: Dictionary mapping `{ [productId]: { [size]: quantity } }`.
   - `wishlist`: Array of Product IDs (`[String]`).
   - `phone`: String.
   - `addresses`: Array of `{ id, firstName, lastName, email, street, city, state, zipcode, country, phone, isDefault }`.
2. **Product (`productModel.js`)**:
   - `name`, `description`, `price` (Number), `image` (Array of Cloudinary URLs).
   - `category` (enum: `['Men', 'Women', 'Kids']`), `subCategory` (enum: `['Topwear', 'Bottomwear', 'Winterwear']`).
   - `sizes` (enum: `['XS', 'S', 'M', 'L', 'XL', 'XXL']`).
   - `stockQuantities`: Dictionary mapping `{ [size]: number }`.
   - `bestseller`: Boolean, `outOfStock`: Boolean.
   - `averageRating`: Number, `totalReviews`: Number.
3. **Category (`categoryModel.js`)**:
   - `name`: String (unique), `type`: `category` | `subCategory`.
4. **Order (`orderModel.js`)**:
   - `userId`, `items` (Array of items with snapshot prices, size, quantity), `amount`, `address`, `status`, `paymentMethod` (`'COD' | 'Stripe' | 'Razorpay'`), `payment` (Boolean), `date` (Timestamp).
5. **Review (`reviewModel.js`)**:
   - `userId`, `productId`, `userName`, `rating` (1-5), `reviewText`. Compound unique index on `{ userId, productId }` (1 review per product per user).
6. **Coupon & Discount (`couponModel.js`, `discountModel.js`)**:
   - Supports percentage/fixed discounts with time-window validation, target matching (`sitewide`, `category`, `subCategory`, `product`), usage limits, and minimum order values.

### 4. Key Business Logic & Checkout Flow
* **Dynamic Discount Calculation**: `applyDiscountsToProducts()` automatically checks active promotional campaigns and calculates `discountInfo` (`amountSaved`, `percentageSaved`, `originalPrice`, and discounted `price`).
* **Cart Calculation Endpoint (`/api/cart/calculate`)**: 
  - Validates size-specific inventory stock against `product.stockQuantities[size]`.
  - Computes subtotal, applies coupon codes, and returns itemized calculations.
* **Order Placement (`/api/order/place`, `/api/order/razorpay`)**:
  - Automatically deducts inventory with `$inc: { "stockQuantities.<size>": -quantity }`.
  - Wipes `user.cartData` to empty after successful placement.
  - Sends email confirmation via Nodemailer.

---

## Part 2: Phased Implementation Plan for the Android App

This development is divided into **6 sequential, atomic phases**. In accordance with the rules:
- We implement **only one phase at a time**.
- Before starting each phase, the detailed scope is presented.
- After implementation, the phase is tested and verified with the live backend.
- A descriptive GitHub commit is created upon successful verification before proceeding.

```
Phase 1: Foundation, Network Client & Storage
   ↓
Phase 2: Authentication & User Profile
   ↓
Phase 3: Product Catalog, Search & Filtering
   ↓
Phase 4: Cart Management & Wishlist
   ↓
Phase 5: Checkout, Orders & Reviews
   ↓
Phase 6: Native Polish, Offline & Build Config
```

---

### Phase 1: Foundation, Network Client & Secure Storage

* **Objective**: Configure network connectivity between the Android mobile runtime and the Express backend, establish secure token storage using Android Keystore, and configure TypeScript contracts matching the backend schemas.
* **Dependencies**: None.
* **Tasks**:
  1. Install `axios`, `expo-secure-store`, `@tanstack/react-query`.
  2. Configure environment resolution (`.env` and `.env.development`) with `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api` for Android emulator and local LAN IP for physical device.
  3. Create `src/services/storage/tokenStorage.ts` leveraging `expo-secure-store` for JWT persistence.
  4. Create `src/services/api/client.ts`:
     - Base Axios instance targeting `EXPO_PUBLIC_API_URL`.
     - Request interceptor: automatically attaches `token` in `headers: { token: storedToken }`.
     - Response interceptor: normalizes `{ success: false, message }` into standard application errors.
  5. Create `src/types/` matching backend models: `User`, `Product`, `Category`, `Cart`, `Order`, `Review`, `Coupon`, `Discount`.
  6. Create a health-check screen/hook verifying connection to `GET http://10.0.2.2:4000/`.
* **Expected Outcome**: Android app reliably communicates with Express server at port 4000; tokens can be securely stored and retrieved; TypeScript interfaces match backend models exactly.
* **Proposed Commit**:
  ```bash
  git commit -m "feat(network): setup axios client with token interceptor, secure storage, and api contracts"
  ```

---

### Phase 2: Authentication & User Profile Management

* **Objective**: Implement user registration, login, profile retrieval/updating, address book management, and session persistence across app restarts.
* **Dependencies**: Phase 1.
* **Tasks**:
  1. Implement `src/services/api/authService.ts`:
     - `login(email, password)` → calls `POST /api/user/login`.
     - `register(name, email, password)` → calls `POST /api/user/register`.
     - `forgotPassword(email)` → calls `POST /api/user/forgot-password`.
     - `resetPassword(token, password)` → calls `POST /api/user/reset-password`.
  2. Implement `src/services/api/userService.ts`:
     - `getProfile()` → calls `POST /api/user/profile/get`.
     - `updateProfile(data)` → calls `POST /api/user/profile/update` (name, phone, addresses).
  3. Build `AuthContext` (`src/context/AuthContext.tsx`):
     - Auto-loads saved token on app mount.
     - Fetches and stores active user profile.
     - Provides `login`, `register`, `logout` functions.
  4. Build UI screens in Expo Router:
     - `src/app/(auth)/login.tsx` (email/password form with validation).
     - `src/app/(auth)/register.tsx` (name, email, 8+ char password).
     - `src/app/(auth)/forgot-password.tsx`.
     - `src/app/(tabs)/profile.tsx` (view profile, edit details, manage saved delivery addresses).
  5. Add route protection in `src/app/_layout.tsx` to handle authentication redirects.
* **Expected Outcome**: Users can register, log in, store addresses in MongoDB, maintain sessions after closing the app, and log out cleanly.
* **Proposed Commit**:
  ```bash
  git commit -m "feat(auth): implement user authentication, session persistence, and profile address management"
  ```

---

### Phase 3: Product Catalog, Categories, Search & Filtering

* **Objective**: Connect the Android frontend to the catalog APIs to display categorized products, active discounts, search suggestions, and single product details with image carousels and size selections.
* **Dependencies**: Phase 1.
* **Tasks**:
  1. Implement `src/services/api/productService.ts`:
     - `getProducts(params)` → `GET /api/product/list` with pagination, category, subCategory, sortType (`low - high`, `high - low`), and bestseller filters.
     - `getProductById(id)` → `GET /api/product/single?productId=...`.
     - `getSearchSuggestions(query)` → `GET /api/product/search-suggestions?query=...`.
     - `getCategories()` → `GET /api/category/list`.
     - `getActiveDiscounts()` → `GET /api/discounts/active`.
  2. Implement React Query hooks (`useProducts`, `useProductDetail`, `useSearchSuggestions`, `useCategories`).
  3. Build Screens and Components:
     - Home screen (`src/app/(tabs)/index.tsx`): Hero banner, active discount badges, bestseller horizontal list, category pill filters.
     - Explore / Catalog screen (`src/app/(tabs)/explore.tsx`): Infinite scroll product grid, category/subCategory tabs, price sorting sheet, search bar with live auto-suggestions.
     - Product Detail screen (`src/app/product/[id].tsx`): Multi-image carousel from Cloudinary, discount calculation display (`originalPrice` vs `price`, badge with `% saved`), stock status indicator by size, interactive size selector (`XS`, `S`, `M`, `L`, `XL`, `XXL`), and product description.
* **Expected Outcome**: Fast, cached browsing of products with active discount pricing, search auto-complete, and detailed product page with size availability.
* **Proposed Commit**:
  ```bash
  git commit -m "feat(catalog): implement product listing, category filtering, search suggestions, and product detail view"
  ```

---

### Phase 4: Cart Synchronization & Wishlist

* **Objective**: Build server-synced cart functionality (`user.cartData`) and wishlist management (`user.wishlist`) with offline-tolerant optimistic updates.
* **Dependencies**: Phase 2, Phase 3.
* **Tasks**:
  1. Implement `src/services/api/cartService.ts`:
     - `getCart()` → `POST /api/cart/get`.
     - `addToCart(itemId, size)` → `POST /api/cart/add`.
     - `updateCart(itemId, size, quantity)` → `POST /api/cart/update`.
     - `getMultipleProducts(ids)` → `POST /api/product/multiple` (to populate full product details for cart items).
  2. Implement `src/services/api/wishlistService.ts`:
     - `toggleWishlist(productId)` → `POST /api/user/wishlist/toggle`.
  3. Build `CartContext` / `useCart` store:
     - Maintains cart count badge on the tab bar.
     - Synchronizes additions/removals with backend `cartData`.
     - Hydrates cart items using `POST /api/product/multiple`.
  4. Build UI screens:
     - Cart screen (`src/app/(tabs)/cart.tsx`): Item cards (image, name, chosen size, quantity stepper, price), subtotal summary, clear cart / remove action, and "Proceed to Checkout" button.
     - Wishlist screen (`src/app/(tabs)/wishlist.tsx`): Saved products with quick "Move to Cart" action.
* **Expected Outcome**: Adding an item from product details updates the backend `cartData` and reflects on all devices; wishlist toggles smoothly with immediate UI response.
* **Proposed Commit**:
  ```bash
  git commit -m "feat(cart): implement server-synced cart, size-based quantity management, and wishlist"
  ```

---

### Phase 5: Checkout Calculation, Order Placement & Product Reviews

* **Objective**: Implement the multi-step checkout workflow with dynamic discount/coupon calculation, address selection, payment options (Cash on Delivery & Razorpay), order tracking, and product reviews.
* **Dependencies**: Phase 4.
* **Tasks**:
  1. Implement `src/services/api/checkoutService.ts`:
     - `calculateCart(items, couponCode)` → `POST /api/cart/calculate`.
     - `placeOrderCOD(items, address, couponCode)` → `POST /api/order/place`.
     - `placeOrderRazorpay(items, address, couponCode)` → `POST /api/order/razorpay`.
     - `verifyRazorpayPayment(...)` → `POST /api/order/verifyRazorpay`.
     - `getUserOrders()` → `POST /api/order/userorders`.
  2. Implement `src/services/api/reviewService.ts`:
     - `getProductReviews(productId)` → `GET /api/reviews/product/:productId`.
     - `checkCanReview(productId)` → `POST /api/reviews/can-review`.
     - `submitReview(productId, rating, reviewText)` → `POST /api/reviews/add`.
  3. Build UI screens:
     - Checkout screen (`src/app/checkout/index.tsx`): Delivery address selector (from saved addresses or new entry), coupon input with live validation (`apply coupon`), breakdown summary (Base Total, Discount, Coupon Discount, Delivery ₹10, Final Total), payment method selection (Cash on Delivery).
     - Order Confirmation / Success screen (`src/app/checkout/success.tsx`).
     - Orders List screen (`src/app/orders/index.tsx`): Order history cards showing order ID, items, delivery status (`Order Placed`, `Shipped`, `Delivered`), and timestamp.
     - Review submission component on product detail screen (star rating 1-5 and comment).
* **Expected Outcome**: End-to-end checkout with stock verification, inventory deduction, coupon application, order persistence, and user review capability.
* **Proposed Commit**:
  ```bash
  git commit -m "feat(orders): implement checkout calculation, coupon verification, order placement, and product reviews"
  ```

---

### Phase 6: Android Polish, Offline Resilience, App Icon & Build Readiness

* **Objective**: Polish the mobile experience for Android devices, handle offline states gracefully, configure production metadata in `app.json`, and verify standalone Android build configurations.
* **Dependencies**: Phases 1 through 5.
* **Tasks**:
  1. Offline Detection: Install `@react-native-community/netinfo` and display an offline banner when disconnected from the backend.
  2. Android UX Polish:
     - Configure Android hardware back-button behaviors.
     - Adjust keyboard-avoiding views for checkout and login forms.
     - Configure Android status bar & navigation bar theme adaptation (`expo-status-bar`).
  3. App Metadata & Configuration in `app.json`:
     - Configure Android package (`com.snazzyfit.app`).
     - Ensure required Android permissions (`INTERNET`, `ACCESS_NETWORK_STATE`).
  4. Integration testing: Full end-to-end user journey test on Android emulator from splash screen to order receipt.
* **Expected Outcome**: Production-grade Android mobile app, resilient to network dropouts, visually polished, and ready for APK/AAB builds.
* **Proposed Commit**:
  ```bash
  git commit -m "chore(android): configure app permissions, offline resilience, and production build metadata"
  ```

---

## Verification & Execution Protocol

For each phase:
1. **Pre-Implementation Notice**: Announce the phase and summarize exact files to be created/modified.
2. **Implementation**: Write clean TypeScript code adhering to Expo SDK 57 and backend API specifications.
3. **Verification**:
   - Run type checks (`npx tsc --noEmit`).
   - Test endpoints against the live Express backend on port 4000.
   - Verify UI behavior in Expo / Android emulator.
4. **Git Commit**: Commit with the exact conventional commit message specified in the plan.
5. **Next Phase Review**: Solicit feedback before advancing.
