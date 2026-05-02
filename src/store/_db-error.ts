import { toast } from "@/components/ui/Toast";

/**
 * Shared error surface for background DB writes initiated by Zustand stores.
 *
 * Every store does optimistic local updates and fires the DB write as
 * fire-and-forget. The original pattern was `.catch(console.error)` which
 * means failures vanished from the operator's view — they'd see the change
 * locally, the server would never get it, and they'd find out only on next
 * page load when their data reverted.
 *
 * This helper:
 *   1. Logs the error with a structured prefix so the source operation is
 *      identifiable in production logs.
 *   2. Shows the user a toast so they know to refresh / retry.
 *
 * It does NOT handle revert — each store's data shape is different and
 * reverting belongs in the store body (see forms.ts addForm/updateForm
 * for the slug-conflict revert pattern). Use this as the default catch
 * handler when the operation has no special revert logic.
 *
 * Usage:
 *   dbCreateInquiry(workspaceId, payload).catch(surfaceDbError("inquiries.add"));
 */
/** Postgrest schema-cache misses look like real outages but they're a setup
 *  issue — usually a missing migration or a stale PostgREST cache. Detecting
 *  them lets us surface a much more actionable message instead of the
 *  generic "couldn't save" toast. */
function isSchemaCacheError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { message?: string; code?: string; hint?: string };
  const msg = `${e.message ?? ""} ${e.hint ?? ""}`.toLowerCase();
  return (
    e.code === "PGRST205" ||
    msg.includes("could not find the table") ||
    msg.includes("schema cache")
  );
}

// Schema-cache toasts get noisy fast (autosave can fire one per keystroke).
// Throttle to one per minute so the operator gets the signal without being
// drowned in red.
let lastSchemaCacheToastAt = 0;

export function surfaceDbError(operation: string) {
  return (err: unknown) => {
    console.error(`[store] ${operation} DB write failed:`, err);
    if (isSchemaCacheError(err)) {
      const now = Date.now();
      if (now - lastSchemaCacheToastAt > 60_000) {
        lastSchemaCacheToastAt = now;
        toast(
          "Database schema is out of date — a table this page needs doesn't exist yet. Run the latest Supabase migration (or refresh PostgREST's schema cache in the Supabase dashboard), then reload.",
          "error",
        );
      }
      return;
    }
    toast(
      "Couldn't save your change to the server. Reload to see the latest, or try again.",
      "error",
    );
  };
}
