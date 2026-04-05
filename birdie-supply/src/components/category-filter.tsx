"use client";

import { useTranslations } from "next-intl";

type CategoryFilterProps = {
  selected: string;
  onChange: (category: string) => void;
};

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const t = useTranslations("product.category");
  const categories = ["all", "feather", "nylon"] as const;

  return (
    <div className="flex gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected === cat
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {t(cat)}
        </button>
      ))}
    </div>
  );
}
