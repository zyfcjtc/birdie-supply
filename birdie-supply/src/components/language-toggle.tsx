"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale() {
    const newLocale = locale === "en" ? "zh" : "en";
    router.push(pathname, { locale: newLocale });
  }

  return (
    <button
      onClick={switchLocale}
      className="text-sm font-medium px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
    >
      {locale === "en" ? "中文" : "EN"}
    </button>
  );
}
