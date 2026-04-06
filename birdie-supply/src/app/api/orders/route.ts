import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sendOrderNotification } from "@/lib/email";

type OrderItemInput = {
  productId: string;
  quantity: number;
};

type OrderInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: "pickup" | "delivery";
  shippingAddress?: string;
  notes?: string;
  items: OrderItemInput[];
};

export async function POST(request: NextRequest) {
  const body: OrderInput = await request.json();

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

  if (body.deliveryMethod === "delivery" && !body.shippingAddress) {
    return NextResponse.json(
      { error: "Delivery address required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

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

  const subtotal = body.items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);

  const total = subtotal;

  const orderId = randomUUID();

  const { error: orderError } = await supabase
    .from("orders")
    .insert({
      id: orderId,
      customer_name: body.customerName,
      customer_email: body.customerEmail,
      customer_phone: body.customerPhone,
      delivery_method: body.deliveryMethod,
      shipping_address: body.shippingAddress || null,
      status: "pending",
      subtotal,
      shipping_fee: 0,
      total,
      notes: body.notes || null,
    });

  if (orderError) {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }

  const orderItems = body.items.map((item) => ({
    order_id: orderId,
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

  // Send email notification (fire-and-forget)
  sendOrderNotification({
    orderId,
    customerName: body.customerName,
    customerEmail: body.customerEmail,
    customerPhone: body.customerPhone,
    deliveryMethod: body.deliveryMethod,
    shippingAddress: body.shippingAddress,
    total,
    items: body.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return { name: product.name, quantity: item.quantity, unitPrice: product.price };
    }),
    notes: body.notes,
  });

  return NextResponse.json({ orderId });
}
