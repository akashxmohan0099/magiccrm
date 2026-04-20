"use client";

import { useEffect } from "react";

/**
 * Client-side Sentry initialization.
 * Renders nothing — just initializes Sentry on mount.
 */
export function SentryInit() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@/lib/sentry").then(({ initSentry }) => initSentry());
    }
  }, []);

  return null;
}
