"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { CategoryFilter } from "@/components/category-filter";
import { useTranslations } from "next-intl";

type SortOption = "newest" | "oldest" | "priceHigh" | "priceLow" | "popular";

type Props = {
  products: Product[];
};

export function HomeContent({ products }: Props) {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const t = useTranslations();

  const sorted = useMemo(() => {
    const filtered =
      category === "all"
        ? [...products]
        : products.filter((p) => p.category === category);

    switch (sort) {
      case "newest":
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "oldest":
        return filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "priceHigh":
        return filtered.sort((a, b) => b.price - a.price);
      case "priceLow":
        return filtered.sort((a, b) => a.price - b.price);
      case "popular":
        return filtered.sort((a, b) => a.stock - b.stock);
      default:
        return filtered;
    }
  }, [products, category, sort]);

  const sortOptions: SortOption[] = ["newest", "oldest", "priceLow", "priceHigh", "popular"];

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-600"
        >
          {sortOptions.map((opt) => (
            <option key={opt} value={opt}>
              {t(`product.sort.${opt}`)}
            </option>
          ))}
        </select>
      </div>
      {sorted.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No products found</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Contact Us */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-sm text-center">
        <h2 className="text-lg font-bold mb-3">{t("contact.title")}</h2>
        <Image
          src="/contact-wechat.jpg"
          alt="WeChat QR Code"
          width={200}
          height={200}
          className="mx-auto rounded-lg"
        />
        <p className="text-sm text-gray-600 mt-3">{t("contact.scanWechat")}</p>
      </div>
    </div>
  );
}
