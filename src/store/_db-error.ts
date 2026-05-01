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
export function surfaceDbError(operation: string) {
  return (err: unknown) => {
    console.error(`[store] ${operation} DB write failed:`, err);
    toast(
      "Couldn't save your change to the server. Reload to see the latest, or try again.",
      "error",
    );
  };
}
