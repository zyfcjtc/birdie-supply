import { Resend } from "resend";

type OrderNotification = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  shippingAddress?: string | null;
  total: number;
  items: { name: string; quantity: number; unitPrice: number }[];
  notes?: string | null;
};

export async function sendOrderNotification(order: OrderNotification) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping order notification email");
    return;
  }

  const resend = new Resend(apiKey);

  const itemLines = order.items
    .map((i) => `  ${i.name} × ${i.quantity} — $${(i.unitPrice * i.quantity).toFixed(2)}`)
    .join("\n");

  const text = `New Order: ${order.orderId.slice(0, 8)}

Customer: ${order.customerName}
Email: ${order.customerEmail}
Phone: ${order.customerPhone}
Delivery: ${order.deliveryMethod}${order.shippingAddress ? `\nAddress: ${order.shippingAddress}` : ""}
${order.notes ? `Notes: ${order.notes}` : ""}

Items:
${itemLines}

Total: $${order.total.toFixed(2)}`;

  try {
    await resend.emails.send({
      from: "TRT Birdies <onboarding@resend.dev>",
      to: "trtbirdies@gmail.com",
      subject: `New Order #${order.orderId.slice(0, 8)} — $${order.total.toFixed(2)}`,
      text,
    });
  } catch (error) {
    console.error("Failed to send order notification email:", error);
  }
}
