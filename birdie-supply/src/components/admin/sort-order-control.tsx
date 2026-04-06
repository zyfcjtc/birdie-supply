"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  sortOrder: number;
};

export function SortOrderControl({ productId, sortOrder }: Props) {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(sortOrder));
  const router = useRouter();

  async function updateOrder(newOrder: number) {
    setLoading(true);
    await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sort_order: newOrder }),
    });
    router.refresh();
    setLoading(false);
  }

  function startEditing() {
    setInputValue(String(sortOrder));
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed !== sortOrder) {
      updateOrder(Math.max(0, parsed));
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => updateOrder(Math.max(0, sortOrder - 1))}
        disabled={loading || sortOrder <= 0}
        className="w-6 h-6 rounded bg-amber-50 text-xs text-amber-700 hover:bg-amber-100 disabled:opacity-30"
      >
        ▲
      </button>
      {editing ? (
        <input
          autoFocus
          type="number"
          min="0"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-10 text-center text-xs font-bold border border-amber-400 rounded px-1 py-0.5 outline-none"
        />
      ) : (
        <button
          onClick={startEditing}
          className="w-8 text-center text-xs font-bold cursor-text hover:bg-amber-50 rounded text-amber-700"
          title="Click to edit"
        >
          {sortOrder || "–"}
        </button>
      )}
      <button
        onClick={() => updateOrder(sortOrder + 1)}
        disabled={loading}
        className="w-6 h-6 rounded bg-amber-50 text-xs text-amber-700 hover:bg-amber-100 disabled:opacity-30"
      >
        ▼
      </button>
    </div>
  );
}
