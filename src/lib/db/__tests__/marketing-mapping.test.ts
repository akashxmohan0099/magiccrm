import { describe, it, expect } from "vitest";
import { mapCampaignFromDB } from "../marketing";

describe("mapCampaignFromDB", () => {
  it("maps a fully populated campaign", () => {
    const c = mapCampaignFromDB({
      id: "camp-1",
      workspace_id: "ws-1",
      name: "Spring Promo",
      subject: "20% off facials",
      body: "Limited time only",
      channel: "email",
      target_segment: "all",
      inactive_days: 30,
      status: "scheduled",
      scheduled_at: "2026-09-01T09:00:00Z",
      sent_count: 100,
      open_count: 45,
      click_count: 12,
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-15T00:00:00Z",
    });

    expect(c).toMatchObject({
      id: "camp-1",
      workspaceId: "ws-1",
      name: "Spring Promo",
      subject: "20% off facials",
      body: "Limited time only",
      channel: "email",
      targetSegment: "all",
      inactiveDays: 30,
      status: "scheduled",
      scheduledAt: "2026-09-01T09:00:00Z",
      sentCount: 100,
      openCount: 45,
      clickCount: 12,
    });
  });

  it("defaults counters to 0 and body to empty when null", () => {
    const c = mapCampaignFromDB({
      id: "camp-2",
      workspace_id: "ws-1",
      name: "Draft",
      subject: null,
      body: null,
      channel: "email",
      target_segment: "inactive",
      inactive_days: null,
      status: "draft",
      scheduled_at: null,
      sent_count: null,
      open_count: null,
      click_count: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(c.body).toBe("");
    expect(c.subject).toBeUndefined();
    expect(c.scheduledAt).toBeUndefined();
    expect(c.inactiveDays).toBeUndefined();
    expect(c.sentCount).toBe(0);
    expect(c.openCount).toBe(0);
    expect(c.clickCount).toBe(0);
  });
});
