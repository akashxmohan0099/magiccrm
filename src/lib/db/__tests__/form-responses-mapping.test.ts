import { describe, it, expect } from "vitest";
import { mapFormResponseFromDB } from "../form-responses";

describe("mapFormResponseFromDB", () => {
  it("maps a fully populated response", () => {
    const r = mapFormResponseFromDB({
      id: "fr-1",
      workspace_id: "ws-1",
      form_id: "form-1",
      values: { name: "Jane", email: "jane@x.com", phone: "0412" },
      contact_name: "Jane",
      contact_email: "jane@x.com",
      contact_phone: "0412",
      inquiry_id: "inq-1",
      submitted_at: "2026-05-01T10:00:00Z",
    });

    expect(r).toMatchObject({
      id: "fr-1",
      workspaceId: "ws-1",
      formId: "form-1",
      contactName: "Jane",
      contactEmail: "jane@x.com",
      contactPhone: "0412",
      inquiryId: "inq-1",
      submittedAt: "2026-05-01T10:00:00Z",
    });
    expect(r.values).toEqual({ name: "Jane", email: "jane@x.com", phone: "0412" });
  });

  it("defaults values to {} and collapses null contact fields", () => {
    const r = mapFormResponseFromDB({
      id: "fr-2",
      workspace_id: "ws-1",
      form_id: null,
      values: null,
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      inquiry_id: null,
      submitted_at: "x",
    });
    expect(r.values).toEqual({});
    expect(r.formId).toBeUndefined();
    expect(r.contactName).toBeUndefined();
    expect(r.contactEmail).toBeUndefined();
    expect(r.contactPhone).toBeUndefined();
    expect(r.inquiryId).toBeUndefined();
  });
});
