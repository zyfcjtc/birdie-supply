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
