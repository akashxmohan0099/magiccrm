/**
 * Fire-and-forget automation trigger.
 * Call this from any module when a triggerable event happens.
 *
 * @example
 * fireAutomation(workspaceId, "booking-created", booking.id, { type: "bookings" });
 * fireAutomation(workspaceId, "invoice-overdue", invoice.id, { type: "invoices", table: "invoices" });
 */
export function fireAutomation(
  workspaceId: string | null,
  trigger: string,
  entityId?: string,
  entityData?: Record<string, string>,
): void {
  if (!workspaceId) return;

  // Fire-and-forget — don't block the caller
  fetch("/api/automations/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, trigger, entityId, entityData }),
  }).catch((err) => {
    console.error("[automation-trigger] Failed to fire:", err);
  });
}
