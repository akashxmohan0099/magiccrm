"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Strips the .dark class on non-dashboard routes.
 * Dark mode is only supported inside /dashboard.
 * Home, onboarding, login, etc. are always light.
 */
export function ThemeGate() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith("/dashboard")) {
      document.documentElement.classList.remove("dark");
    }
  }, [pathname]);

  return null;
}
