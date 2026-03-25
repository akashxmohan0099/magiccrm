/**
 * Centralized error handler for Supabase sync operations.
 * Shows user-facing toast on failure instead of silent console.error.
 * Logs to console in development for debugging.
 */

import { toast } from "@/components/ui/Toast";

interface SyncErrorOptions {
  /** User-friendly context, e.g. "saving client" */
  context: string;
  /** Whether to show a toast (default: true) */
  showToast?: boolean;
  /** Whether to log to console (default: true in dev) */
  log?: boolean;
}

/**
 * Handle a sync error with user feedback.
 * Use in .catch() blocks or try/catch for Supabase operations.
 *
 * @example
 * supabase.from("clients").update(data).then(({ error }) => {
 *   if (error) handleSyncError(error, { context: "saving client" });
 * });
 *
 * @example
 * .catch((err) => handleSyncError(err, { context: "loading bookings" }));
 */
export function handleSyncError(
  error: unknown,
  options: SyncErrorOptions,
): void {
  const { context, showToast = true, log = true } = options;
  const message = error instanceof Error ? error.message : String(error);

  if (log) {
    console.error(`[sync] ${context} failed:`, message);
  }

  if (showToast) {
    toast(`Failed ${context}. Changes saved locally.`, "error");
  }
}

/**
 * Wrap a Supabase operation with error handling.
 * Returns true on success, false on failure.
 *
 * @example
 * const ok = await syncOperation(
 *   () => supabase.from("clients").upsert(rows),
 *   "syncing clients"
 * );
 */
export async function syncOperation(
  fn: () => Promise<{ error: { message: string } | null }>,
  context: string,
): Promise<boolean> {
  try {
    const { error } = await fn();
    if (error) {
      handleSyncError(error, { context });
      return false;
    }
    return true;
  } catch (err) {
    handleSyncError(err, { context });
    return false;
  }
}
