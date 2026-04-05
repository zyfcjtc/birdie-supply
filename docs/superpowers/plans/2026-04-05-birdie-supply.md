# Birdie Supply Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (EN/ZH), mobile-first e-commerce site for selling shuttlecocks in the GTA, with guest checkout (no online payment) and a single-admin panel.

**Architecture:** Next.js App Router on Vercel (free tier) with Supabase (free tier) for PostgreSQL, auth, and image storage. `next-intl` handles route-based i18n (`/en/...`, `/zh/...`). Cart lives in localStorage; orders go to Supabase with admin confirmation before stock deduction.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, `@supabase/supabase-js`, `@supabase/ssr`, `next-intl`

---

## File Map

```
birdie-supply/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx                      # Root layout with header, cart provider, locale
│   │   │   ├── page.tsx                        # Home — product grid
│   │   │   ├── product/[id]/page.tsx           # Product detail
│   │   │   ├── cart/page.tsx                   # Cart page
│   │   │   ├── checkout/page.tsx               # Checkout form
│   │   │   ├── order-confirmation/page.tsx     # Order placed confirmation
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx                  # Admin layout (auth guard, admin nav)
│   │   │   │   ├── login/page.tsx              # Admin login
│   │   │   │   ├── page.tsx                    # Dashboard
│   │   │   │   ├── orders/page.tsx             # Orders list
│   │   │   │   ├── orders/[id]/page.tsx        # Order detail
│   │   │   │   ├── products/page.tsx           # Product list
│   │   │   │   ├── products/new/page.tsx       # Add product
│   │   │   │   └── products/[id]/page.tsx      # Edit product
│   │   │   └── not-found.tsx                   # 404
│   │   └── globals.css                         # Tailwind imports + base styles
│   ├── components/
│   │   ├── header.tsx                          # Site header with logo, lang toggle, cart icon
│   │   ├── product-card.tsx                    # Product card for grid
│   │   ├── category-filter.tsx                 # Feather/nylon filter tabs
│   │   ├── cart-bar.tsx                        # Sticky bottom cart bar
│   │   ├── quantity-picker.tsx                 # +/- quantity control
│   │   ├── cart-provider.tsx                   # React context for cart state
│   │   ├── delivery-toggle.tsx                 # Pickup/shipping toggle
│   │   ├── language-toggle.tsx                 # EN/ZH switcher
│   │   ├── admin/
│   │   │   ├── admin-nav.tsx                   # Admin sidebar/bottom nav
│   │   │   ├── order-status-badge.tsx          # Colored status badge
│   │   │   ├── order-status-actions.tsx        # Confirm/complete/cancel buttons
│   │   │   ├── product-form.tsx                # Shared add/edit product form
│   │   │   ├── stock-adjuster.tsx              # Inline +/- stock control
│   │   │   └── image-upload.tsx                # Product image upload
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                       # createBrowserClient
│   │   │   └── server.ts                       # createServerClient
│   │   ├── types.ts                            # DB row types
│   │   └── cart.ts                             # localStorage cart helpers
│   ├── i18n/
│   │   ├── request.ts                          # next-intl getRequestConfig
│   │   └── routing.ts                          # defineRouting (locales, defaultLocale)
│   ├── messages/
│   │   ├── en.json                             # English UI strings
│   │   └── zh.json                             # Chinese UI strings
│   └── middleware.ts                           # Locale routing + admin auth redirect
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql              # Tables, RLS, trigger
├── public/
│   └── favicon.ico
├── next.config.ts                              # next-intl plugin config
├── tailwind.config.ts
├── package.json
├── tsconfig.json
└── .env.local                                  # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

### Task 1: Project Scaffolding & Dependencies

**Files:**
- Create: `birdie-supply/package.json`
- Create: `birdie-supply/next.config.ts`
- Create: `birdie-supply/tsconfig.json`
- Create: `birdie-supply/tailwind.config.ts`
- Create: `birdie-supply/src/app/globals.css`
- Create: `birdie-supply/.env.local`
- Create: `birdie-supply/.gitignore`

- [ ] **Step 1: Initialize Next.js project**

Run from `/Users/yafanzhang/Workspace/shuttlecock-shop`:

```bash
npx create-next-app@latest birdie-supply \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-import-alias \
  --turbopack
