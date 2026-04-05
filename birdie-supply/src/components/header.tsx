import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LanguageToggle } from "./language-toggle";

export function Header() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex flex-col">
          <span className="text-lg font-bold text-gray-900">
            {t("site.name")}
          </span>
          <span className="text-xs text-gray-500">{t("site.tagline")}</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
