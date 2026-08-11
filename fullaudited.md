# Full API & Feature Audit Matrix

## 1. Storefront & Customer Portal Audit (User Side)

| Feature | Domain | Backend API Endpoint | Frontend Route / Component | Connection Status | Details & Notes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Customer Auth (OTP)** | `auth` / `otp` | `POST /auth/send-otp`, `POST /auth/verify-otp` | `/login?mode=phone`, `CustomerLoginForm` | ✅ Connected | Full OTP request & dev code verification |
| **Customer Auth (Email)** | `auth` | `POST /auth/login`, `POST /auth/register` | `/login?mode=email`, `register/page.tsx` | ✅ Connected | JWT token generation & auto storage in localStorage/cookies |
| **Pre-Login Welcome Page** | `me` | N/A (Static + Guest API state) | `/profile` (Unauthenticated state) | ✅ Connected | Pixel-perfect blush hero card, 2x2 benefits, login triggers |
| **Authenticated Profile** | `customer-profile` | `GET /me/profile`, `PUT /me/profile` | `/profile`, `profile/edit/page.tsx` | ✅ Connected | Royal Maroon card with Loyalty Points, tier badge & profile info |
| **Address Book** | `customer-address` | `GET /me/addresses`, `POST /me/addresses`, `DELETE /me/addresses/:id` | `/checkout/address`, `address/add/page.tsx` | ✅ Connected | Full CRUD address management for checkout & profile |
| **Guest Wishlist & Auto-Sync** | `wishlist` | `GET /wishlist`, `POST /wishlist`, `DELETE /wishlist/:id`, `POST /wishlist/sync` | `/wishlist`, `MobileBottomNav`, `ProductGridSection` | ⚡ Guest + Sync | Unauthenticated guests save to `localStorage`; auto-syncs on login |
| **Cart & Cart Drawer** | `cart` | `GET /cart`, `POST /cart/items`, `PUT /cart/items/:id`, `DELETE /cart/items/:id` | `/cart`, `CartDrawer` | ✅ Connected | Live item count, price calculations, quantity increment/decrement |
| **Checkout Workflow** | `checkout` | `POST /checkout/process`, `POST /checkout/payment/verify` | `/checkout`, `/checkout/payment`, `/checkout/address` | ✅ Connected | Address selection, shipping calculations & payment processing |
| **My Orders List** | `order` | `GET /me/orders`, `GET /me/orders/:orderNumber` | `/orders`, `/orders/details/[id]` | ✅ Connected | Filter by status (Pending, Confirmed, Shipped, Delivered, Returns) |
| **Order Status Tracker** | `order` | `GET /me/orders/:orderNumber/tracking` | `/orders/track/[id]` | ✅ Connected | Real-time status progress bar & timeline steps |
| **Order Return Workflow** | `return-request` | `POST /me/orders/:orderNumber/return` | `/orders/return/[id]` | ✅ Connected | Reason selection, description & return request submission |
| **Product Reviews** | `review` | `GET /products/:productId/reviews`, `POST /products/:productId/reviews` | `/product/[id]`, `ReviewFormModal` | ✅ Connected | Verified purchaser check, 1-5 star ratings, breakdown bars |
| **Delivered Order Review Prompt** | `review` | `GET /me/pending-reviews` | `/profile` (`ReviewPromptBanner`) | ✅ Connected | Prompts for delivered order feedback + **+50 Loyalty Points** bonus |
| **Homepage Hero Banners** | `cms` / `media` | `GET /storefront/homepage` | `HeroSection.tsx` | ✅ Connected | Displays admin-uploaded hero banners with SSR/client URL normalization |
| **Categories Grid** | `categories` | `GET /categories` | `/categories`, `CategoryShowcaseSection.tsx` | ✅ Connected | Displays all 11 categories with high-res thumbnails |
| **New Arrivals Floating FAB** | `products` | `GET /products?isNewArrival=true` | `/new-arrivals`, `MobileBottomNav` | ✅ Connected | Floating center FAB button with maroon gradient, gold border & sparkles |
| **Product Search** | `search` | `GET /products?search=...` | `/search`, `StorefrontHeader` | ✅ Connected | Real-time query search across products & tags |
| **Loyalty & Rewards** | `loyalty` | `GET /me/loyalty`, `GET /me/profile` | `/profile` (Royal Maroon Card) | ✅ Connected | Loyalty points count (e.g. 1,250) and Silver/Gold member tier |
| **Referral Program** | `referral` | `GET /me/referral` | `/profile/referral` | ✅ Connected | Share referral link, earn ₹100 off promo bonus |
| **Customer Notifications** | `notification` | `GET /me/notifications` | `/profile/notifications` | ✅ Connected | In-app alerts for order confirmation, shipping, delivery & reviews |
| **Customer Support FAQs** | `faq` | `GET /storefront/faqs` | `/faqs` | ✅ Connected | Accordion list of frequently asked questions |
| **Support Ticket Creation** | `support` | `POST /me/support/tickets` | `/contact` | ✅ Connected | Contact support form & query submission |

---

