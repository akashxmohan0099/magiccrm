import { describe, it, expect } from "vitest";
import { mapGiftCardFromDB } from "../gift-cards";

describe("mapGiftCardFromDB", () => {
  it("maps a fully populated gift card", () => {
    const g = mapGiftCardFromDB({
      id: "gc-1",
      workspace_id: "ws-1",
      code: "GIFT-2026-ABC123",
      original_amount: "200.00",
      remaining_balance: "150.50",
      status: "active",
      purchaser_name: "Sophie",
      purchaser_email: "sophie@example.com",
      recipient_name: "Mum",
      recipient_email: "mum@example.com",
      expires_at: "2027-12-31",
      created_at: "2026-04-01T00:00:00Z",
      updated_at: "2026-04-15T00:00:00Z",
    });

    expect(g).toMatchObject({
      id: "gc-1",
      workspaceId: "ws-1",
      code: "GIFT-2026-ABC123",
      originalAmount: 200,
      remainingBalance: 150.5,
      status: "active",
      purchaserName: "Sophie",
      purchaserEmail: "sophie@example.com",
      recipientName: "Mum",
      recipientEmail: "mum@example.com",
      expiresAt: "2027-12-31",
    });
  });

  it("coerces numeric strings to numbers (not 0)", () => {
    // Postgres NUMERIC comes back as string by default — the mapper has to
    // coerce or every gift card balance would become NaN downstream.
    const g = mapGiftCardFromDB({
      id: "gc-2",
      workspace_id: "ws-1",
      code: "X",
      original_amount: "99.95",
      remaining_balance: "0.00",
      created_at: "x",
      updated_at: "x",
    });
    expect(typeof g.originalAmount).toBe("number");
    expect(g.originalAmount).toBe(99.95);
    expect(g.remainingBalance).toBe(0);
  });

  it("defaults amounts to 0 and status to active when null", () => {
    const g = mapGiftCardFromDB({
      id: "gc-3",
      workspace_id: "ws-1",
      code: "Y",
      original_amount: null,
      remaining_balance: null,
      status: null,
      purchaser_name: null,
      purchaser_email: null,
      recipient_name: null,
      recipient_email: null,
      expires_at: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(g.originalAmount).toBe(0);
    expect(g.remainingBalance).toBe(0);
    expect(g.status).toBe("active");
    expect(g.purchaserName).toBeUndefined();
    expect(g.expiresAt).toBeUndefined();
  });
});
