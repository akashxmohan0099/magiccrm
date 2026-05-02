import { describe, it, expect } from "vitest";
import { mapFormFromDB } from "../forms";

describe("mapFormFromDB", () => {
  it("maps a fully populated form row", () => {
    const row = {
      id: "form-1",
      workspace_id: "ws-1",
      type: "booking",
      name: "New client intake",
      fields: [
        { id: "f-name", type: "text", label: "Full name", required: true },
        { id: "f-email", type: "email", label: "Email", required: true },
      ],
      branding: { primaryColor: "#8B5CF6", logoUrl: "https://x" },
      slug: "intake",
      enabled: true,
      auto_promote_to_inquiry: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    };

    const f = mapFormFromDB(row);

    expect(f).toMatchObject({
      id: "form-1",
      workspaceId: "ws-1",
      type: "booking",
      name: "New client intake",
      slug: "intake",
      enabled: true,
      autoPromoteToInquiry: true,
    });
    expect(f.fields).toHaveLength(2);
    expect(f.branding).toEqual({ primaryColor: "#8B5CF6", logoUrl: "https://x" });
  });

  it("defaults branding to {} and autoPromoteToInquiry to false", () => {
    const f = mapFormFromDB({
      id: "form-2",
      workspace_id: "ws-1",
      type: "inquiry",
      name: "Quick contact",
      fields: [],
      branding: null,
      slug: null,
      enabled: false,
      auto_promote_to_inquiry: null,
      created_at: "x",
      updated_at: "x",
    });

    expect(f.branding).toEqual({});
    expect(f.autoPromoteToInquiry).toBe(false);
    expect(f.slug).toBeUndefined();
    expect(f.enabled).toBe(false);
  });
});
