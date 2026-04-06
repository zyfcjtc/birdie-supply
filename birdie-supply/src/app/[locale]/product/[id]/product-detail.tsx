"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { useCart } from "@/components/cart-provider";
import { QuantityPicker } from "@/components/quantity-picker";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

type Props = {
  product: Product;
};

export function ProductDetail({ product }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const t = useTranslations();

  function handleAdd() {
    addItem(product.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const inStock = product.stock > 0;

  return (
    <div className="py-4">
      <Link href="/" className="text-emerald-600 text-sm mb-4 inline-block">
        ← {t("nav.home")}
      </Link>

      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🪶
          </div>
        )}
      </div>

      <h1 className="text-xl font-bold">{product.name}</h1>
      <p className="text-2xl font-bold text-emerald-600 mt-1">
        ${product.price.toFixed(2)}
      </p>

      {inStock ? (
        <p className="text-sm text-emerald-600 mt-1">
          ✓ {t("product.inStock")}
        </p>
      ) : (
        <p className="text-sm text-red-500 mt-1">{t("product.outOfStock")}</p>
      )}

      <p className="text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-wrap">
        {product.description}
      </p>

      {inStock && (
        <div className="flex items-center gap-3 mt-6">
          <QuantityPicker
            value={quantity}
            onChange={setQuantity}
            max={product.stock}
          />
          <button
            onClick={handleAdd}
            className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            {added ? "✓" : t("product.addToCart")}
          </button>
        </div>
      )}
    </div>
  );
}
