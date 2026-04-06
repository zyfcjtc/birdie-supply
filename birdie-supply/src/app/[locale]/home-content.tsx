"use client";

import { useState } from "react";
import Image from "next/image";
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
