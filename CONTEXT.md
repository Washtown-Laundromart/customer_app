# FreshFold Customer App Context

This is the customer-facing Next.js app.

Stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand for local flow state
- shadcn-style local UI primitives in `components/ui`
- Lucide React icons

Backend connection:
- Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`.
- During local development it defaults to `http://localhost:4000`.
- Customer app calls only the FreshFold backend. Courier providers and Paystack secret operations stay on the backend.
- Local `.env` currently points to the Railway backend URL for live integration testing.
- `npm run dev` and `npm run start` do not pin port 3000; Next can select another open port when 3000 is busy.

Implemented flow:
- Separate `/auth` register/login entry screen
- Main app redirects to `/auth` when no customer token exists
- `/auth` calls live backend register/login endpoints, stores returned user details, and no longer pre-fills mock form values.
- `/` customer dashboard loads live customer orders from `/api/orders`, keeps profile details from storage/API, and shows readable toast errors if order loading fails.
- `/profile` loads and saves profile details through `/api/auth/me`; `defaultAddress` is persisted on the backend instead of only in browser storage.
- `/request-wash` loads live branches from `/api/branches`, submits live orders to `/api/orders`, and uses the saved/default pickup address when available.
- `/orders` loads live customer orders from `/api/orders`; Paystack link appears after branch inspection and bill creation.
- Header bell links to `/notifications`.
- `/notifications` shows in-app notifications such as bill-ready, order update, and branch broadcast messages.
- `/notifications/[id]` shows notification details, bill breakdown when attached, and Paystack payment CTA when available.
- App-wide toast notifications live in `components/toast-provider.tsx` and should use plain-language copy for non-technical customers.
- API errors are mapped through `toErrorMessage`/`friendlyErrorMessage` in `lib/api.ts`; keep backend/deployment failures understandable for customers.

Next tasks:
- Replace simulated progress with live `/api/orders` polling or sockets.
- Add real upload endpoint for clothing photos.
- Redirect to `bill.paystackUrl` when backend creates the bill.
- Add an address field during onboarding/registration if pickup address should be captured before the profile page.
