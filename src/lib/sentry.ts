/**
 * Sentry initialization for Magic CRM.
 *
 * Configure by setting NEXT_PUBLIC_SENTRY_DSN in your environment.
 * When the DSN is absent, Sentry is silently disabled (dev-safe).
 */

import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

let _initialized = false;

export function initSentry() {
  if (_initialized || !DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,
    // Filter noisy errors
    ignoreErrors: [
      "ResizeObserver loop",
      "Network request failed",
      "AbortError",
      "Load failed",
    ],
  });

  _initialized = true;
}

export { Sentry };
