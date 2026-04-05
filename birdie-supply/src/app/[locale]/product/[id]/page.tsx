import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProductDetail } from "./product-detail";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .single();

  if (!product) notFound();

  return <ProductDetail product={product as Product} />;
}
