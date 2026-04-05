"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminNav() {
  const t = useTranslations("admin.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: `/${locale}/admin`, label: t("dashboard"), icon: "📊" },
    { href: `/${locale}/admin/orders`, label: t("orders"), icon: "📦" },
    { href: `/${locale}/admin/products`, label: t("products"), icon: "🪶" },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/admin/login`);
    router.refresh();
  }

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-2 mb-4 border-b border-gray-200">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href.endsWith("/orders") &&
            pathname.startsWith(`/${locale}/admin/orders`)) ||
          (link.href.endsWith("/products") &&
            pathname.startsWith(`/${locale}/admin/products`));

        return (
          <a
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </a>
        );
      })}
      <button
        onClick={handleLogout}
        className="ml-auto text-sm text-gray-500 hover:text-red-500 whitespace-nowrap px-3 py-2"
      >
        {t("logout")}
      </button>
    </nav>
  );
}
