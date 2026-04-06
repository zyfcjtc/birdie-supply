import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await request.json();
  const { status, admin_notes } = body;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const oldStatus = order.status;

  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;
  if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ success: true });
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }

  // Handle stock changes only if status changed
  if (!status) return NextResponse.json({ success: true });

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", id);

  if (orderItems) {
    if (status === "confirmed" && oldStatus === "pending") {
      for (const item of orderItems) {
        await supabase.rpc("decrement_stock", {
          p_id: item.product_id,
          amount: item.quantity,
        });
      }
    } else if (status === "cancelled" && oldStatus === "confirmed") {
      for (const item of orderItems) {
        await supabase.rpc("increment_stock", {
          p_id: item.product_id,
          amount: item.quantity,
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
