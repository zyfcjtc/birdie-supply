import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="max-w-lg mx-auto px-4 py-4 text-center text-xs text-gray-400 border-t border-gray-200">
      <Link href="/privacy" className="hover:text-gray-600 hover:underline">
        {t("footer.privacy")}
      </Link>
      <span className="mx-2">·</span>
      <span>&copy; {new Date().getFullYear()} Birdie Supply</span>
    </footer>
  );
}
