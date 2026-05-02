import { describe, it, expect } from "vitest";
import { mapResourceFromDB } from "../resources";

describe("mapResourceFromDB", () => {
  it("maps a fully populated resource", () => {
    const r = mapResourceFromDB({
      id: "res-1",
      workspace_id: "ws-1",
      name: "Treatment room A",
      kind: "room",
      location_ids: ["loc-1", "loc-2"],
      enabled: true,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });

    expect(r).toMatchObject({
      id: "res-1",
      workspaceId: "ws-1",
      name: "Treatment room A",
      kind: "room",
      locationIds: ["loc-1", "loc-2"],
      enabled: true,
      sortOrder: 1,
    });
  });

  it("defaults enabled=true, sortOrder=0; collapses null kind/location_ids", () => {
    const r = mapResourceFromDB({
      id: "res-2",
      workspace_id: "ws-1",
      name: "Chair 3",
      kind: null,
      location_ids: null,
      enabled: null,
      sort_order: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(r.kind).toBeUndefined();
    expect(r.locationIds).toBeUndefined();
    expect(r.enabled).toBe(true);
    expect(r.sortOrder).toBe(0);
  });
});
