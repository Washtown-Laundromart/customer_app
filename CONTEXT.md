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

Implemented flow:
- Separate `/auth` register/login entry screen
- Main app redirects to `/auth` when no customer token exists
- `/` customer dashboard with request wash CTA, notifications, order summary, profile shortcut, and signout
- `/profile` reusable customer details for courier/order creation
- `/request-wash` pickup details, preferred provider, branch choice, clothing item dropdowns and quantities
- `/orders` branch bill/payment status view where Paystack link appears after branch inspection
- Header bell links to `/notifications`.
- `/notifications` shows in-app notifications such as bill-ready, order update, and branch broadcast messages.
- `/notifications/[id]` shows notification details, bill breakdown when attached, and Paystack payment CTA when available.

Next tasks:
- Replace simulated progress with live `/api/orders` polling or sockets.
- Add real upload endpoint for clothing photos.
- Redirect to `bill.paystackUrl` when backend creates the bill.
