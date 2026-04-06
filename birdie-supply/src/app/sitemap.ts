import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, updated_at")
    .eq("active", true);

  const locales = ["en", "zh"];

  const staticPages = locales.flatMap((locale) => [
    {
      url: `${SITE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/${locale}/privacy`,
      lastModified: new Date("2026-04-05"),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ]);

  const productPages = (products ?? []).flatMap((product) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/product/${product.id}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  );

  return [...staticPages, ...productPages];
}
