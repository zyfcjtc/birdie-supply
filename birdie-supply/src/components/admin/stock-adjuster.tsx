"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  stock: number;
};

export function StockAdjuster({ productId, stock }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function adjust(delta: number) {
    setLoading(true);
    await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: stock + delta }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => adjust(-1)}
        disabled={loading || stock <= 0}
        className="w-7 h-7 rounded bg-gray-100 text-sm hover:bg-gray-200 disabled:opacity-30"
      >
        −
      </button>
      <span className={`w-8 text-center text-sm font-bold ${stock < 5 ? "text-orange-600" : ""}`}>
        {stock}
      </span>
      <button
        onClick={() => adjust(1)}
        disabled={loading}
        className="w-7 h-7 rounded bg-gray-100 text-sm hover:bg-gray-200 disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