```

When prompted for import alias, accept the default `@/*`.

- [ ] **Step 2: Install dependencies**

```bash
cd birdie-supply
npm install @supabase/supabase-js @supabase/ssr next-intl
```

- [ ] **Step 3: Create `.env.local`**

Create `birdie-supply/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

These are placeholder values. The user will fill in real values after creating the Supabase project.

- [ ] **Step 4: Verify the dev server starts**

```bash
npm run dev
```

Expected: Server starts on `http://localhost:3000` with the default Next.js page. Kill the server after verifying.

- [ ] **Step 5: Commit**

```bash
git add birdie-supply/
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

### Task 2: Supabase Database Schema

**Files:**
- Create: `birdie-supply/supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Write the migration SQL**

Create `birdie-supply/supabase/migrations/001_initial_schema.sql`:

```sql
-- Products table
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price decimal(10, 2) not null,
  image_url text,
  stock integer not null default 0,
  category text not null check (category in ('feather', 'nylon')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- Orders table
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_method text not null check (delivery_method in ('pickup', 'shipping')),
  shipping_address text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  subtotal decimal(10, 2) not null,
  shipping_fee decimal(10, 2) not null default 0,
  total decimal(10, 2) not null,
  notes text,
  created_at timestamptz not null default now()
);

-- Order items table
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check (quantity > 0),
  unit_price decimal(10, 2) not null
);

-- Indexes
create index idx_products_active_category on products(active, category);
create index idx_orders_status on orders(status);
create index idx_order_items_order_id on order_items(order_id);

-- RLS
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Products: anyone can read active products
create policy "Public can read active products"
  on products for select
  using (active = true);

-- Products: only authenticated (admin) can insert/update/delete
create policy "Admin can manage products"
  on products for all
  to authenticated
  using (true)
  with check (true);

-- Orders: anyone can insert (place an order)
create policy "Public can place orders"
  on orders for insert
  with check (true);

-- Orders: only authenticated (admin) can read and update
create policy "Admin can read orders"
  on orders for select
  to authenticated
  using (true);

create policy "Admin can update orders"
  on orders for update
  to authenticated
  using (true)
  with check (true);

-- Order items: anyone can insert (with their order)
create policy "Public can insert order items"
  on order_items for insert
  with check (true);

-- Order items: only authenticated (admin) can read
create policy "Admin can read order items"
  on order_items for select
  to authenticated
  using (true);

-- Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Anyone can read product images
create policy "Public can read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only authenticated (admin) can upload/delete product images
create policy "Admin can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "Admin can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

create policy "Admin can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');
```

- [ ] **Step 2: Commit**

```bash
git add birdie-supply/supabase/
git commit -m "feat: add database migration with tables, RLS, and storage bucket"
```

**Note:** To apply this migration, the user runs it in the Supabase SQL Editor (Dashboard > SQL Editor > paste and run). Alternatively, if using Supabase CLI: `supabase db push`.

---

### Task 3: Supabase Clients & TypeScript Types

**Files:**
- Create: `birdie-supply/src/lib/supabase/client.ts`
- Create: `birdie-supply/src/lib/supabase/server.ts`
- Create: `birdie-supply/src/lib/types.ts`

- [ ] **Step 1: Create browser Supabase client**

Create `birdie-supply/src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create server Supabase client**

Create `birdie-supply/src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from Server Component — ignored
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create TypeScript types**

Create `birdie-supply/src/lib/types.ts`:

```typescript
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  stock: number;
  category: "feather" | "nylon";
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_method: "pickup" | "shipping";
  shipping_address: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  subtotal: number;
  shipping_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type OrderWithItems = Order & {
  order_items: (OrderItem & { product: Pick<Product, "name" | "image_url"> })[];
};

export type CartItem = {
  productId: string;
  quantity: number;
};
```

- [ ] **Step 4: Commit**

```bash
git add birdie-supply/src/lib/
git commit -m "feat: add Supabase clients and TypeScript types"
```

---

### Task 4: i18n Setup (next-intl)

**Files:**
- Create: `birdie-supply/src/i18n/routing.ts`
- Create: `birdie-supply/src/i18n/request.ts`
- Create: `birdie-supply/src/messages/en.json`
- Create: `birdie-supply/src/messages/zh.json`
- Modify: `birdie-supply/next.config.ts`
- Create: `birdie-supply/src/middleware.ts`

- [ ] **Step 1: Define routing config**

Create `birdie-supply/src/i18n/routing.ts`:

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh"],
  defaultLocale: "en",
});
```

- [ ] **Step 2: Define request config**

Create `birdie-supply/src/i18n/request.ts`:

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "zh")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Create English translations**

Create `birdie-supply/src/messages/en.json`:

```json
{
  "site": {
    "name": "Birdie Supply",
    "tagline": "GTA's Shuttlecock Shop"
  },
  "nav": {
    "home": "Home",
    "cart": "Cart",
    "admin": "Admin"
  },
  "product": {
    "addToCart": "Add to Cart",
    "outOfStock": "Out of Stock",
    "inStock": "In Stock",
    "tubes": "tubes",
    "category": {
      "all": "All",
      "feather": "Feather",
      "nylon": "Nylon"
    }
  },
  "cart": {
    "title": "Your Cart",
    "empty": "Your cart is empty",
    "subtotal": "Subtotal",
    "checkout": "Proceed to Checkout",
    "remove": "Remove",
    "items": "items",
    "continueShopping": "Continue Shopping"
  },
  "checkout": {
    "title": "Checkout",
    "contactInfo": "Your Info",
    "name": "Name",
    "email": "Email",
    "phone": "Phone",
    "delivery": "Delivery",
    "pickup": "Pickup",
    "pickupDesc": "Free",
    "shipping": "Shipping",
    "shippingDesc": "$5 flat rate (GTA)",
    "shippingAddress": "Shipping Address",
    "notes": "Order Notes (optional)",
    "placeOrder": "Place Order",
    "shippingFee": "Shipping",
    "total": "Total",
    "free": "Free"
  },
  "confirmation": {
    "title": "Order Placed!",
    "orderNumber": "Order Number",
    "paymentInstructions": "Payment Instructions",
    "etransfer": "Send e-transfer to",
    "pickup": "Or pay cash on pickup",
    "backHome": "Back to Home"
  },
  "admin": {
    "login": {
      "title": "Admin Login",
      "email": "Email",
      "password": "Password",
      "submit": "Sign In",
      "error": "Invalid email or password"
    },
    "nav": {
      "dashboard": "Dashboard",
      "orders": "Orders",
      "products": "Products",
      "logout": "Logout"
    },
    "dashboard": {
      "title": "Dashboard",
      "pendingOrders": "Pending Orders",
      "lowStock": "Low Stock Alerts",
      "recentOrders": "Recent Orders"
    },
    "orders": {
      "title": "Orders",
      "all": "All",
      "pending": "Pending",
      "confirmed": "Confirmed",
      "completed": "Completed",
      "cancelled": "Cancelled",
      "noOrders": "No orders found",
      "confirm": "Confirm",
      "complete": "Complete",
      "cancel": "Cancel",
      "orderDetails": "Order Details",
      "customer": "Customer",
      "delivery": "Delivery",
      "items": "Items",
      "status": "Status"
    },
    "products": {
      "title": "Products",
      "addProduct": "Add Product",
      "editProduct": "Edit Product",
      "name": "Name",
      "description": "Description",
      "price": "Price (CAD)",
      "category": "Category",
      "stock": "Stock",
      "image": "Image",
      "active": "Active",
      "save": "Save",
      "saving": "Saving...",
      "noProducts": "No products yet"
    }
  }
}
```

- [ ] **Step 4: Create Chinese translations**

Create `birdie-supply/src/messages/zh.json`:

```json
{
  "site": {
    "name": "Birdie Supply",
    "tagline": "大多地区羽毛球专卖"
  },
  "nav": {
    "home": "首页",
    "cart": "购物车",
    "admin": "管理"
  },
  "product": {
    "addToCart": "加入购物车",
    "outOfStock": "缺货",
    "inStock": "有货",
    "tubes": "筒",
    "category": {
      "all": "全部",
      "feather": "鹅毛球",
      "nylon": "尼龙球"
    }
  },
  "cart": {
    "title": "购物车",
    "empty": "购物车是空的",
    "subtotal": "小计",
    "checkout": "去结账",
    "remove": "移除",
    "items": "件商品",
    "continueShopping": "继续购物"
  },
  "checkout": {
    "title": "结账",
    "contactInfo": "联系信息",
    "name": "姓名",
    "email": "邮箱",
    "phone": "电话",
    "delivery": "配送方式",
    "pickup": "自取",
    "pickupDesc": "免费",
    "shipping": "配送",
    "shippingDesc": "GTA地区统一$5",
    "shippingAddress": "配送地址",
    "notes": "备注（选填）",
    "placeOrder": "提交订单",
    "shippingFee": "运费",
    "total": "合计",
    "free": "免费"
  },
  "confirmation": {
    "title": "订单已提交！",
    "orderNumber": "订单号",
    "paymentInstructions": "支付方式",
    "etransfer": "请e-transfer至",
    "pickup": "或自取时现金支付",
    "backHome": "返回首页"
  },
  "admin": {
    "login": {
      "title": "管理员登录",
      "email": "邮箱",
      "password": "密码",
      "submit": "登录",
      "error": "邮箱或密码错误"
    },
    "nav": {
      "dashboard": "仪表盘",
      "orders": "订单",
      "products": "商品",
      "logout": "退出"
    },
    "dashboard": {
      "title": "仪表盘",
      "pendingOrders": "待处理订单",
      "lowStock": "库存预警",
      "recentOrders": "最近订单"
    },
    "orders": {
      "title": "订单管理",
      "all": "全部",
      "pending": "待处理",
      "confirmed": "已确认",
      "completed": "已完成",
      "cancelled": "已取消",
      "noOrders": "暂无订单",
      "confirm": "确认",
      "complete": "完成",
      "cancel": "取消",
      "orderDetails": "订单详情",
      "customer": "客户",
      "delivery": "配送",
      "items": "商品",
      "status": "状态"
    },
    "products": {
      "title": "商品管理",
      "addProduct": "添加商品",
      "editProduct": "编辑商品",
      "name": "名称",
      "description": "描述",
      "price": "价格 (CAD)",
      "category": "分类",
      "stock": "库存",
      "image": "图片",
      "active": "上架",
      "save": "保存",
      "saving": "保存中...",
      "noProducts": "暂无商品"
    }
  }
}
```

- [ ] **Step 5: Update next.config.ts**

Replace the contents of `birdie-supply/next.config.ts` with:

```typescript
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 6: Create middleware**

Create `birdie-supply/src/middleware.ts`:

```typescript
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if accessing admin routes (match /en/admin or /zh/admin)
  const adminMatch = pathname.match(/^\/(en|zh)\/admin(?!\/login)(.*)/);

  if (adminMatch) {
    // Create Supabase client to check auth
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const locale = adminMatch[1];
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Run intl middleware for locale handling
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 7: Verify dev server starts with i18n**

```bash
cd birdie-supply && npm run dev
```

Expected: Server starts. Visiting `http://localhost:3000` redirects to `/en`. Kill the server after verifying.

- [ ] **Step 8: Commit**

```bash
git add birdie-supply/src/i18n/ birdie-supply/src/messages/ birdie-supply/src/middleware.ts birdie-supply/next.config.ts
git commit -m "feat: add i18n setup with English and Chinese translations"
```

---

### Task 5: Cart Logic (localStorage)

**Files:**
- Create: `birdie-supply/src/lib/cart.ts`
- Create: `birdie-supply/src/components/cart-provider.tsx`

- [ ] **Step 1: Create cart helpers**

Create `birdie-supply/src/lib/cart.ts`:

```typescript
import { CartItem } from "./types";

const CART_KEY = "birdie-supply-cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(productId: string, quantity: number): CartItem[] {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  saveCart(cart);
  return cart;
}

export function updateQuantity(productId: string, quantity: number): CartItem[] {
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter((item) => item.productId !== productId);
  } else {
    const existing = cart.find((item) => item.productId === productId);
    if (existing) {
      existing.quantity = quantity;
    }
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: string): CartItem[] {
  const cart = getCart().filter((item) => item.productId !== productId);
  saveCart(cart);
  return cart;
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
}

export function getCartTotal(
  items: CartItem[],
  prices: Record<string, number>
): number {
  return items.reduce(
    (total, item) => total + (prices[item.productId] ?? 0) * item.quantity,
    0
  );
}
```

- [ ] **Step 2: Create cart context provider**

Create `birdie-supply/src/components/cart-provider.tsx`:

```typescript
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { CartItem } from "@/lib/types";
import * as cartLib from "@/lib/cart";

type CartContextType = {
  items: CartItem[];
  addItem: (productId: string, quantity: number) => void;
  updateItem: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalItems: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(cartLib.getCart());
  }, []);

  const addItem = useCallback((productId: string, quantity: number) => {
    setItems(cartLib.addToCart(productId, quantity));
  }, []);

  const updateItem = useCallback((productId: string, quantity: number) => {
    setItems(cartLib.updateQuantity(productId, quantity));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(cartLib.removeFromCart(productId));
  }, []);

  const clear = useCallback(() => {
    cartLib.clearCart();
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext value={{ items, addItem, updateItem, removeItem, clear, totalItems }}>
      {children}
    </CartContext>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
```

- [ ] **Step 3: Commit**

```bash
git add birdie-supply/src/lib/cart.ts birdie-supply/src/components/cart-provider.tsx
git commit -m "feat: add cart logic with localStorage and React context"
```

---

### Task 6: Layout, Header & Shared Components

**Files:**
- Create: `birdie-supply/src/components/header.tsx`
- Create: `birdie-supply/src/components/language-toggle.tsx`
- Create: `birdie-supply/src/components/cart-bar.tsx`
- Create: `birdie-supply/src/components/quantity-picker.tsx`
- Create: `birdie-supply/src/components/category-filter.tsx`
- Create: `birdie-supply/src/app/[locale]/layout.tsx`
- Modify: `birdie-supply/src/app/globals.css`

- [ ] **Step 1: Create language toggle**

Create `birdie-supply/src/components/language-toggle.tsx`:

```typescript
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale() {
    const newLocale = locale === "en" ? "zh" : "en";
    // Replace the locale prefix in the pathname
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  }

  return (
    <button
      onClick={switchLocale}
      className="text-sm font-medium px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
    >
      {locale === "en" ? "中文" : "EN"}
    </button>
  );
}
```

- [ ] **Step 2: Create header**

Create `birdie-supply/src/components/header.tsx`:

```typescript
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LanguageToggle } from "./language-toggle";

export function Header() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex flex-col">
          <span className="text-lg font-bold text-gray-900">
            {t("site.name")}
          </span>
          <span className="text-xs text-gray-500">{t("site.tagline")}</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create sticky cart bar**

Create `birdie-supply/src/components/cart-bar.tsx`:

```typescript
"use client";

import { useCart } from "./cart-provider";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function CartBar() {
  const { items, totalItems } = useCart();
  const t = useTranslations();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-emerald-600 text-white safe-bottom">
      <Link
        href="/cart"
        className="block max-w-lg mx-auto px-4 py-3 flex items-center justify-between"
      >
        <span className="text-sm font-semibold">
          🛒 {t("nav.cart")} ({totalItems} {t("cart.items")})
        </span>
        <span className="text-sm font-bold">{t("cart.checkout")} →</span>
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Create quantity picker**

Create `birdie-supply/src/components/quantity-picker.tsx`:

```typescript
"use client";

type QuantityPickerProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function QuantityPicker({
  value,
  onChange,
  min = 1,
  max = 99,
}: QuantityPickerProps) {
  return (
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
      >
        −
      </button>
      <span className="px-4 py-2 text-center min-w-[3rem] font-medium">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Create category filter**

Create `birdie-supply/src/components/category-filter.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";

type CategoryFilterProps = {
  selected: string;
  onChange: (category: string) => void;
};

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const t = useTranslations("product.category");
  const categories = ["all", "feather", "nylon"] as const;

  return (
    <div className="flex gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected === cat
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {t(cat)}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create i18n routing helpers**

Create `birdie-supply/src/i18n/routing.ts` needs a navigation export. Update it to:

```typescript
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "zh"],
  defaultLocale: "en",
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

- [ ] **Step 7: Create root locale layout**

Delete the default `birdie-supply/src/app/layout.tsx` and `birdie-supply/src/app/page.tsx` that were created by `create-next-app`.

Create `birdie-supply/src/app/[locale]/layout.tsx`:

```typescript
import { NextIntlClientProvider, useMessages } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CartProvider } from "@/components/cart-provider";
import { Header } from "@/components/header";
import { CartBar } from "@/components/cart-bar";
import "@/app/globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "zh")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <CartProvider>
            <Header />
            <main className="max-w-lg mx-auto px-4 pb-20">{children}</main>
            <CartBar />
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Update globals.css**

Replace `birdie-supply/src/app/globals.css` with:

```css
@import "tailwindcss";

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

- [ ] **Step 9: Commit**

```bash
git add birdie-supply/src/
git commit -m "feat: add layout, header, language toggle, cart bar, and shared components"
```

---

### Task 7: Home Page — Product Grid

**Files:**
- Create: `birdie-supply/src/components/product-card.tsx`
- Create: `birdie-supply/src/app/[locale]/page.tsx`

- [ ] **Step 1: Create product card**

Create `birdie-supply/src/components/product-card.tsx`:

```typescript
import { Product } from "@/lib/types";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("product");

  return (
    <Link
      href={`/product/${product.id}`}
      className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-100 relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🪶
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {t("outOfStock")}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {t(`category.${product.category}`)}
        </p>
        <p className="text-emerald-600 font-bold mt-1">
          ${product.price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create home page**

Create `birdie-supply/src/app/[locale]/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types";
import { setRequestLocale } from "next-intl/server";
import { HomeContent } from "./home-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  return <HomeContent products={(products as Product[]) ?? []} />;
}
```

- [ ] **Step 3: Create home content (client component for filtering)**

Create `birdie-supply/src/app/[locale]/home-content.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { CategoryFilter } from "@/components/category-filter";
import { useTranslations } from "next-intl";

type Props = {
  products: Product[];
};

export function HomeContent({ products }: Props) {
  const [category, setCategory] = useState("all");
  const t = useTranslations();

  const filtered =
    category === "all"
      ? products
      : products.filter((p) => p.category === category);

  return (
    <div className="py-4">
      <div className="mb-4">
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No products found</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add birdie-supply/src/
git commit -m "feat: add home page with product grid and category filter"
```

---

### Task 8: Product Detail Page

**Files:**
- Create: `birdie-supply/src/app/[locale]/product/[id]/page.tsx`
- Create: `birdie-supply/src/app/[locale]/product/[id]/product-detail.tsx`

- [ ] **Step 1: Create product detail server page**

Create `birdie-supply/src/app/[locale]/product/[id]/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProductDetail } from "./product-detail";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .single();

  if (!product) notFound();

  return <ProductDetail product={product as Product} />;
}
```

- [ ] **Step 2: Create product detail client component**

Create `birdie-supply/src/app/[locale]/product/[id]/product-detail.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { useCart } from "@/components/cart-provider";
import { QuantityPicker } from "@/components/quantity-picker";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

type Props = {
  product: Product;
};

export function ProductDetail({ product }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const t = useTranslations();

  function handleAdd() {
    addItem(product.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const inStock = product.stock > 0;

  return (
    <div className="py-4">
      <Link href="/" className="text-emerald-600 text-sm mb-4 inline-block">
        ← {t("nav.home")}
      </Link>

      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🪶
          </div>
        )}
      </div>

      <h1 className="text-xl font-bold">{product.name}</h1>
      <p className="text-2xl font-bold text-emerald-600 mt-1">
        ${product.price.toFixed(2)}
      </p>

      {inStock ? (
        <p className="text-sm text-emerald-600 mt-1">
          ✓ {t("product.inStock")} ({product.stock} {t("product.tubes")})
        </p>
      ) : (
        <p className="text-sm text-red-500 mt-1">{t("product.outOfStock")}</p>
      )}

      <p className="text-sm text-gray-600 mt-4 leading-relaxed">
        {product.description}
      </p>

      {inStock && (
        <div className="flex items-center gap-3 mt-6">
          <QuantityPicker
            value={quantity}
            onChange={setQuantity}
            max={product.stock}
          />
          <button
            onClick={handleAdd}
            className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            {added ? "✓" : t("product.addToCart")}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add birdie-supply/src/app/
git commit -m "feat: add product detail page with add-to-cart"
```

---

### Task 9: Cart Page

**Files:**
- Create: `birdie-supply/src/app/[locale]/cart/page.tsx`

- [ ] **Step 1: Create cart page**

Create `birdie-supply/src/app/[locale]/cart/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/lib/types";
import { QuantityPicker } from "@/components/quantity-picker";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function CartPage() {
  const { items, updateItem, removeItem } = useCart();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const t = useTranslations();

  useEffect(() => {
    async function fetchProducts() {
      if (items.length === 0) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .in(
          "id",
          items.map((i) => i.productId)
        );
      if (data) {
        const map: Record<string, Product> = {};
        data.forEach((p) => (map[p.id] = p as Product));
        setProducts(map);
      }
      setLoading(false);
    }
    fetchProducts();
  }, [items]);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 mb-4">{t("cart.empty")}</p>
        <Link
          href="/"
          className="text-emerald-600 font-medium hover:underline"
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => {
    const product = products[item.productId];
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  return (
    <div className="py-4">
      <h1 className="text-xl font-bold mb-4">{t("cart.title")}</h1>

      <div className="space-y-3">
        {items.map((item) => {
          const product = products[item.productId];
          if (!product) return null;

          return (
            <div
              key={item.productId}
              className="bg-white rounded-lg p-4 shadow-sm flex gap-3"
            >
              <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🪶
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-emerald-600 font-bold text-sm mt-0.5">
                  ${product.price.toFixed(2)}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <QuantityPicker
                    value={item.quantity}
                    onChange={(q) => updateItem(item.productId, q)}
                    max={product.stock}
                  />
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-500 text-xs hover:underline"
                  >
                    {t("cart.remove")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
        <div className="flex justify-between font-bold text-lg">
          <span>{t("cart.subtotal")}</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <Link
          href="/checkout"
          className="block mt-4 bg-emerald-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
        >
          {t("cart.checkout")}
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add birdie-supply/src/app/
git commit -m "feat: add cart page with quantity editing and subtotal"
```

---

### Task 10: Checkout Page & Order Submission API

**Files:**
- Create: `birdie-supply/src/components/delivery-toggle.tsx`
- Create: `birdie-supply/src/app/[locale]/checkout/page.tsx`
- Create: `birdie-supply/src/app/api/orders/route.ts`

- [ ] **Step 1: Create delivery toggle**

Create `birdie-supply/src/components/delivery-toggle.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";

type DeliveryToggleProps = {
  value: "pickup" | "shipping";
  onChange: (value: "pickup" | "shipping") => void;
};

export function DeliveryToggle({ value, onChange }: DeliveryToggleProps) {
  const t = useTranslations("checkout");

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange("pickup")}
        className={`flex-1 p-3 rounded-lg text-center text-sm font-medium border-2 transition-colors ${
          value === "pickup"
            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        🏠 {t("pickup")}
        <br />
        <span className="font-normal text-xs text-gray-500">
          {t("pickupDesc")}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange("shipping")}
        className={`flex-1 p-3 rounded-lg text-center text-sm font-medium border-2 transition-colors ${
          value === "shipping"
            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        📦 {t("shipping")}
        <br />
        <span className="font-normal text-xs text-gray-500">
          {t("shippingDesc")}
        </span>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create order submission API route**

Create `birdie-supply/src/app/api/orders/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const SHIPPING_FEE = 5.0;

type OrderItemInput = {
  productId: string;
  quantity: number;
};

type OrderInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: "pickup" | "shipping";
  shippingAddress?: string;
  notes?: string;
  items: OrderItemInput[];
};

export async function POST(request: NextRequest) {
  const body: OrderInput = await request.json();

  // Validate required fields
  if (
    !body.customerName ||
    !body.customerEmail ||
    !body.customerPhone ||
    !body.items?.length
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (body.deliveryMethod === "shipping" && !body.shippingAddress) {
    return NextResponse.json(
      { error: "Shipping address required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Fetch products to validate stock and get prices
  const productIds = body.items.map((i) => i.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, price, stock, name, active")
    .in("id", productIds);

  if (productsError || !products) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }

  // Validate stock
  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const item of body.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.active) {
      return NextResponse.json(
        { error: `Product not available: ${item.productId}` },
        { status: 400 }
      );
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        {
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        },
        { status: 400 }
      );
    }
  }

  // Calculate totals
  const subtotal = body.items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);

  const shippingFee = body.deliveryMethod === "shipping" ? SHIPPING_FEE : 0;
  const total = subtotal + shippingFee;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: body.customerName,
      customer_email: body.customerEmail,
      customer_phone: body.customerPhone,
      delivery_method: body.deliveryMethod,
      shipping_address: body.shippingAddress || null,
      status: "pending",
      subtotal,
      shipping_fee: shippingFee,
      total,
      notes: body.notes || null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }

  // Create order items
  const orderItems = body.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: productMap.get(item.productId)!.price,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    return NextResponse.json(
      { error: "Failed to create order items" },
      { status: 500 }
    );
  }

  return NextResponse.json({ orderId: order.id });
}
```

- [ ] **Step 3: Create checkout page**

Create `birdie-supply/src/app/[locale]/checkout/page.tsx`:

```typescript
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useCart } from "@/components/cart-provider";
import { createClient } from "@/lib/supabase/client";
import { Product } from "@/lib/types";
import { DeliveryToggle } from "@/components/delivery-toggle";
import { useTranslations } from "next-intl";
import { useRouter, useLocale } from "next-intl/client";

const SHIPPING_FEE = 5.0;

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [delivery, setDelivery] = useState<"pickup" | "shipping">("pickup");
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    async function fetchProducts() {
      if (items.length === 0) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .in(
          "id",
          items.map((i) => i.productId)
        );
      if (data) {
        const map: Record<string, Product> = {};
        data.forEach((p) => (map[p.id] = p as Product));
        setProducts(map);
      }
      setLoading(false);
    }
    fetchProducts();
  }, [items]);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">...</div>;
  }

  const subtotal = items.reduce((sum, item) => {
    const product = products[item.productId];
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  const shippingFee = delivery === "shipping" ? SHIPPING_FEE : 0;
  const total = subtotal + shippingFee;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("name"),
          customerEmail: form.get("email"),
          customerPhone: form.get("phone"),
          deliveryMethod: delivery,
          shippingAddress:
            delivery === "shipping" ? form.get("address") : undefined,
          notes: form.get("notes") || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to place order");
        setSubmitting(false);
        return;
      }

      clear();
      router.push(`/order-confirmation?id=${data.orderId}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="py-4">
      <h1 className="text-xl font-bold mb-4">{t("checkout.title")}</h1>

      {/* Order summary */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        {items.map((item) => {
          const product = products[item.productId];
          if (!product) return null;
          return (
            <div
              key={item.productId}
              className="flex justify-between text-sm py-1"
            >
              <span>
                {product.name} × {item.quantity}
              </span>
              <span>${(product.price * item.quantity).toFixed(2)}</span>
            </div>
          );
        })}
        <div className="border-t mt-2 pt-2 flex justify-between text-sm">
          <span>{t("checkout.shippingFee")}</span>
          <span>
            {shippingFee === 0 ? t("checkout.free") : `$${shippingFee.toFixed(2)}`}
          </span>
        </div>
        <div className="border-t mt-2 pt-2 flex justify-between font-bold">
          <span>{t("checkout.total")}</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact info */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            {t("checkout.contactInfo")}
          </label>
          <div className="space-y-2">
            <input
              name="name"
              required
              placeholder={t("checkout.name")}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
            <input
              name="email"
              type="email"
              required
              placeholder={t("checkout.email")}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
            <input
              name="phone"
              type="tel"
              required
              placeholder={t("checkout.phone")}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Delivery */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            {t("checkout.delivery")}
          </label>
          <DeliveryToggle value={delivery} onChange={setDelivery} />
          {delivery === "shipping" && (
            <textarea
              name="address"
              required
              placeholder={t("checkout.shippingAddress")}
              rows={2}
              className="w-full mt-2 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          )}
        </div>

        {/* Notes */}
        <textarea
          name="notes"
          placeholder={t("checkout.notes")}
          rows={2}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting || items.length === 0}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "..." : t("checkout.placeOrder")}
        </button>

        <p className="text-xs text-gray-500 text-center">
          {t("confirmation.etransfer")} — {t("confirmation.pickup")}
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add birdie-supply/src/
git commit -m "feat: add checkout page, delivery toggle, and order submission API"
```

---

### Task 11: Order Confirmation Page

**Files:**
- Create: `birdie-supply/src/app/[locale]/order-confirmation/page.tsx`

- [ ] **Step 1: Create order confirmation page**

Create `birdie-supply/src/app/[locale]/order-confirmation/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { id } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  if (!id) notFound();

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, total, delivery_method, customer_name")
    .eq("id", id)
    .single();

  if (!order) notFound();

  return (
    <div className="py-12 text-center">
      <div className="text-4xl mb-4">✅</div>
      <h1 className="text-2xl font-bold mb-2">{t("confirmation.title")}</h1>
      <p className="text-gray-500 mb-6">
        {t("confirmation.orderNumber")}:{" "}
        <span className="font-mono font-bold">{order.id.slice(0, 8)}</span>
      </p>

      <div className="bg-white rounded-lg p-6 shadow-sm text-left max-w-sm mx-auto">
        <h2 className="font-semibold mb-3">
          {t("confirmation.paymentInstructions")}
        </h2>
        <p className="text-sm text-gray-600 mb-2">
          {t("confirmation.etransfer")} <strong>your-email@example.com</strong>
        </p>
        <p className="text-sm text-gray-600 mb-4">
          {t("confirmation.pickup")}
        </p>
        <p className="text-sm font-bold">
          {t("checkout.total")}: ${order.total.toFixed(2)}
        </p>
      </div>

      <Link
        href="/"
        className="inline-block mt-8 text-emerald-600 font-medium hover:underline"
      >
        {t("confirmation.backHome")}
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add birdie-supply/src/app/
git commit -m "feat: add order confirmation page"
```

---

### Task 12: Admin Login Page

**Files:**
- Create: `birdie-supply/src/app/[locale]/admin/login/page.tsx`

- [ ] **Step 1: Create admin login page**

Create `birdie-supply/src/app/[locale]/admin/login/page.tsx`:

```typescript
"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("admin.login");
  const locale = useLocale();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(t("error"));
      setLoading(false);
      return;
    }

    router.push(`/${locale}/admin`);
    router.refresh();
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-xl font-bold text-center mb-6">{t("title")}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder={t("email")}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
          <input
            name="password"
            type="password"
            required
            placeholder={t("password")}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add birdie-supply/src/app/
