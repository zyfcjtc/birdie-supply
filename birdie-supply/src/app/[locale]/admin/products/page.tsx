import { createClient } from "@/lib/supabase/server";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Product } from "@/lib/types";
import { DraggableProductList } from "@/components/admin/draggable-product-list";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminProductsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.products");

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <a
          href={`/${locale}/admin/products/new`}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          + {t("addProduct")}
        </a>
      </div>

      {(!products || products.length === 0) ? (
        <p className="text-center text-gray-500 py-8">{t("noProducts")}</p>
      ) : (
        <DraggableProductList
          products={products as Product[]}
          locale={locale}
          labels={{
            stock: t("stock"),
            sortOrder: t("sortOrder"),
          }}
        />
      )}
    </div>
  );
}
