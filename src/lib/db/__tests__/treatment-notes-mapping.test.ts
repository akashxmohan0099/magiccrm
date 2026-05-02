import { describe, it, expect } from "vitest";
import { mapTreatmentNoteFromDB } from "../treatment-notes";

describe("mapTreatmentNoteFromDB", () => {
  it("maps a fully populated SOAP note", () => {
    const n = mapTreatmentNoteFromDB({
      id: "note-1",
      workspace_id: "ws-1",
      client_id: "cli-1",
      booking_id: "bk-1",
      service_id: "svc-1",
      author_member_id: "tm-1",
      subjective: "Client reports redness",
      objective: "Mild irritation around lash line",
      assessment: "Likely allergic reaction",
      plan: "Switch to hypoallergenic adhesive",
      notes: "Patch test recommended next visit",
      attachment_urls: ["https://cdn.example/photo1.jpg"],
      locked: true,
      amendments: [{ at: "2026-04-15T10:00:00Z", by: "tm-1", text: "Updated assessment" }],
      created_at: "2026-04-01T00:00:00Z",
      updated_at: "2026-04-15T10:00:00Z",
    });

    expect(n).toMatchObject({
      id: "note-1",
      workspaceId: "ws-1",
      clientId: "cli-1",
      bookingId: "bk-1",
      serviceId: "svc-1",
      authorMemberId: "tm-1",
      subjective: "Client reports redness",
      objective: "Mild irritation around lash line",
      assessment: "Likely allergic reaction",
      plan: "Switch to hypoallergenic adhesive",
      notes: "Patch test recommended next visit",
      locked: true,
    });
    expect(n.attachmentUrls).toEqual(["https://cdn.example/photo1.jpg"]);
    expect(n.amendments).toHaveLength(1);
  });

  it("defaults locked to false; collapses null SOAP fields", () => {
    const n = mapTreatmentNoteFromDB({
      id: "note-2",
      workspace_id: "ws-1",
      client_id: "cli-1",
      booking_id: null,
      service_id: null,
      author_member_id: null,
      subjective: null,
      objective: null,
      assessment: null,
      plan: null,
      notes: null,
      attachment_urls: null,
      locked: null,
      amendments: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(n.locked).toBe(false);
    expect(n.bookingId).toBeUndefined();
    expect(n.subjective).toBeUndefined();
    expect(n.attachmentUrls).toBeUndefined();
    expect(n.amendments).toBeUndefined();
  });
});
