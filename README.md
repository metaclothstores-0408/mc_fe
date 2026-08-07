# MetaCloth Phase 1 — Frontend

React 18 + Vite + Tailwind CSS + Framer Motion frontend for the MetaCloth Phase 1 specification.

## Included

- Responsive desktop/tablet/mobile UI
- Home / marketing page
- Ready-made product catalog
- Search and category filtering
- Product details
- MC Studio customizer
- 40 preset avatars
- Garment / color / size / print-zone selection
- Live frontend pricing
- Cart
- Test checkout
- Local order creation and tracking
- Local profile
- Admin Control Desk preview
- Frontend-only Google / phone OTP mock
- Dark luxury MetaCloth design tokens
- LocalStorage persistence

## Phase 1 guardrails

This frontend intentionally does NOT implement:

- AI image generation
- Face swap
- Custom artwork uploads
- Custom typography editor
- Multi-layer text canvas
- Multi-currency
- Complex coupon engine
- Multi-vendor marketplace

## Run

Requirements: Node.js 18+ recommended.

```bash
npm install
npm run dev
```

Then open the URL printed by Vite, normally:

http://localhost:5173

## Backend integration boundary

The current mock data lives in:

`src/data/mock.js`

Local persistence lives in:

`src/lib/storage.js`

The future Spring Boot API can replace these two boundaries without changing the visual UI structure.

Expected backend resources from the Phase 1 contract:

- `/api/v1/auth/google`
- `/api/v1/auth/otp/send`
- `/api/v1/auth/otp/verify`
- `/api/v1/avatars`
- `/api/v1/products/customizable`
- `/api/v1/customizer/preview`
- `/api/v1/orders`
- `/api/v1/orders/my-orders`
- `/api/v1/orders/{id}/track`
- `/api/v1/admin/dashboard/stats`
- `/api/v1/admin/orders`
- `/api/v1/admin/orders/{id}/status`

## Notes

Image URLs currently use public placeholder/avatar services so the frontend can run without an asset pipeline. Replace them with S3/Cloudinary URLs when the backend/assets are ready.
