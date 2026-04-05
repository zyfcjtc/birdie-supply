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
