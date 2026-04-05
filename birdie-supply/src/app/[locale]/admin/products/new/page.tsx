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
