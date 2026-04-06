"use client";

import { useState, useRef } from "react";
import { Product } from "@/lib/types";
import { StockAdjuster } from "./stock-adjuster";
import { ActiveToggle } from "@/app/[locale]/admin/products/active-toggle";

type Props = {
  products: Product[];
  locale: string;
  labels: {
    stock: string;
    sortOrder: string;
  };
};

export function DraggableProductList({ products, locale, labels }: Props) {
  const [items, setItems] = useState(() =>
    [...products].sort((a, b) => {
      if (a.sort_order === 0 && b.sort_order === 0)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (a.sort_order === 0) return 1;
      if (b.sort_order === 0) return -1;
      return a.sort_order - b.sort_order;
    })
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const dragNode = useRef<HTMLDivElement | null>(null);

  function handleDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    dragNode.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image slightly transparent
    setTimeout(() => {
      if (dragNode.current) dragNode.current.style.opacity = "0.4";
    }, 0);
  }

  function handleDragEnd() {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (index !== overIndex) setOverIndex(index);
  }

  async function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    const newItems = [...items];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, moved);
    setItems(newItems);
    handleDragEnd();

    // Save new order — assign sort_order 1, 2, 3... based on position
    setSaving(true);
    const updates = newItems.map((item, i) => ({
      id: item.id,
      sort_order: i + 1,
    }));

    await Promise.all(
      updates.map((u) =>
        fetch(`/api/admin/products/${u.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: u.sort_order }),
        })
      )
    );

    // Update local state with new sort_order values
    setItems((prev) =>
      prev.map((item, i) => ({ ...item, sort_order: i + 1 }))
    );
    setSaving(false);
  }

  return (
    <div>
      {/* Column headers */}
      <div className="flex items-center gap-3 px-3 pb-1 text-xs text-gray-400">
        <span className="w-6" />
        <div className="flex-1" />
        <span className="w-[88px] text-center">{labels.stock}</span>
        <span className="w-[30px] text-center">#</span>
        <span className="w-10" />
      </div>

      {saving && (
        <div className="text-xs text-amber-600 text-center py-1">Saving order...</div>
      )}

      <div className="space-y-2">
        {items.map((product, index) => (
          <div
            key={product.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            className={`bg-white rounded-lg p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing ${
              !product.active ? "opacity-50" : ""
            } ${
              overIndex === index && dragIndex !== null && dragIndex !== index
                ? "border-2 border-amber-400"
                : "border-2 border-transparent"
            }`}
          >
            <div className="flex gap-3 items-center">
              {/* Drag handle */}
              <div className="w-6 flex-shrink-0 text-gray-300 select-none text-center">
                ⠿
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    🪶
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={`/${locale}/admin/products/${product.id}`}
                  className="font-medium text-sm hover:text-emerald-600 line-clamp-1"
                >
                  {product.name}
                </a>
                <p className="text-xs text-gray-500">
                  ${product.price.toFixed(2)} · {product.category}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StockAdjuster
                  productId={product.id}
                  stock={product.stock}
                />
                <span className="w-[30px] text-center text-xs font-bold text-amber-700">
                  {product.sort_order || "–"}
                </span>
                <ActiveToggle
                  productId={product.id}
                  active={product.active}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
