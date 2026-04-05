# Birdie Supply — Design Spec

**Date:** 2026-04-05
**Status:** Draft

## Overview

Birdie Supply is a mobile-first e-commerce website for selling shuttlecocks to the GTA (Greater Toronto Area) market. Single admin, guest checkout only, no online payment — customers pay via e-transfer or cash on pickup.

## Goals & Constraints

- **Minimum running cost:** Vercel free tier (hosting) + Supabase free tier (DB, auth, storage)
- **Small user base:** Local GTA customers, low traffic
- **Mobile-first:** Primary audience browses on phones
- **Single admin:** One account, email/password login via Supabase Auth
- **No customer accounts:** Guest checkout only
- **No online payment:** E-transfer or pay on pickup
- **Product scope:** Shuttlecocks only (feather, nylon categories)

## Architecture

```
Customer (mobile browser)
    |
    v
+---------------------------+
|  Vercel (Next.js App)     |
|  - Storefront pages       |
|  - Admin pages (/admin)   |
|  - API routes             |
+---------------------------+
           |
           v
+---------------------------+
|  Supabase (free tier)     |
|  - PostgreSQL             |
|  - Auth (admin only)      |
|  - Storage (product imgs) |
+---------------------------+
```

- **Next.js App Router** with TypeScript, Tailwind CSS
- **Supabase Auth** for single admin account
- **Supabase Storage** public bucket for product images
- **Supabase PostgreSQL** for products, orders, order items
- **Cart** stored in browser localStorage (no DB needed for browsing)

## Tech Stack

- `next` + `react` — framework
- `@supabase/supabase-js` + `@supabase/ssr` — DB/auth/storage
- `tailwindcss` — styling
- No additional UI libraries

## Database Schema

### products

| Column     | Type      | Notes                                    |
|------------|-----------|------------------------------------------|
| id         | uuid      | PK, default gen_random_uuid()            |
| name       | text      | e.g. "Yonex AS-50 Feather"              |
| description| text      | Product details                          |
| price      | decimal   | CAD                                      |
| image_url  | text      | Points to Supabase Storage               |
| stock      | integer   | Current inventory count                  |
| category   | text      | "feather" or "nylon"                     |
| active     | boolean   | Default true. Hide without deleting      |
| created_at | timestamp | Default now()                            |
| updated_at | timestamp | Default now(), auto-update via trigger    |

### orders

| Column           | Type      | Notes                                    |
|------------------|-----------|------------------------------------------|
| id               | uuid      | PK, default gen_random_uuid()            |
| customer_name    | text      | Required                                 |
| customer_email   | text      | Required                                 |
| customer_phone   | text      | Required                                 |
| delivery_method  | text      | "pickup" or "shipping"                   |
| shipping_address | text      | Nullable, required if delivery_method = "shipping" |
| status           | text      | "pending", "confirmed", "completed", "cancelled" |
| subtotal         | decimal   |                                          |
| shipping_fee     | decimal   | 0 for pickup, flat rate for shipping     |
| total            | decimal   |                                          |
| notes            | text      | Optional customer notes                  |
| created_at       | timestamp | Default now()                            |

### order_items

| Column     | Type    | Notes                        |
|------------|---------|------------------------------|
| id         | uuid    | PK, default gen_random_uuid()|
| order_id   | uuid    | FK -> orders.id              |
| product_id | uuid    | FK -> products.id            |
| quantity   | integer |                              |
| unit_price | decimal | Price at time of order       |

### Row Level Security (RLS)

- **products:** Public read (where active = true), admin-only write
- **orders:** Public insert (customer placing order), admin-only read/update
- **order_items:** Public insert (with order), admin-only read

## Customer Storefront

### Pages

1. **Home (/)** — 2-column product grid, category filter (feather/nylon), sticky cart bar at bottom showing item count + total
2. **Product Detail (/product/[id])** — Large product image, name, price, description, stock status, quantity picker, "Add to Cart" button. Out-of-stock products show disabled button.
3. **Cart (/cart)** — List of cart items with quantity adjustment, remove, subtotal. "Proceed to Checkout" button.
4. **Checkout (/checkout)** — Order summary, contact form (name, email, phone), delivery method toggle (pickup free / shipping $5 flat), shipping address field (if shipping), optional notes, "Place Order" button.
5. **Order Confirmation (/order-confirmation)** — Order number, summary, payment instructions ("E-transfer to [email] or pay cash on pickup").

