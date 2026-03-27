// ── Error Reporter ───────────────────────────────────────────
//
// Lightweight structured error logging for production.
// Currently logs to console with structured format.
// Replace with Sentry, LogRocket, or custom endpoint later.

interface ErrorReport {
  message: string;
  context: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  url?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

const MAX_REPORTS_PER_MINUTE = 20;
let reportCount = 0;
let lastReset = Date.now();

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - lastReset > 60_000) {
    reportCount = 0;
    lastReset = now;
  }
  if (reportCount >= MAX_REPORTS_PER_MINUTE) return false;
  reportCount++;
  return true;
}

/**
 * Report an error with structured context.
 * Rate-limited to prevent flooding.
 */
export function reportError(
  error: unknown,
  context: string,
  severity: ErrorReport["severity"] = "medium",
  metadata?: Record<string, unknown>,
) {
  if (!checkRateLimit()) return;

  const report: ErrorReport = {
    message: error instanceof Error ? error.message : String(error),
    context,
    severity,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    metadata,
  };

  // Structured log for production log aggregation
  if (severity === "critical" || severity === "high") {
    console.error(`[MAGIC CRM ERROR] [${severity.toUpperCase()}] ${context}:`, report);
  } else {
    console.warn(`[MAGIC CRM] [${severity}] ${context}:`, report.message);
  }

  // Future: send to Sentry, LogRocket, or custom endpoint
  // sendToErrorService(report);
}

/**
 * Report an unhandled error from React ErrorBoundary.
 */
export function reportBoundaryError(error: Error, errorInfo: { componentStack?: string }) {
  reportError(
    error,
    "React ErrorBoundary",
    "critical",
    { componentStack: errorInfo.componentStack?.slice(0, 500) },
  );
}

/**
 * Report a Supabase sync error.
 */
export function reportSyncError(error: unknown, operation: string) {
  reportError(error, `Supabase sync: ${operation}`, "medium");
}

/**
 * Report an API route error.
 */
export function reportApiError(error: unknown, route: string, method: string) {
  reportError(error, `API ${method} ${route}`, "high");
}
