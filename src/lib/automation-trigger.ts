import type { Booking, BookingStatus, PaymentDocument } from "@/types/models";

/**
 * Map booking status → automation rule type.
 * Only transitions that should fire an event-driven rule are included.
 */
const STATUS_TO_RULE: Partial<Record<BookingStatus, string>> = {
  cancelled: "cancellation_confirmation",
  no_show: "no_show_followup",
};

/**
 * Fire-and-forget: call /api/automations/trigger.
 * No-op on the server. Errors are swallowed — the UI mutation already succeeded.
 */
function fireTrigger(
  type: string,
  entityId: string | undefined,
  entityData: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;

  void fetch("/api/automations/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, entityId, entityData }),
  }).catch(() => {
    // Silent: automation firing is best-effort.
  });
}

export function fireAutomationForBooking(
  booking: Booking,
  newStatus: BookingStatus,
): void {
  const ruleType = STATUS_TO_RULE[newStatus];
  if (!ruleType) return;

  const entityData: Record<string, unknown> = {
    bookingId: booking.id,
    date: booking.date,
  };

  if (booking.startAt) {
    try {
      entityData.time = new Date(booking.startAt).toLocaleTimeString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      // ignore — leave time undefined
    }
  }

  fireTrigger(ruleType, booking.clientId, entityData);
}

/**
 * Fire `invoice_auto_send` when an invoice moves to `sent` status.
 * Only fires for invoice documents (not quotes).
 */
export function fireAutomationForInvoiceSent(doc: PaymentDocument): void {
  if (doc.label !== "invoice") return;

  const entityData: Record<string, unknown> = {
    invoiceNumber: doc.documentNumber,
    total: doc.total.toFixed(2),
    paymentUrl: doc.stripeHostedUrl,
  };

  fireTrigger("invoice_auto_send", doc.clientId, entityData);
}
