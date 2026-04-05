"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const statuses = ["all", "pending", "confirmed", "completed", "cancelled"];

type Props = {
  selected: string;
};

export function OrdersFilter({ selected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("admin.orders");

  function handleChange(status: string) {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 overflow-x-auto">
      {statuses.map((s) => (
        <button
          key={s}
          onClick={() => handleChange(s)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selected === s
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {t(s as "all" | "pending" | "confirmed" | "completed" | "cancelled")}
        </button>
      ))}
    </div>
  );
}
