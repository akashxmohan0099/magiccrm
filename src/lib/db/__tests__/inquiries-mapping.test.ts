import { describe, it, expect } from "vitest";
import { mapInquiryFromDB } from "../inquiries";

describe("mapInquiryFromDB", () => {
  it("maps a fully populated inquiry row", () => {
    const row = {
      id: "inq-1",
      workspace_id: "ws-1",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "0412345678",
      message: "Looking for a wedding-day trial",
      service_interest: "bridal-trial",
      event_type: "wedding",
      date_range: "2026-09-01..2026-09-30",
      source: "website",
      status: "new",
      conversation_id: "conv-1",
      form_id: "form-1",
      form_response_id: "fr-1",
      booking_id: null,
      client_id: null,
      notes: "VIP referral",
      submission_values: { budget: "500", guests: "1" },
      created_at: "2026-05-01T00:00:00Z",
      updated_at: "2026-05-01T00:00:00Z",
    };

    const i = mapInquiryFromDB(row);

    expect(i).toMatchObject({
      id: "inq-1",
      workspaceId: "ws-1",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "0412345678",
      message: "Looking for a wedding-day trial",
      serviceInterest: "bridal-trial",
      eventType: "wedding",
      dateRange: "2026-09-01..2026-09-30",
      source: "website",
      status: "new",
      conversationId: "conv-1",
      formId: "form-1",
      formResponseId: "fr-1",
      notes: "VIP referral",
    });
    expect(i.submissionValues).toEqual({ budget: "500", guests: "1" });
    expect(i.bookingId).toBeUndefined();
    expect(i.clientId).toBeUndefined();
  });

  it("handles a sparse inquiry (just the required fields)", () => {
    const i = mapInquiryFromDB({
      id: "inq-2",
      workspace_id: "ws-1",
      name: "",
      email: null,
      phone: null,
      message: null,
      source: "form",
      status: "new",
      created_at: "x",
      updated_at: "x",
    });

    expect(i.email).toBe("");
    expect(i.phone).toBe("");
    expect(i.message).toBe("");
    expect(i.serviceInterest).toBeUndefined();
    expect(i.notes).toBeUndefined();
    expect(i.submissionValues).toBeUndefined();
  });

  it("never leaks snake_case keys", () => {
    const i = mapInquiryFromDB({
      id: "inq-3",
      workspace_id: "ws-1",
      name: "x",
      email: "x",
      phone: "x",
      message: "x",
      source: "website",
      status: "new",
      created_at: "x",
      updated_at: "x",
    }) as Record<string, unknown>;
    for (const k of Object.keys(i)) {
      expect(k).not.toMatch(/_/);
    }
  });
});
