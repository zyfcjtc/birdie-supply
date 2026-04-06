"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ManifestSwitcher() {
  const pathname = usePathname();

  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) return;
    const isAdmin = pathname.includes("/admin");
    link.setAttribute("href", isAdmin ? "/manifest-admin.json" : "/manifest.json");
  }, [pathname]);

  return null;
}