git commit -m "feat: add admin login page"
```

---

### Task 13: Admin Layout & Navigation

**Files:**
- Create: `birdie-supply/src/components/admin/admin-nav.tsx`
- Create: `birdie-supply/src/app/[locale]/admin/layout.tsx`

- [ ] **Step 1: Create admin navigation**

Create `birdie-supply/src/components/admin/admin-nav.tsx`:

```typescript
"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminNav() {
  const t = useTranslations("admin.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: `/${locale}/admin`, label: t("dashboard"), icon: "📊" },
    { href: `/${locale}/admin/orders`, label: t("orders"), icon: "📦" },
    { href: `/${locale}/admin/products`, label: t("products"), icon: "🪶" },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/admin/login`);
    router.refresh();
  }

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-2 mb-4 border-b border-gray-200">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href.endsWith("/orders") &&
            pathname.startsWith(`/${locale}/admin/orders`)) ||
          (link.href.endsWith("/products") &&
            pathname.startsWith(`/${locale}/admin/products`));

        return (
          <a
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </a>
        );
      })}
      <button
        onClick={handleLogout}
        className="ml-auto text-sm text-gray-500 hover:text-red-500 whitespace-nowrap px-3 py-2"
      >
        {t("logout")}
      </button>
    </nav>
  );
}
```

- [ ] **Step 2: Create admin layout**

Create `birdie-supply/src/app/[locale]/admin/layout.tsx`:

```typescript
import { AdminNav } from "@/components/admin/admin-nav";

type Props = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: Props) {
  return (
    <div className="py-4">
      <AdminNav />
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add birdie-supply/src/
git commit -m "feat: add admin layout with navigation and logout"
```

---

### Task 14: Admin Dashboard

**Files:**
- Create: `birdie-supply/src/app/[locale]/admin/page.tsx`

- [ ] **Step 1: Create dashboard page**

Create `birdie-supply/src/app/[locale]/admin/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Order } from "@/lib/types";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.dashboard");

  const supabase = await createClient();

  const [
    { count: pendingCount },
    { data: lowStock },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("products")
      .select("id, name, stock")
      .lt("stock", 5)
      .eq("active", true)
      .order("stock"),
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">{t("title")}</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-3xl font-bold text-emerald-600">
            {pendingCount ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">{t("pendingOrders")}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-3xl font-bold text-orange-500">
            {lowStock?.length ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">{t("lowStock")}</p>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStock && lowStock.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-sm text-orange-600 mb-2">
            ⚠️ {t("lowStock")}
          </h2>
          <div className="bg-orange-50 rounded-lg p-3 space-y-1">
            {lowStock.map((p) => (
              <div
                key={p.id}
                className="flex justify-between text-sm"
              >
                <span>{p.name}</span>
                <span className="font-bold text-orange-600">
                  {p.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <h2 className="font-semibold text-sm mb-2">{t("recentOrders")}</h2>
      <div className="space-y-2">
        {(recentOrders as Order[])?.map((order) => (
          <a
            key={order.id}
            href={`/${locale}/admin/orders/${order.id}`}
            className="block bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{order.customer_name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">${order.total.toFixed(2)}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "confirmed"
                      ? "bg-blue-100 text-blue-700"
                      : order.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add birdie-supply/src/app/
git commit -m "feat: add admin dashboard with stats, low stock alerts, recent orders"
```

---

### Task 15: Admin Orders List & Detail

**Files:**
- Create: `birdie-supply/src/components/admin/order-status-badge.tsx`
- Create: `birdie-supply/src/components/admin/order-status-actions.tsx`
- Create: `birdie-supply/src/app/[locale]/admin/orders/page.tsx`
- Create: `birdie-supply/src/app/[locale]/admin/orders/[id]/page.tsx`
- Create: `birdie-supply/src/app/api/admin/orders/[id]/route.ts`

- [ ] **Step 1: Create order status badge**

Create `birdie-supply/src/components/admin/order-status-badge.tsx`:

```typescript
type Props = {
  status: string;
};

const styles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function OrderStatusBadge({ status }: Props) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}
```

- [ ] **Step 2: Create order status actions**

Create `birdie-supply/src/components/admin/order-status-actions.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
  orderId: string;
  status: string;
};

export function OrderStatusActions({ orderId, status }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("admin.orders");

  async function updateStatus(newStatus: string) {
    setLoading(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
    setLoading(false);
  }

  if (loading) return <p className="text-sm text-gray-400">...</p>;

  return (
    <div className="flex gap-2 flex-wrap">
      {status === "pending" && (
        <>
          <button
            onClick={() => updateStatus("confirmed")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {t("confirm")}
          </button>
          <button
            onClick={() => updateStatus("cancelled")}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
          >
            {t("cancel")}
          </button>
        </>
      )}
      {status === "confirmed" && (
        <>
          <button
            onClick={() => updateStatus("completed")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            {t("complete")}
          </button>
          <button
            onClick={() => updateStatus("cancelled")}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
          >
            {t("cancel")}
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create order status update API**

Create `birdie-supply/src/app/api/admin/orders/[id]/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const { status } = await request.json();

  const supabase = await createClient();

  // Check admin auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current order
  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const oldStatus = order.status;

  // Update order status
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }

  // Handle stock changes
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", id);

  if (orderItems) {
    if (status === "confirmed" && oldStatus === "pending") {
      // Deduct stock
      for (const item of orderItems) {
        await supabase.rpc("decrement_stock", {
          p_id: item.product_id,
          amount: item.quantity,
        });
      }
    } else if (status === "cancelled" && oldStatus === "confirmed") {
      // Restore stock
      for (const item of orderItems) {
        await supabase.rpc("increment_stock", {
          p_id: item.product_id,
          amount: item.quantity,
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Add stock RPC functions to migration**

Append to `birdie-supply/supabase/migrations/001_initial_schema.sql`:

```sql
-- Stock adjustment functions
create or replace function decrement_stock(p_id uuid, amount integer)
returns void as $$
begin
  update products set stock = stock - amount where id = p_id;
end;
$$ language plpgsql security definer;

create or replace function increment_stock(p_id uuid, amount integer)
returns void as $$
begin
  update products set stock = stock + amount where id = p_id;
end;
$$ language plpgsql security definer;
```

- [ ] **Step 5: Create orders list page**

Create `birdie-supply/src/app/[locale]/admin/orders/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrdersFilter } from "./orders-filter";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminOrdersPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { status } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("admin.orders");

  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: orders } = await query;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">{t("title")}</h1>

      <OrdersFilter selected={status || "all"} />

      <div className="space-y-2 mt-4">
        {(!orders || orders.length === 0) && (
          <p className="text-center text-gray-500 py-8">{t("noOrders")}</p>
        )}
        {(orders as Order[])?.map((order) => (
          <a
            key={order.id}
            href={`/${locale}/admin/orders/${order.id}`}
            className="block bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{order.customer_name}</p>
                <p className="text-xs text-gray-500">
                  {order.customer_phone} · {order.delivery_method}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm mb-1">
                  ${order.total.toFixed(2)}
                </p>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create orders filter client component**

Create `birdie-supply/src/app/[locale]/admin/orders/orders-filter.tsx`:

```typescript
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const statuses = ["all", "pending", "confirmed", "completed", "cancelled"];

type Props = {
  selected: string;
};

export function OrdersFilter({ selected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("admin.orders");

  function handleChange(status: string) {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 overflow-x-auto">
      {statuses.map((s) => (
        <button
          key={s}
          onClick={() => handleChange(s)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selected === s
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {t(s as "all" | "pending" | "confirmed" | "completed" | "cancelled")}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Create order detail page**

Create `birdie-supply/src/app/[locale]/admin/orders/[id]/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderStatusActions } from "@/components/admin/order-status-actions";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.orders");

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*, product:products(name, image_url)")
    .eq("order_id", id);

  return (
    <div>
      <a
        href={`/${locale}/admin/orders`}
        className="text-emerald-600 text-sm mb-4 inline-block"
      >
        ← {t("title")}
      </a>

      <h1 className="text-xl font-bold mb-1">{t("orderDetails")}</h1>
      <p className="text-sm text-gray-500 font-mono mb-4">
        {order.id.slice(0, 8)}
      </p>

      {/* Status */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">{t("status")}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <OrderStatusActions orderId={order.id} status={order.status} />
      </div>

      {/* Customer */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-sm font-semibold mb-2">{t("customer")}</h2>
        <p className="text-sm">{order.customer_name}</p>
        <p className="text-sm text-gray-500">{order.customer_email}</p>
        <p className="text-sm text-gray-500">{order.customer_phone}</p>
      </div>

      {/* Delivery */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-sm font-semibold mb-2">{t("delivery")}</h2>
        <p className="text-sm capitalize">{order.delivery_method}</p>
        {order.shipping_address && (
          <p className="text-sm text-gray-500 mt-1">
            {order.shipping_address}
          </p>
        )}
        {order.notes && (
          <p className="text-sm text-gray-400 mt-1 italic">{order.notes}</p>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-sm font-semibold mb-2">{t("items")}</h2>
        <div className="space-y-2">
          {items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product?.name ?? "Unknown"} × {item.quantity}
              </span>
              <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {order.shipping_fee === 0
                ? "Free"
                : `$${order.shipping_fee.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {new Date(order.created_at).toLocaleString()}
      </p>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add birdie-supply/src/ birdie-supply/supabase/
git commit -m "feat: add admin orders list, detail, status actions, and stock RPCs"
```

---

### Task 16: Admin Products List

**Files:**
- Create: `birdie-supply/src/components/admin/stock-adjuster.tsx`
- Create: `birdie-supply/src/app/[locale]/admin/products/page.tsx`
- Create: `birdie-supply/src/app/api/admin/products/[id]/route.ts`

- [ ] **Step 1: Create stock adjuster**

Create `birdie-supply/src/components/admin/stock-adjuster.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  stock: number;
};

export function StockAdjuster({ productId, stock }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function adjust(delta: number) {
    setLoading(true);
    await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: stock + delta }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => adjust(-1)}
        disabled={loading || stock <= 0}
        className="w-7 h-7 rounded bg-gray-100 text-sm hover:bg-gray-200 disabled:opacity-30"
      >
        −
      </button>
      <span className={`w-8 text-center text-sm font-bold ${stock < 5 ? "text-orange-600" : ""}`}>
        {stock}
      </span>
      <button
        onClick={() => adjust(1)}
        disabled={loading}
        className="w-7 h-7 rounded bg-gray-100 text-sm hover:bg-gray-200 disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create product update API**

Create `birdie-supply/src/app/api/admin/products/[id]/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await request.json();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("products")
    .update(body)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Soft delete — set active to false
  const { error } = await supabase
    .from("products")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to deactivate product" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create products list page**

Create `birdie-supply/src/app/[locale]/admin/products/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Product } from "@/lib/types";
import { StockAdjuster } from "@/components/admin/stock-adjuster";
import { ActiveToggle } from "./active-toggle";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminProductsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.products");

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <a
          href={`/${locale}/admin/products/new`}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          + {t("addProduct")}
        </a>
      </div>

      {(!products || products.length === 0) && (
        <p className="text-center text-gray-500 py-8">{t("noProducts")}</p>
      )}

      <div className="space-y-2">
        {(products as Product[])?.map((product) => (
          <div
            key={product.id}
            className={`bg-white rounded-lg p-3 shadow-sm ${
              !product.active ? "opacity-50" : ""
            }`}
          >
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    🪶
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={`/${locale}/admin/products/${product.id}`}
                  className="font-medium text-sm hover:text-emerald-600 line-clamp-1"
                >
                  {product.name}
                </a>
                <p className="text-xs text-gray-500">
                  ${product.price.toFixed(2)} · {product.category}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StockAdjuster
                  productId={product.id}
                  stock={product.stock}
                />
                <ActiveToggle
                  productId={product.id}
                  active={product.active}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create active toggle client component**

Create `birdie-supply/src/app/[locale]/admin/products/active-toggle.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  active: boolean;
};

export function ActiveToggle({ productId, active }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-10 h-6 rounded-full relative transition-colors ${
        active ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          active ? "left-4" : "left-0.5"
        }`}
      />
    </button>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add birdie-supply/src/
git commit -m "feat: add admin products list with stock adjuster and active toggle"
```

---

### Task 17: Admin Add/Edit Product

**Files:**
- Create: `birdie-supply/src/components/admin/product-form.tsx`
- Create: `birdie-supply/src/components/admin/image-upload.tsx`
- Create: `birdie-supply/src/app/[locale]/admin/products/new/page.tsx`
- Create: `birdie-supply/src/app/[locale]/admin/products/[id]/page.tsx`
- Create: `birdie-supply/src/app/api/admin/products/route.ts`

- [ ] **Step 1: Create image upload component**

Create `birdie-supply/src/components/admin/image-upload.tsx`:

```typescript
"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
};

export function ImageUpload({ currentUrl, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || "");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();

    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file);

    if (error) {
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(path);

    setPreview(publicUrl);
    onUpload(publicUrl);
    setUploading(false);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 overflow-hidden"
      >
        {preview ? (
          <img
            src={preview}
            alt="Product"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-sm">
            {uploading ? "Uploading..." : "Click to upload"}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
```

- [ ] **Step 2: Create product form**

Create `birdie-supply/src/components/admin/product-form.tsx`:

```typescript
"use client";

import { useState, type FormEvent } from "react";
import { Product } from "@/lib/types";
import { ImageUpload } from "./image-upload";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

type Props = {
  product?: Product;
};

export function ProductForm({ product }: Props) {
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useTranslations("admin.products");
  const locale = useLocale();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const body = {
      name: form.get("name") as string,
      description: form.get("description") as string,
      price: parseFloat(form.get("price") as string),
      category: form.get("category") as string,
      stock: parseInt(form.get("stock") as string, 10),
      image_url: imageUrl || null,
    };

    const url = product
      ? `/api/admin/products/${product.id}`
      : "/api/admin/products";
    const method = product ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }

    router.push(`/${locale}/admin/products`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ImageUpload currentUrl={product?.image_url} onUpload={setImageUrl} />

      <div>
        <label className="block text-sm font-medium mb-1">{t("name")}</label>
        <input
          name="name"
          required
          defaultValue={product?.name}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("description")}
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("price")}
          </label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.price}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("stock")}
          </label>
          <input
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={product?.stock ?? 0}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("category")}
        </label>
        <select
          name="category"
          required
          defaultValue={product?.category ?? "feather"}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value="feather">Feather</option>
          <option value="nylon">Nylon</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {saving ? t("saving") : t("save")}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create product create API**

Create `birdie-supply/src/app/api/admin/products/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: body.name,
      description: body.description || "",
      price: body.price,
      category: body.category,
      stock: body.stock,
      image_url: body.image_url,
      active: true,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: data.id });
}
```

- [ ] **Step 4: Create add product page**

Create `birdie-supply/src/app/[locale]/admin/products/new/page.tsx`:

```typescript
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ProductForm } from "@/components/admin/product-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AddProductPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.products");

  return (
    <div>
      <a
        href={`/${locale}/admin/products`}
        className="text-emerald-600 text-sm mb-4 inline-block"
      >
        ← {t("title")}
      </a>
      <h1 className="text-xl font-bold mb-4">{t("addProduct")}</h1>
      <ProductForm />
    </div>
  );
}
```

- [ ] **Step 5: Create edit product page**

Create `birdie-supply/src/app/[locale]/admin/products/[id]/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Product } from "@/lib/types";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.products");

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  return (
    <div>
      <a
        href={`/${locale}/admin/products`}
        className="text-emerald-600 text-sm mb-4 inline-block"
      >
        ← {t("title")}
      </a>
      <h1 className="text-xl font-bold mb-4">{t("editProduct")}</h1>
      <ProductForm product={product as Product} />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add birdie-supply/src/
git commit -m "feat: add admin product form with image upload, add and edit pages"
```

---

### Task 18: Final Cleanup & Verification

**Files:**
- Create: `birdie-supply/src/app/[locale]/not-found.tsx`
- Modify: `birdie-supply/.gitignore`

- [ ] **Step 1: Create 404 page**

Create `birdie-supply/src/app/[locale]/not-found.tsx`:

```typescript
import { Link } from "@/i18n/routing";

export default function NotFound() {
  return (
    <div className="py-12 text-center">
      <div className="text-4xl mb-4">404</div>
      <p className="text-gray-500 mb-4">Page not found</p>
      <Link href="/" className="text-emerald-600 font-medium hover:underline">
        Go home
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Update .gitignore**

Append to `birdie-supply/.gitignore`:

```
.superpowers/
```

- [ ] **Step 3: Remove default Next.js app/page.tsx and app/layout.tsx**

Delete `birdie-supply/src/app/page.tsx` and `birdie-supply/src/app/layout.tsx` if they still exist (they were replaced by `[locale]/` routes).

- [ ] **Step 4: Verify the dev server starts without errors**

```bash
cd birdie-supply && npm run dev
```

Expected: Server starts on `http://localhost:3000`, redirects to `/en`. No build errors.

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: Build completes successfully.

- [ ] **Step 6: Commit**

```bash
git add birdie-supply/
git commit -m "feat: add 404 page, update gitignore, final cleanup"
```

---

## Summary

**18 tasks** covering:

1. Project scaffolding & deps
2. Database schema (migration SQL)
3. Supabase clients & types
4. i18n setup (next-intl, EN/ZH)
5. Cart logic (localStorage + context)
6. Layout, header, shared components
7. Home page (product grid)
8. Product detail page
9. Cart page
10. Checkout page & order API
11. Order confirmation page
12. Admin login
13. Admin layout & nav
14. Admin dashboard
15. Admin orders (list, detail, status actions)
16. Admin products list (stock adjuster, active toggle)
17. Admin add/edit product (form, image upload)
18. Final cleanup & verification

**Post-implementation setup (manual):**
1. Create a Supabase project at supabase.com
2. Run the migration SQL in the SQL Editor
3. Create an admin user in Supabase Auth dashboard
4. Fill in `.env.local` with real Supabase credentials
5. Deploy to Vercel (`vercel` CLI or connect GitHub repo)
