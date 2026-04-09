# TRT Birdies

A bilingual (English/Chinese) e-commerce storefront for selling badminton shuttlecocks in the Greater Toronto Area. Includes a public shop and a password-protected admin panel.

**Live site:** [trtbirdies.com](https://trtbirdies.com)

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (Postgres with Row-Level Security)
- **Auth:** Supabase Auth (admin-only)
- **i18n:** next-intl (English & Chinese)
- **Email:** Resend (order notifications)
- **Analytics:** Vercel Analytics + Speed Insights
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project
- (Optional) A Resend API key for email notifications

### Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
RESEND_API_KEY=your-resend-api-key
```

### Development

```bash
cd birdie-supply
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
birdie-supply/
├── src/
│   ├── app/
│   │   ├── [locale]/          # i18n routes (en, zh)
│   │   │   ├── page.tsx       # Home / product listing
│   │   │   ├── product/[id]/  # Product detail
│   │   │   ├── cart/          # Shopping cart
│   │   │   ├── checkout/      # Checkout flow
│   │   │   ├── admin/         # Admin panel (orders, products)
│   │   │   └── privacy/       # Privacy policy
│   │   └── api/               # API routes (orders, admin CRUD)
│   ├── components/            # Shared UI components
│   ├── lib/                   # Utilities (Supabase clients, cart, email)
│   ├── i18n/                  # i18n config (routing, request)
│   └── messages/              # Translation files (en.json, zh.json)
├── public/                    # Static assets
└── supabase/                  # Database migrations
```

## Features

- **Public Storefront:** Browse products by category (feather/nylon), add to cart, checkout with pickup or delivery
- **Cart:** Client-side cart persisted in localStorage
- **Order Flow:** Stock validation, order placement, admin email notification
- **Admin Panel:** Manage products (CRUD, image upload, stock, sort order), view and update orders
- **Bilingual:** Full English and Chinese support with locale-aware routing
