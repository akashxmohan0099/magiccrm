"use client";

import { useState, useEffect } from "react";
import type { FormTheme } from "@/types/models";

/**
 * Resolves "auto" against the system preference. Returns 'dark' or 'light'.
 * Re-evaluated whenever the OS preference changes so an open form picks up
 * the switch without a reload.
 */
export function useResolvedTheme(theme: FormTheme): "light" | "dark" {
  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return systemDark ? "dark" : "light";
}

/**
 * Wraps the rendered form so the form's theme tokens (--card-bg, --background,
 * etc.) resolve from the .dark scope when needed. The dashboard's own theme
 * stays unaffected — the wrapper applies a div-scoped colour-scheme override
 * only to its descendants.
 */
export function ThemeScope({
  theme,
  children,
}: {
  theme: FormTheme;
  children: React.ReactNode;
}) {
  const resolved = useResolvedTheme(theme);
  // `display: contents` so the wrapper participates in cascading and
  // scoping (.dark applies to descendants) but contributes no box of its
  // own. Templates control their own height/layout. `colorScheme` flips
  // the UA's default form-control palette for this subtree.
  return (
    <div
      className={resolved === "dark" ? "dark contents" : "contents"}
      style={{ colorScheme: resolved }}
    >
      {children}
    </div>
  );
}
