import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types";
import { setRequestLocale } from "next-intl/server";
import { HomeContent } from "./home-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  return <HomeContent products={(products as Product[]) ?? []} />;
}
