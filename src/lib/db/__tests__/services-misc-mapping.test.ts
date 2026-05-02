import { describe, it, expect } from "vitest";
import {
  mapServiceCategoryFromDB,
  mapLibraryAddonFromDB,
  mapMemberServiceFromDB,
} from "../services";

describe("mapServiceCategoryFromDB", () => {
  it("maps a category row", () => {
    const c = mapServiceCategoryFromDB({
      id: "cat-1",
      workspace_id: "ws-1",
      name: "Hair",
      color: "#8B5CF6",
      sort_order: 0,
      created_at: "x",
      updated_at: "x",
    });

    expect(c).toMatchObject({
      id: "cat-1",
      workspaceId: "ws-1",
      name: "Hair",
      color: "#8B5CF6",
      sortOrder: 0,
    });
  });

  it("defaults sortOrder=0 and collapses null color", () => {
    const c = mapServiceCategoryFromDB({
      id: "cat-2",
      workspace_id: "ws-1",
      name: "Nails",
      color: null,
      sort_order: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(c.sortOrder).toBe(0);
    expect(c.color).toBeUndefined();
  });
});

describe("mapLibraryAddonFromDB", () => {
  it("coerces price/duration to numbers", () => {
    const a = mapLibraryAddonFromDB({
      id: "la-1",
      workspace_id: "ws-1",
      name: "Scalp massage",
      price: "20.00",
      duration: "10",
      created_at: "x",
      updated_at: "x",
    });
    expect(a.price).toBe(20);
    expect(a.duration).toBe(10);
    expect(typeof a.price).toBe("number");
  });

  it("defaults price/duration to 0 when null", () => {
    const a = mapLibraryAddonFromDB({
      id: "la-2",
      workspace_id: "ws-1",
      name: "Free sample",
      price: null,
      duration: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(a.price).toBe(0);
    expect(a.duration).toBe(0);
  });
});

describe("mapMemberServiceFromDB", () => {
  it("maps a member-service assignment", () => {
    const ms = mapMemberServiceFromDB({
      id: "ms-1",
      workspace_id: "ws-1",
      member_id: "tm-1",
      service_id: "svc-1",
      price_override: "85.00",
      duration_override: 75,
    });
    expect(ms).toMatchObject({
      id: "ms-1",
      workspaceId: "ws-1",
      memberId: "tm-1",
      serviceId: "svc-1",
      priceOverride: 85,
      durationOverride: 75,
    });
  });

  it("collapses null overrides to undefined", () => {
    const ms = mapMemberServiceFromDB({
      id: "ms-2",
      workspace_id: "ws-1",
      member_id: "tm-1",
      service_id: "svc-1",
      price_override: null,
      duration_override: null,
    });
    expect(ms.priceOverride).toBeUndefined();
    expect(ms.durationOverride).toBeUndefined();
  });
});
