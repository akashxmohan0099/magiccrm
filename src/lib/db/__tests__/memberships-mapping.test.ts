import { describe, it, expect } from "vitest";
import {
  mapMembershipPlanFromDB,
  mapClientMembershipFromDB,
} from "../memberships";

describe("mapMembershipPlanFromDB", () => {
  it("maps a fully populated plan", () => {
    const p = mapMembershipPlanFromDB({
      id: "plan-1",
      workspace_id: "ws-1",
      name: "Glow Monthly",
      description: "1 facial / month",
      service_ids: ["svc-1", "svc-2"],
      sessions_per_period: 1,
      price: "120.00",
      billing_cycle: "monthly",
      enabled: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });

    expect(p).toMatchObject({
      id: "plan-1",
      workspaceId: "ws-1",
      name: "Glow Monthly",
      description: "1 facial / month",
      sessionsPerPeriod: 1,
      price: 120,
      billingCycle: "monthly",
      enabled: true,
    });
    expect(p.serviceIds).toEqual(["svc-1", "svc-2"]);
  });

  it("applies defaults when columns are null", () => {
    const p = mapMembershipPlanFromDB({
      id: "plan-2",
      workspace_id: "ws-1",
      name: "Free trial",
      description: null,
      service_ids: null,
      sessions_per_period: null,
      price: null,
      billing_cycle: null,
      enabled: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(p.description).toBe("");
    expect(p.serviceIds).toEqual([]);
    expect(p.sessionsPerPeriod).toBe(0);
    expect(p.price).toBe(0);
    expect(p.billingCycle).toBe("monthly");
    expect(p.enabled).toBe(true);
  });
});

describe("mapClientMembershipFromDB", () => {
  it("maps a fully populated subscription", () => {
    const s = mapClientMembershipFromDB({
      id: "sub-1",
      workspace_id: "ws-1",
      client_id: "cli-1",
      plan_id: "plan-1",
      status: "active",
      sessions_used: 2,
      current_period_start: "2026-04-01T00:00:00Z",
      next_renewal_date: "2026-05-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-04-01T00:00:00Z",
    });

    expect(s).toMatchObject({
      id: "sub-1",
      workspaceId: "ws-1",
      clientId: "cli-1",
      planId: "plan-1",
      status: "active",
      sessionsUsed: 2,
      currentPeriodStart: "2026-04-01T00:00:00Z",
      nextRenewalDate: "2026-05-01T00:00:00Z",
    });
  });

  it("defaults sessionsUsed=0, status=active when null", () => {
    const s = mapClientMembershipFromDB({
      id: "sub-2",
      workspace_id: "ws-1",
      client_id: "cli-1",
      plan_id: "plan-1",
      status: null,
      sessions_used: null,
      current_period_start: "x",
      next_renewal_date: null,
      created_at: "x",
      updated_at: "x",
    });
    expect(s.status).toBe("active");
    expect(s.sessionsUsed).toBe(0);
    expect(s.nextRenewalDate).toBeUndefined();
  });
});
