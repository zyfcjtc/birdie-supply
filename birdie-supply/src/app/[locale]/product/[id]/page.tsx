import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types";
import { SITE_URL } from "@/lib/constants";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProductDetail } from "./product-detail";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

// Cached per-request so generateMetadata and the page share one DB query
const getProduct = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("active", true)
    .single();
  return data as Product | null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const product = await getProduct(id);

  if (!product) return {};

  const categoryLabel = locale === "zh"
    ? (product.category === "feather" ? "鹅毛球" : "尼龙球")
    : (product.category === "feather" ? "Feather Shuttlecock" : "Nylon Shuttlecock");

  const title = locale === "zh"
    ? `${product.name} - ${categoryLabel} | TRT Birdies`
    : `${product.name} - ${categoryLabel} | TRT Birdies Toronto`;

  const description = locale === "zh"
    ? `${product.name} - $${product.price} CAD。大多伦多地区(GTA)免费配送。TRT Birdies 羽毛球专卖。`
    : `Buy ${product.name} for $${product.price} CAD. Free delivery in Toronto GTA. ${categoryLabel} from TRT Birdies.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/product/${id}`,
      images: product.image_url ? [{ url: product.image_url, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const product = await getProduct(id);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(product.image_url && { image: product.image_url }),
    category: product.category === "feather" ? "Feather Shuttlecock" : "Nylon Shuttlecock",
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "CAD",
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/${locale}/product/${id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} />
    </>
  );
}
