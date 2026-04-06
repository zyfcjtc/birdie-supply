import { createClient } from "@/lib/supabase/server";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Product } from "@/lib/types";
import { StockAdjuster } from "@/components/admin/stock-adjuster";
import { SortOrderControl } from "@/components/admin/sort-order-control";
import { ActiveToggle } from "./active-toggle";

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

      {(!products || products.length === 0) && (
        <p className="text-center text-gray-500 py-8">{t("noProducts")}</p>
      )}

      {/* Column headers */}
      {products && products.length > 0 && (
        <div className="flex items-center gap-3 px-3 pb-1 text-xs text-gray-400">
          <div className="flex-1" />
          <span className="w-[88px] text-center">{t("stock")}</span>
          <span className="w-[72px] text-center">{t("sortOrder")}</span>
          <span className="w-10" />
        </div>
      )}

      <div className="space-y-2">
        {(products as Product[])?.map((product) => (
          <div
            key={product.id}
            className={`bg-white rounded-lg p-3 shadow-sm ${
              !product.active ? "opacity-50" : ""
            }`}
          >
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    🪶
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={`/${locale}/admin/products/${product.id}`}
                  className="font-medium text-sm hover:text-emerald-600 line-clamp-1"
                >
                  {product.name}
                </a>
                <p className="text-xs text-gray-500">
                  ${product.price.toFixed(2)} · {product.category}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StockAdjuster
                  productId={product.id}
                  stock={product.stock}
                />
                <SortOrderControl
                  productId={product.id}
                  sortOrder={product.sort_order}
                />
                <ActiveToggle
                  productId={product.id}
                  active={product.active}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
