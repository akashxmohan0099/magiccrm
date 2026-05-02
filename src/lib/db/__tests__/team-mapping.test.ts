import { describe, it, expect } from "vitest";
import { mapTeamMemberFromDB } from "../team";

describe("mapTeamMemberFromDB", () => {
  it("maps a fully populated team member row", () => {
    const row = {
      id: "tm-1",
      auth_user_id: "auth-1",
      workspace_id: "ws-1",
      name: "Mia Rodriguez",
      email: "mia@example.com",
      phone: "0423456789",
      role: "staff",
      avatar_url: "https://cdn.example.com/mia.jpg",
      bio: "Senior stylist · 8 years",
      social_links: { instagram: "@mia_lash", tiktok: "@miathestylist" },
      status: "active",
      working_hours: {
        mon: { start: "09:00", end: "17:00" },
        tue: { start: "09:00", end: "17:00" },
      },
      days_off: ["sun"],
      leave_periods: [{ start: "2026-12-20", end: "2026-12-31", reason: "Holidays" }],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    };

    const m = mapTeamMemberFromDB(row);

    expect(m).toMatchObject({
      id: "tm-1",
      authUserId: "auth-1",
      workspaceId: "ws-1",
      name: "Mia Rodriguez",
      email: "mia@example.com",
      phone: "0423456789",
      role: "staff",
      avatarUrl: "https://cdn.example.com/mia.jpg",
      bio: "Senior stylist · 8 years",
      status: "active",
    });
    expect(m.socialLinks).toEqual({ instagram: "@mia_lash", tiktok: "@miathestylist" });
    expect(m.workingHours.mon).toEqual({ start: "09:00", end: "17:00" });
    expect(m.daysOff).toEqual(["sun"]);
    expect(m.leavePeriods).toEqual([
      { start: "2026-12-20", end: "2026-12-31", reason: "Holidays" },
    ]);
  });

  it("defaults working_hours / days_off / leave_periods when null", () => {
    // The dashboard relies on these arrays/objects existing — a null
    // working_hours would crash the calendar grid.
    const m = mapTeamMemberFromDB({
      id: "tm-2",
      auth_user_id: "auth-2",
      workspace_id: "ws-1",
      name: "Liam Park",
      email: "liam@example.com",
      role: "staff",
      status: "active",
      working_hours: null,
      days_off: null,
      leave_periods: null,
      created_at: "x",
      updated_at: "x",
    });

    expect(m.workingHours).toEqual({});
    expect(m.daysOff).toEqual([]);
    expect(m.leavePeriods).toEqual([]);
  });

  it("returns undefined optional fields cleanly", () => {
    const m = mapTeamMemberFromDB({
      id: "tm-3",
      auth_user_id: "auth-3",
      workspace_id: "ws-1",
      name: "Alex",
      email: "alex@example.com",
      role: "owner",
      status: "active",
      created_at: "x",
      updated_at: "x",
    });

    expect(m.phone).toBeUndefined();
    expect(m.avatarUrl).toBeUndefined();
    expect(m.bio).toBeUndefined();
    expect(m.socialLinks).toBeUndefined();
  });
});
