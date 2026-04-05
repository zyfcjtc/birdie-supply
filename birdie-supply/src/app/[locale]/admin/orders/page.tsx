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