### Cart Behavior

- Stored in `localStorage` as array of `{ productId, quantity }`
- Persists across page refreshes
- No server-side cart — purely client-side
- Stock is validated server-side at order submission time

## Admin Panel

### Access

- Protected by Supabase Auth (email/password)
- `middleware.ts` redirects unauthenticated users from `/admin/*` to login
- Single admin account, created manually in Supabase dashboard

### Pages

1. **Dashboard (/admin)** — Pending orders count, low stock alerts (< 5 units), recent orders list
2. **Orders (/admin/orders)** — All orders with status filter (pending/confirmed/completed/cancelled). Click into order for detail view.
3. **Order Detail (/admin/orders/[id])** — Full order info, line items, customer contact info, status update buttons (confirm, complete, cancel).
4. **Products (/admin/products)** — All products with stock levels, active/inactive toggle, inline stock +/- adjustment, low stock highlighting.
5. **Add Product (/admin/products/new)** — Form: name, description, price, category, stock, image upload.
6. **Edit Product (/admin/products/[id])** — Same form pre-filled, update any field, replace image.

### Admin is mobile-friendly — manageable from phone.

## Order Flow

1. **Customer places order:** API route validates stock availability, creates `orders` + `order_items` rows. Stock is NOT deducted yet. Customer sees confirmation page with order number + payment instructions.

2. **Admin confirms order:** Admin reviews pending order in dashboard, clicks "Confirm." Stock is deducted. Status moves to "confirmed."

3. **Admin completes order:** After delivery/pickup and payment received, admin marks "Completed."

4. **Cancellation:** Admin can cancel at any stage. If order was confirmed, stock is restored.

```
pending -> confirmed -> completed
   |
   v
cancelled (stock restored if was confirmed)
```

## Delivery Options

- **Pickup:** Free. Customer comes to pickup location (address shown on confirmation).
- **Shipping:** $5 flat rate within GTA. Customer provides shipping address at checkout.

## Notifications

None at launch. Admin checks the dashboard for new orders. Email notifications (e.g. via Resend free tier) can be added later if order volume warrants it.

## Out-of-Stock Handling

- Products with 0 stock show "Out of Stock" on storefront
- "Add to Cart" button is disabled
- Admin can restock anytime from the products page
- Stock is validated server-side when an order is submitted — if stock changed between add-to-cart and checkout, the customer is notified

## Project Structure

```
birdie-supply/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Home — product grid
│   │   ├── product/[id]/page.tsx    # Product detail
│   │   ├── cart/page.tsx            # Cart view
│   │   ├── checkout/page.tsx        # Checkout form
│   │   ├── order-confirmation/page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx             # Dashboard
│   │   │   ├── orders/page.tsx      # Orders list
│   │   │   ├── orders/[id]/page.tsx # Order detail
│   │   │   ├── products/page.tsx    # Product list
│   │   │   ├── products/new/page.tsx
│   │   │   └── products/[id]/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/                  # Shared UI components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser client
│   │   │   ├── server.ts            # Server client
│   │   │   └── middleware.ts        # Auth middleware for /admin
│   │   ├── types.ts                 # DB types
│   │   └── cart.ts                  # localStorage cart logic
│   └── middleware.ts                # Next.js middleware (admin auth check)
├── supabase/
│   └── migrations/                  # SQL migration files
├── public/
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── .env.local                       # Supabase URL + anon key
```

## Hosting & Cost

| Service         | Tier  | Cost | Limits                              |
|-----------------|-------|------|-------------------------------------|
| Vercel          | Hobby | Free | 100GB bandwidth, serverless functions|
| Supabase        | Free  | Free | 500MB DB, 1GB storage, 50K auth MAU |

Total monthly cost: **$0**

Both free tiers are more than sufficient for the projected low-traffic, local-market use case.
