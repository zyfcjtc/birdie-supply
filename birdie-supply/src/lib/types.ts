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
