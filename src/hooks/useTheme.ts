"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "magic-theme";
const listeners = new Set<() => void>();

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Theme {
  return getStoredTheme();
}

function getServerSnapshot(): Theme {
  return "system";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    applyTheme(theme);

    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    listeners.forEach((cb) => cb());
  }, []);

  const resolved = resolveTheme(theme);

  return { theme, resolved, setTheme } as const;
}