## 2. Admin & Operations Portal Audit (Admin Side)

| Feature | Domain | Backend API Endpoint | Admin Route / Component | Connection Status | Details & Notes |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Admin Login & Auth** | `auth` / `staff` | `POST /auth/staff/login` | `/admin/login` | ✅ Connected | Staff JWT credentials, permissions check & token refresh |
| **Dashboard Analytics** | `dashboard` | `GET /admin/dashboard/stats`, `GET /admin/dashboard/charts` | `/admin/dashboard` | ✅ Connected | Total revenue, active orders, total customers & sales graphs |
| **Hero Banner CMS** | `cms` | `GET /admin/cms/banners`, `POST /admin/cms/banners`, `DELETE /admin/cms/banners/:id` | `/admin/banners` | ✅ Connected | Upload hero banners, toggle active status, set links & display order |
| **Product Catalog Management** | `products` | `GET /admin/products`, `POST /admin/products`, `PUT /admin/products/:id` | `/admin/products`, `/admin/products/new` | ✅ Connected | Product creation, SKU, pricing, descriptions, images upload |
| **Product Variants** | `product-variants` | `GET /admin/products/:id/variants`, `POST /admin/products/:id/variants` | `/admin/products/[id]/variants` | ✅ Connected | Size & color variant generation, price overrides & stock management |
| **Category Management** | `categories` | `GET /admin/categories`, `POST /admin/categories`, `PUT /admin/categories/:id` | `/admin/categories` | ✅ Connected | Category hierarchy, slug generation, image thumbnail assignment |
| **Brand Management** | `brands` | `GET /admin/brands`, `POST /admin/brands` | `/admin/brands` | ✅ Connected | Brand logos, descriptions & status toggles |
| **Attribute Management** | `attributes` | `GET /admin/attributes`, `POST /admin/attributes` | `/admin/attributes` | ✅ Connected | Color, size, fabric attribute definitions |
| **Order Management** | `order` | `GET /admin/orders`, `GET /admin/orders/:id` | `/admin/orders`, `/admin/orders/[id]` | ✅ Connected | View all orders, customer details, line items & shipping address |
| **Order Status Workflow** | `order` | `POST /admin/orders/:id/transition` | `/admin/orders/[id]` | ✅ Connected | Status transitions (Pending -> Confirmed -> Packing -> Shipped -> Delivered) |
| **Order Packing Queue** | `packing` | `GET /admin/packing/queue`, `POST /admin/packing/mark-packed` | `/admin/packing` | ✅ Connected | Warehouse packing queue for staff fulfillment |
| **Invoice Generation** | `invoice` | `GET /admin/orders/:id/invoice` | `/admin/orders/[id]/invoice` | ✅ Connected | Printable HTML/PDF tax invoice generation |
| **Customer List & Profiles** | `customer-profile` | `GET /admin/customers`, `GET /admin/customers/:id` | `/admin/customers`, `/admin/customers/[id]` | ✅ Connected | View customer order history, total spent & loyalty points |
| **Coupon & Discount Engine** | `coupon` | `GET /admin/coupons`, `POST /admin/coupons` | `/admin/coupons` | ✅ Connected | Promo code creation, percentage/flat discounts, min order value |
| **Campaign Management** | `campaign` | `GET /admin/campaigns`, `POST /admin/campaigns` | `/admin/campaigns` | ✅ Connected | Seasonal sale campaigns, banner pairings & discount rules |
| **Review Moderation** | `review` | `GET /admin/reviews`, `POST /admin/reviews/:id/approve`, `POST /admin/reviews/:id/reject` | `/admin/reviews` | ✅ Connected | Review approval queue, spam moderation & soft deletion |
| **Role & Access Matrix (RBAC)** | `roles` / `permissions` | `GET /admin/roles`, `GET /admin/access/matrix`, `POST /admin/roles` | `/admin/access/matrix` | ✅ Connected | Granular permission matrix for Manager, Warehouse Staff & Admin |
| **Audit Logs** | `audit` | `GET /admin/audit-logs` | `/admin/audit` | ✅ Connected | System change tracking, user action logging & timestamp history |

---

## 3. Infrastructure & Reliability Summary

1. **Hydration & SSR Compatibility**:
   - `resolveMediaUrl()` in `media-url.ts` normalizes all storage paths to relative `/api/v1/storage/...` links, producing 100% identical SSR and Client HTML strings.
2. **Mobile Network Error (`ERR_CONNECTION_REFUSED`) Prevention**:
   - Request interceptor in `api/client.ts` dynamically resolves `baseURL` to `http://${window.location.hostname}:4000/api/v1` when browsing from mobile IPs.
3. **Guest Wishlist & Login Auto-Sync**:
   - Unauthenticated visitors save items to `localStorage` (`vd_guest_wishlist`). Upon logging in, `POST /wishlist/sync` automatically syncs local items into their database account.
4. **TypeScript & Build Integrity**:
   - `frontend`: Clean compilation (`npx tsc --noEmit` -> 0 errors)
   - `backend`: Clean compilation (`npm run build` -> 0 errors)
