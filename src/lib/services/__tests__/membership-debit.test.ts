import { describe, it, expect } from "vitest";
import {
  planMembershipDebits,
  type ActiveMembership,
  type MembershipDebitItem,
} from "../membership-debit";

function membership(partial: Partial<ActiveMembership> & { id: string }): ActiveMembership {
  return {
    sessionsUsed: 0,
    sessionsPerPeriod: 0,
    serviceIds: new Set<string>(),
    ...partial,
  };
}

function item(serviceId: string, isGuest = false): MembershipDebitItem {
  return { serviceId, isGuest };
}

describe("planMembershipDebits", () => {
  it("returns no debits when no memberships exist", () => {
    const plan = planMembershipDebits([], [item("svc-a"), item("svc-b")]);
    expect(plan.perItem).toEqual([null, null]);
    expect(plan.debits.size).toBe(0);
  });

  it("debits a covered service against the matching membership", () => {
    const mem = membership({
      id: "mem-1",
      sessionsUsed: 0,
      sessionsPerPeriod: 4,
      serviceIds: new Set(["svc-a"]),
    });
    const plan = planMembershipDebits([mem], [item("svc-a")]);
    expect(plan.perItem).toEqual(["mem-1"]);
    expect(plan.debits.get("mem-1")).toBe(1);
  });

  it("debits the same membership multiple times in one basket when sessions remain", () => {
    const mem = membership({
      id: "mem-1",
      sessionsUsed: 1,
      sessionsPerPeriod: 5,
      serviceIds: new Set(["svc-a", "svc-b"]),
    });
    const plan = planMembershipDebits(
      [mem],
      [item("svc-a"), item("svc-b"), item("svc-a")],
    );
    expect(plan.perItem).toEqual(["mem-1", "mem-1", "mem-1"]);
    expect(plan.debits.get("mem-1")).toBe(3);
  });

  it("stops debiting once the per-period cap is reached", () => {
    const mem = membership({
      id: "mem-1",
      sessionsUsed: 3,
      sessionsPerPeriod: 4,
      serviceIds: new Set(["svc-a"]),
    });
    const plan = planMembershipDebits(
      [mem],
      [item("svc-a"), item("svc-a"), item("svc-a")],
    );
    // Only one slot left — first item draws it, the rest fall through.
    expect(plan.perItem).toEqual(["mem-1", null, null]);
    expect(plan.debits.get("mem-1")).toBe(1);
  });

  it("treats sessionsPerPeriod === 0 as unlimited", () => {
    const mem = membership({
      id: "mem-1",
      sessionsUsed: 99,
      sessionsPerPeriod: 0,
      serviceIds: new Set(["svc-a"]),
    });
    const plan = planMembershipDebits([mem], [item("svc-a"), item("svc-a")]);
    expect(plan.perItem).toEqual(["mem-1", "mem-1"]);
    expect(plan.debits.get("mem-1")).toBe(2);
  });

  it("skips services not covered by any membership", () => {
    const mem = membership({
      id: "mem-1",
      sessionsPerPeriod: 5,
      serviceIds: new Set(["svc-a"]),
    });
    const plan = planMembershipDebits(
      [mem],
      [item("svc-a"), item("svc-other"), item("svc-a")],
    );
    expect(plan.perItem).toEqual(["mem-1", null, "mem-1"]);
    expect(plan.debits.get("mem-1")).toBe(2);
  });

  it("never debits guest items even when the service is covered", () => {
    const mem = membership({
      id: "mem-1",
      sessionsPerPeriod: 5,
      serviceIds: new Set(["svc-a"]),
    });
    const plan = planMembershipDebits(
      [mem],
      [item("svc-a"), item("svc-a", true), item("svc-a")],
    );
    expect(plan.perItem).toEqual(["mem-1", null, "mem-1"]);
    expect(plan.debits.get("mem-1")).toBe(2);
  });

  it("picks the first matching membership when multiple cover the same service", () => {
    const memA = membership({
      id: "mem-a",
      sessionsPerPeriod: 5,
      serviceIds: new Set(["svc-a"]),
    });
    const memB = membership({
      id: "mem-b",
      sessionsPerPeriod: 5,
      serviceIds: new Set(["svc-a", "svc-b"]),
    });
    const plan = planMembershipDebits([memA, memB], [item("svc-a")]);
    expect(plan.perItem).toEqual(["mem-a"]);
    expect(plan.debits.get("mem-a")).toBe(1);
    expect(plan.debits.has("mem-b")).toBe(false);
  });

  it("falls through to the next membership once the first is exhausted", () => {
    const memA = membership({
      id: "mem-a",
      sessionsUsed: 4,
      sessionsPerPeriod: 5,
      serviceIds: new Set(["svc-a"]),
    });
    const memB = membership({
      id: "mem-b",
      sessionsPerPeriod: 5,
      serviceIds: new Set(["svc-a"]),
    });
    const plan = planMembershipDebits(
      [memA, memB],
      [item("svc-a"), item("svc-a"), item("svc-a")],
    );
    // memA has 1 left, then memB picks up. Current implementation keeps
    // scanning from the top of the list, so once memA is full it falls
    // through to memB on the next iteration.
    expect(plan.perItem[0]).toBe("mem-a");
    expect(plan.perItem[1]).toBe("mem-b");
    expect(plan.perItem[2]).toBe("mem-b");
    expect(plan.debits.get("mem-a")).toBe(1);
    expect(plan.debits.get("mem-b")).toBe(2);
  });
});
