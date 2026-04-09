# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

TRT Birdies (`birdie-supply/`) is a bilingual (English/Chinese) e-commerce storefront for selling badminton shuttlecocks in the Greater Toronto Area. It includes a public shop and a password-protected admin panel.

## Commands

All commands run from the `birdie-supply/` directory:

- **Dev server:** `npm run dev` (Next.js on localhost:3000)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint 9 flat config)
- **No test suite exists.** Verify changes by building and manual testing.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19 and TypeScript
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **Database:** Supabase (Postgres with RLS). Schema in `supabase/migrations/`
- **Auth:** Supabase Auth — admin-only, checked in `src/proxy.ts`
- **i18n:** `next-intl` — locales `en` and `zh`, messages in `src/messages/{en,zh}.json`
- **Email:** Resend — sends admin notification on new orders (fire-and-forget)
- **Analytics:** Vercel Analytics + Speed Insights
- **Deployment:** Vercel

## Architecture

### Routing

All pages are under `src/app/[locale]/` for i18n support. The proxy (`src/proxy.ts`) handles two concerns:
1. Locale detection/redirect via `next-intl` middleware
2. Admin auth gate — redirects unauthenticated users to `/{locale}/admin/login`

### Key Paths

- **Public storefront:** `/[locale]/` (home), `/[locale]/product/[id]`, `/[locale]/cart`, `/[locale]/checkout`, `/[locale]/order-confirmation`
- **Admin panel:** `/[locale]/admin/` (dashboard), `/[locale]/admin/orders`, `/[locale]/admin/products`
- **API routes:** `src/app/api/orders/route.ts` (public POST), `src/app/api/admin/` (authenticated CRUD for products and orders)

### Data Flow

- **Cart:** Client-side only via `localStorage` (`src/lib/cart.ts`), exposed through React Context (`src/components/cart-provider.tsx`)
- **Orders:** POST to `/api/orders` validates stock, inserts order + order_items into Supabase, fires email notification via Resend
- **Products:** Admin CRUD through `/api/admin/products` routes. Products have `sort_order` for manual ranking and `active` flag for visibility
- **Supabase clients:** `src/lib/supabase/server.ts` (server components/routes) and `src/lib/supabase/client.ts` (browser)

### Database Schema (3 tables)

- `products` — shuttlecocks with category (`feather`/`nylon`), stock, sort_order, active flag
- `orders` — customer info, delivery method (`pickup`/`delivery`), status workflow (`pending` → `confirmed` → `completed` | `cancelled`)
- `order_items` — line items linking orders to products

RLS policies: public can read active products and place orders; only authenticated users (admin) can manage products and view/update orders.

### i18n

Import `Link`, `redirect`, `usePathname`, `useRouter` from `@/i18n/routing` (not from `next/navigation`) to preserve locale in URLs. Translation keys are in `src/messages/{en,zh}.json`.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection
- `RESEND_API_KEY` — email notifications (optional, gracefully skipped if missing)
