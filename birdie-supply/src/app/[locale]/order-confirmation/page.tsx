import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string; total?: string }>;
};

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { id, total } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  if (!id) notFound();

  return (
    <div className="py-12 text-center">
      <div className="text-4xl mb-4">✅</div>
      <h1 className="text-2xl font-bold mb-2">{t("confirmation.title")}</h1>
      <p className="text-gray-500 mb-6">
        {t("confirmation.orderNumber")}:{" "}
        <span className="font-mono font-bold">{id.slice(0, 8)}</span>
      </p>

      <div className="bg-white rounded-lg p-6 shadow-sm text-left max-w-sm mx-auto">
        <h2 className="font-semibold mb-3">
          {t("confirmation.paymentInstructions")}
        </h2>
        <p className="text-sm text-gray-600 mb-2">
          {t("confirmation.etransfer")} <strong>trtbirdies@gmail.com</strong>
        </p>
        <p className="text-sm text-gray-600 mb-4">
          {t("confirmation.pickup")}
        </p>
        {total && (
          <p className="text-sm font-bold">
            {t("checkout.total")}: ${total}
          </p>
        )}
      </div>

      {/* Contact Us */}
      <div className="mt-6 bg-white rounded-lg p-6 shadow-sm max-w-sm mx-auto text-center">
        <h2 className="font-semibold mb-3">{t("contact.title")}</h2>
        <Image
          src="/contact-wechat.jpg"
          alt="WeChat QR Code"
          width={180}
          height={180}
          className="mx-auto rounded-lg"
        />
        <p className="text-sm text-gray-600 mt-3">{t("contact.scanWechat")}</p>
        <p className="text-xs text-gray-500 mt-1">{t("contact.arrangeTime")}</p>
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
