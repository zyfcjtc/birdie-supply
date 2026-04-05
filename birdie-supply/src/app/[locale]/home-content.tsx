"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { CategoryFilter } from "@/components/category-filter";
import { useTranslations } from "next-intl";

type Props = {
  products: Product[];
};

export function HomeContent({ products }: Props) {
  const [category, setCategory] = useState("all");
  const t = useTranslations();

  const filtered =
    category === "all"
      ? products
      : products.filter((p) => p.category === category);

  return (
    <div className="py-4">
      <div className="mb-4">
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No products found</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
