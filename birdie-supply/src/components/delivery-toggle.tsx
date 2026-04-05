"use client";

import { useTranslations } from "next-intl";

type DeliveryToggleProps = {
  value: "pickup" | "shipping";
  onChange: (value: "pickup" | "shipping") => void;
};

export function DeliveryToggle({ value, onChange }: DeliveryToggleProps) {
  const t = useTranslations("checkout");

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange("pickup")}
        className={`flex-1 p-3 rounded-lg text-center text-sm font-medium border-2 transition-colors ${
          value === "pickup"
            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        🏠 {t("pickup")}
        <br />
        <span className="font-normal text-xs text-gray-500">
          {t("pickupDesc")}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange("shipping")}
        className={`flex-1 p-3 rounded-lg text-center text-sm font-medium border-2 transition-colors ${
          value === "shipping"
            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        📦 {t("shipping")}
        <br />
        <span className="font-normal text-xs text-gray-500">
          {t("shippingDesc")}
        </span>
      </button>
    </div>
  );
}
