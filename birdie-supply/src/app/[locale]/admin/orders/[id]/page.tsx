import { createClient } from "@/lib/supabase/server";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderStatusActions } from "@/components/admin/order-status-actions";
import { AdminNotes } from "@/components/admin/admin-notes";

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

      {/* Admin Notes */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-sm font-semibold mb-2">Admin Notes</h2>
        <AdminNotes orderId={order.id} notes={order.admin_notes} />
      </div>

      <p className="text-xs text-gray-400 text-center">
        {new Date(order.created_at).toLocaleString()}
      </p>
    </div>
  );
}
