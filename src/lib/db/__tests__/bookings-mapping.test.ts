import { describe, it, expect } from "vitest";
import { mapBookingFromDB } from "../bookings";

describe("mapBookingFromDB", () => {
  it("maps a fully populated booking row", () => {
    const row = {
      id: "bk-1",
      workspace_id: "ws-1",
      client_id: "cli-1",
      service_id: "svc-1",
      additional_service_ids: ["svc-2", "svc-3"],
      assigned_to_id: "tm-1",
      date: "2026-06-01",
      start_at: "2026-06-01T10:00:00Z",
      end_at: "2026-06-01T11:00:00Z",
      status: "confirmed",
      notes: "first time",
      inquiry_id: "inq-1",
      conversation_id: "conv-1",
      cancellation_reason: null,
      reminder_sent_at: "2026-05-31T10:00:00Z",
      followup_sent_at: null,
      review_request_sent_at: null,
      intake_form_sent_at: "2026-05-30T10:00:00Z",
      group_parent_booking_id: null,
      group_guest_name: null,
      selected_variant_id: "var-medium",
      selected_addon_ids: ["add-1"],
      resolved_price: "150.50",
      gift_card_code: null,
      membership_id: null,
      intake_answers: { q1: "yes" },
      location_id: "loc-1",
      location_type: "studio",
      address: null,
      created_at: "2026-05-01T00:00:00Z",
      updated_at: "2026-05-31T00:00:00Z",
    };

    const b = mapBookingFromDB(row);

    expect(b).toMatchObject({
      id: "bk-1",
      workspaceId: "ws-1",
      clientId: "cli-1",
      serviceId: "svc-1",
      additionalServiceIds: ["svc-2", "svc-3"],
      assignedToId: "tm-1",
      status: "confirmed",
      notes: "first time",
      inquiryId: "inq-1",
      conversationId: "conv-1",
      reminderSentAt: "2026-05-31T10:00:00Z",
      intakeFormSentAt: "2026-05-30T10:00:00Z",
      selectedVariantId: "var-medium",
      selectedAddonIds: ["add-1"],
      locationId: "loc-1",
      locationType: "studio",
    });
    expect(b.intakeAnswers).toEqual({ q1: "yes" });
  });

  it("coerces resolved_price string into a number", () => {
    const b = mapBookingFromDB({
      id: "bk-1",
      workspace_id: "ws-1",
      client_id: "cli-1",
      date: "2026-06-01",
      start_at: "2026-06-01T10:00:00Z",
      end_at: "2026-06-01T11:00:00Z",
      status: "confirmed",
      resolved_price: "199.95",
      created_at: "x",
      updated_at: "x",
    });
    expect(b.resolvedPrice).toBe(199.95);
    expect(typeof b.resolvedPrice).toBe("number");
  });

  it("returns undefined for a null resolved_price (not 0)", () => {
    // Important: Number(null) === 0 would silently turn unpriced bookings
    // into free ones. The mapper has to special-case null.
    const b = mapBookingFromDB({
      id: "bk-1",
      workspace_id: "ws-1",
      client_id: "cli-1",
      date: "2026-06-01",
      start_at: "x",
      end_at: "x",
      status: "confirmed",
      resolved_price: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(b.resolvedPrice).toBeUndefined();
  });

  it("falls back gracefully on missing optional arrays", () => {
    const b = mapBookingFromDB({
      id: "bk-1",
      workspace_id: "ws-1",
      client_id: "cli-1",
      date: "2026-06-01",
      start_at: "x",
      end_at: "x",
      status: "pending",
      created_at: "x",
      updated_at: "x",
    });
    expect(b.additionalServiceIds).toBeUndefined();
    expect(b.selectedAddonIds).toBeUndefined();
    expect(b.intakeAnswers).toBeUndefined();
    expect(b.notes).toBe("");
  });
});
