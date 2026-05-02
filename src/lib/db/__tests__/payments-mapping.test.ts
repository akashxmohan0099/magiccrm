import { describe, it, expect } from "vitest";
import { mapPaymentDocumentFromDB } from "../payments";

describe("mapPaymentDocumentFromDB", () => {
  it("maps a fully populated payment document row", () => {
    const row = {
      id: "doc-1",
      workspace_id: "ws-1",
      document_number: "INV-0042",
      client_id: "cli-1",
      booking_id: "bk-1",
      label: "invoice",
      status: "paid",
      payment_method: "card",
      stripe_invoice_id: "in_123",
      stripe_hosted_url: "https://invoice.stripe.com/i/abc",
      total: 320,
      notes: "Includes deposit",
      sent_at: "2026-04-01T00:00:00Z",
      paid_at: "2026-04-02T00:00:00Z",
      due_date: "2026-04-15",
      created_at: "2026-04-01T00:00:00Z",
      updated_at: "2026-04-02T00:00:00Z",
    };

    const d = mapPaymentDocumentFromDB(row);

    expect(d).toMatchObject({
      id: "doc-1",
      workspaceId: "ws-1",
      documentNumber: "INV-0042",
      clientId: "cli-1",
      bookingId: "bk-1",
      label: "invoice",
      status: "paid",
      paymentMethod: "card",
      stripeInvoiceId: "in_123",
      stripeHostedUrl: "https://invoice.stripe.com/i/abc",
      total: 320,
      notes: "Includes deposit",
      sentAt: "2026-04-01T00:00:00Z",
      paidAt: "2026-04-02T00:00:00Z",
      dueDate: "2026-04-15",
    });
  });

  it("normalises null optional fields", () => {
    const d = mapPaymentDocumentFromDB({
      id: "doc-2",
      workspace_id: "ws-1",
      document_number: "EST-0001",
      client_id: "cli-1",
      booking_id: null,
      label: "estimate",
      status: "draft",
      payment_method: null,
      stripe_invoice_id: null,
      stripe_hosted_url: null,
      total: 0,
      notes: null,
      sent_at: null,
      paid_at: null,
      due_date: null,
      created_at: "x",
      updated_at: "x",
    });

    expect(d.bookingId).toBeUndefined();
    expect(d.paymentMethod).toBeUndefined();
    expect(d.stripeInvoiceId).toBeUndefined();
    expect(d.stripeHostedUrl).toBeUndefined();
    expect(d.notes).toBe("");
    expect(d.sentAt).toBeUndefined();
    expect(d.paidAt).toBeUndefined();
    expect(d.dueDate).toBeUndefined();
  });
});
