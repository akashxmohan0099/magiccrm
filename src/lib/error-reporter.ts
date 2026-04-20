/**
 * Error reporting — forwards to Sentry when configured, always logs to console.
 */

import * as Sentry from "@sentry/nextjs";

export function reportBoundaryError(
  error: Error,
  info?: { componentStack?: string }
): void {
  console.error("[ErrorBoundary]", error, info);
  Sentry.captureException(error, {
    contexts: { react: { componentStack: info?.componentStack } },
  });
}

export function reportSyncError(error: unknown, context: string): void {
  console.error(`[SyncError] ${context}:`, error);
  Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
    tags: { context },
  });
}

/** Report any error with optional context tags */
export function reportError(error: unknown, tags?: Record<string, string>): void {
  console.error("[Error]", error);
  Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
    tags,
  });
}
