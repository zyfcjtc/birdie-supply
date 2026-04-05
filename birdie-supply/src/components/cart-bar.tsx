"use client";

import { useCart } from "./cart-provider";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function CartBar() {
  const { items, totalItems } = useCart();
  const t = useTranslations();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-emerald-600 text-white safe-bottom">
      <Link
        href="/cart"
        className="block max-w-lg mx-auto px-4 py-3 flex items-center justify-between"
      >
        <span className="text-sm font-semibold">
          🛒 {t("nav.cart")} ({totalItems} {t("cart.items")})
        </span>
        <span className="text-sm font-bold">{t("cart.checkout")} →</span>
      </Link>
    </div>
  );
}
