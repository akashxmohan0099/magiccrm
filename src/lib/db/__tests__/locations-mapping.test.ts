import { describe, it, expect } from "vitest";
import { mapLocationFromDB } from "../locations";

describe("mapLocationFromDB", () => {
  it("maps a fully populated location", () => {
    const l = mapLocationFromDB({
      id: "loc-1",
      workspace_id: "ws-1",
      name: "Burleigh Studio",
      address: "42 Palm Avenue",
      kind: "studio",
      enabled: true,
      sort_order: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });

    expect(l).toMatchObject({
      id: "loc-1",
      workspaceId: "ws-1",
      name: "Burleigh Studio",
      address: "42 Palm Avenue",
      kind: "studio",
      enabled: true,
      sortOrder: 0,
    });
  });

  it("defaults kind=studio, enabled=true, sortOrder=0", () => {
    const l = mapLocationFromDB({
      id: "loc-2",
      workspace_id: "ws-1",
      name: "Pop-up",
      address: null,
      kind: null,
      enabled: null,
      sort_order: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(l.kind).toBe("studio");
    expect(l.enabled).toBe(true);
    expect(l.sortOrder).toBe(0);
    expect(l.address).toBeUndefined();
  });
});
