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
  delivery_method text not null check (delivery_method in ('pickup', 'delivery')),
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
