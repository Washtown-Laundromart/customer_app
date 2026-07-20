# FreshFold Customer App Context

This is the customer-facing Next.js app.

Stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand for local flow state
- shadcn-style local UI primitives in `components/ui`
- Lucide React icons
- jsPDF for browser-side receipt PDF generation

Backend connection:
- Browser code calls the same-origin Next.js proxy at `/api/freshfold`; it should not call Railway directly.
- Set `BACKEND_API_BASE_URL` in Vercel/local env for the proxy route. It can fall back to `NEXT_PUBLIC_API_BASE_URL` for compatibility.
- During local development the proxy defaults to `http://localhost:4000` if no backend URL env is set.
- Customer app calls only the FreshFold backend. Courier providers and Paystack secret operations stay on the backend.
- Local `.env` currently points to the Railway backend URL for live integration testing.
- `npm run dev` and `npm run start` do not pin port 3000; Next can select another open port when 3000 is busy.
- On Vercel, using the `/api/freshfold` proxy avoids browser CORS because Vercel calls Railway server-to-server.

Implemented flow:
- Separate `/auth` register/login entry screen
- Main app redirects to `/auth` when no customer token exists
- `/auth` calls live backend register/login endpoints, stores returned user details, and no longer pre-fills mock form values.
- `/auth` includes customer forgot-password recovery using email OTP. It calls `POST /api/auth/forgot-password/request`, then accepts the 6-digit OTP plus a new password and calls `POST /api/auth/forgot-password/reset`.
- `/` customer dashboard loads live customer orders from `/api/orders`, keeps profile details from storage/API, and shows readable toast errors if order loading fails.
- `/profile` loads and saves profile details through `/api/auth/me`; `defaultAddress` is persisted on the backend instead of only in browser storage.
- `/request-wash` loads live branches from `/api/branches`, refreshes the logged-in user's profile from `/api/auth/me`, submits live orders to `/api/orders`, and uses only that user's backend `defaultAddress` as the pickup address.
- Auth must not copy `defaultAddress` from a previous `localStorage` profile when a different user signs in; each customer's pickup address belongs only to their backend user record.
- `/orders` loads live customer orders from `/api/orders`; Paystack link appears after branch inspection and bill creation. When Paystack redirects back with `reference` or `trxref`, the page calls `POST /api/orders/payments/verify`, then updates the order to paid state locally.
- `/orders` polls live orders every 15 seconds so Paystack verification/status changes appear without manual refresh. It lists all customer orders with the selected/current order at the top and defaults to the newest order.
- `/orders` prefers freshly fetched backend orders over the local just-created order so courier `DeliveryJob` rows and tracking links are not hidden by stale client state.
- Header bell links to `/notifications`.
- `/notifications` shows live in-app notifications such as bill-ready, order update, and branch broadcast messages. It starts with a loading state and no longer flashes demo notifications for real users.
- `/notifications/[id]` shows notification details, bill breakdown when attached, and Paystack payment CTA when available. Real users no longer fall back to demo notification content.
- `/receipts/[orderId]` is the persistent receipt document page after payment. It shows payment success, total, payment/order metadata, inspected line items, delivery fee, and total paid, with an always-available PDF download button.
- Customer order and notification bill views show admin-inspected line items, unit prices, cleaning subtotal, return/courier delivery fee, and total.
- Customer `/request-wash` includes Shipbubble as the default preferred courier provider and sends `preferredProvider` to the backend. For home-delivery requests, the backend immediately attempts pickup dispatch and returns the order with any courier tracking details. Customer `/orders` shows courier delivery jobs with provider, leg, status, external reference, and tracking links returned by providers such as Shipbubble.
- App-wide toast notifications live in `components/toast-provider.tsx` and should use plain-language copy for non-technical customers.
- API errors are mapped through `toErrorMessage`/`friendlyErrorMessage` in `lib/api.ts`; keep backend/deployment failures understandable for customers.
- Network failures from the frontend should remain customer-readable; backend proxy settings should be checked in Vercel/Railway logs.

Next tasks:
- Replace simulated progress with live `/api/orders` polling or sockets.
- Add real upload endpoint for clothing photos.
- Configure Paystack webhook in production for server-to-server payment confirmation in addition to the customer return verification fallback.
- Add an address field during onboarding/registration if pickup address should be captured before the profile page.
