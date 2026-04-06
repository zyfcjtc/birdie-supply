import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CartProvider } from "@/components/cart-provider";
import { Header } from "@/components/header";
import { CartBar } from "@/components/cart-bar";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ManifestSwitcher } from "@/components/manifest-switcher";
import "@/app/globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const SITE_URL = "https://birdie-supply.vercel.app";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const title = locale === "zh"
    ? "TRT Birdies | TRT羽毛球补给站 - 大多伦多地区羽毛球专卖"
    : "TRT Birdies - Badminton Shuttlecocks in Toronto GTA | Buy Feather & Nylon Birdies";

  const description = locale === "zh"
    ? "大多伦多地区(GTA)羽毛球专卖店。鹅毛球、尼龙球，免费配送，价格实惠。多伦多、万锦、列治文山、密西沙加羽毛球用品。"
    : "Buy badminton shuttlecocks in Toronto GTA. Feather and nylon birdies with free delivery. Serving Toronto, Markham, Richmond Hill, Mississauga, Scarborough. Best prices on shuttlecocks near you.";

  const keywords = locale === "zh"
    ? "羽毛球, 羽毛球拍, 鹅毛球, 尼龙球, 多伦多羽毛球, GTA羽毛球, 万锦羽毛球, 列治文山羽毛球, 密西沙加羽毛球, 买羽毛球, shuttlecock, badminton Toronto"
    : "badminton, shuttlecock, shuttlecocks, birdies, feather shuttlecock, nylon shuttlecock, badminton Toronto, badminton GTA, buy shuttlecocks Toronto, badminton Markham, badminton Richmond Hill, badminton Mississauga, badminton Scarborough, badminton near me, shuttlecock delivery Toronto";

  const alternateLocale = locale === "en" ? "zh" : "en";

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        zh: `${SITE_URL}/zh`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName: "TRT Birdies",
      locale: locale === "zh" ? "zh_CN" : "en_CA",
      type: "website",
      images: [{ url: `${SITE_URL}/icon-512.png`, width: 512, height: 512, alt: "TRT Birdies" }],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      "geo.region": "CA-ON",
      "geo.placename": "Toronto",
      "geo.position": "43.6532;-79.3832",
      ICBM: "43.6532, -79.3832",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "zh")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "TRT Birdies",
    description: "Badminton shuttlecocks shop in Toronto GTA. Feather and nylon shuttlecocks with free delivery.",
    url: SITE_URL,
    telephone: "",
    email: "trtbirdies@gmail.com",
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: { "@type": "GeoCoordinates", latitude: 43.6532, longitude: -79.3832 },
      geoRadius: "50000",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Toronto",
      addressRegion: "ON",
      addressCountry: "CA",
    },
    priceRange: "$",
    paymentAccepted: "Cash, e-Transfer",
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "Product",
        name: "Badminton Shuttlecocks",
        category: "Sporting Goods > Badminton",
      },
    },
  };

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <CartProvider>
            <Header />
            <main className="max-w-lg mx-auto px-4 pb-20">{children}</main>
            <Footer />
            <CartBar />
          </CartProvider>
        </NextIntlClientProvider>
        <ManifestSwitcher />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
