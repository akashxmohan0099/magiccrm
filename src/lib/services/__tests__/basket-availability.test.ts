import { describe, it, expect } from "vitest";
import {
  computeAvailability,
  computeBasketAvailability,
  type BasketItemInput,
} from "../availability";
import type { Service, TeamMember, MemberService, Booking } from "@/types/models";

/**
 * Tests for the multi-service basket availability engine. Verifies the
 * fix for the bug the external reviewer flagged: client-side estimates
 * showed slots that the server later rejected because not every basket
 * item could fit end-to-end.
 *
 * Each test asserts a specific real-world failure mode:
 *  - Single-item basket should match the existing engine
 *  - Two-item sequence: slot must allow both end-to-end
 *  - Artist coverage gap: artist A can do item 1, only B can do item 2
 *    → no slot bookable unless one artist can do both, or the chain falls
 *    inside both artists' free windows
 *  - Resource conflict mid-basket: the resource is busy during item 2
 *  - Buffer between items: item 2 starts at item 1.end + bufferAfter
 */
const baseService = (overrides: Partial<Service> = {}): Service =>
  ({
    id: "svc",
    workspaceId: "ws",
    name: "x",
    description: "",
    duration: 60,
    price: 100,
    category: "x",
    enabled: true,
    sortOrder: 0,
    bufferBefore: 0,
    bufferAfter: 0,
    bufferMinutes: 0,
    requiresConfirmation: false,
    depositType: "none",
    depositAmount: 0,
    locationType: "studio",
    createdAt: "x",
    updatedAt: "x",
    ...overrides,
  }) as Service;

const mem = (id: string, overrides: Partial<TeamMember> = {}): TeamMember =>
  ({
    id,
    authUserId: `auth-${id}`,
    workspaceId: "ws",
    name: id.toUpperCase(),
    email: `${id}@x.com`,
    role: "staff",
    status: "active",
    workingHours: {
      mon: { start: "09:00", end: "17:00" },
      tue: { start: "09:00", end: "17:00" },
      wed: { start: "09:00", end: "17:00" },
      thu: { start: "09:00", end: "17:00" },
      fri: { start: "09:00", end: "17:00" },
    },
    daysOff: [],
    leavePeriods: [],
    createdAt: "x",
    updatedAt: "x",
    ...overrides,
  }) as TeamMember;

const workingHours = {
  mon: { start: "09:00", end: "17:00" },
  tue: { start: "09:00", end: "17:00" },
  wed: { start: "09:00", end: "17:00" },
  thu: { start: "09:00", end: "17:00" },
  fri: { start: "09:00", end: "17:00" },
};

// 2026-05-04 is a Monday, deterministic for the engine's weekday lookup.
const DATE = "2026-05-04";

describe("computeBasketAvailability", () => {
  it("returns no slots when basket is empty", () => {
    expect(
      computeBasketAvailability({
        date: DATE,
        items: [],
        workingHours,
        bookings: [],
        members: [mem("a")],
      }),
    ).toEqual([]);
  });

  it("single-item basket matches the single-service engine slot count", () => {
    const svc = baseService({ id: "s1", duration: 60 });
    const members = [mem("a")];
    const memberServices: MemberService[] = [];
    const item: BasketItemInput = { service: svc, memberServices };

    const basketSlots = computeBasketAvailability({
      date: DATE,
      items: [item],
      workingHours,
      bookings: [],
      members,
    });

    const singleSlots = computeAvailability({
      date: DATE,
      service: svc,
      workingHours,
      bookings: [],
      members,
      memberServices,
    });

    expect(basketSlots.length).toBe(singleSlots.length);
    expect(basketSlots.length).toBeGreaterThan(0);
  });

  it("two-item sequence: each item placed end-to-end with one artist", () => {
    const s1 = baseService({ id: "s1", duration: 60 });
    const s2 = baseService({ id: "s2", duration: 30 });
    const members = [mem("a")];
    const memberServices: MemberService[] = [];

    const slots = computeBasketAvailability({
      date: DATE,
      items: [
        { service: s1, memberServices },
        { service: s2, memberServices },
      ],
      workingHours,
      bookings: [],
      members,
    });

    expect(slots.length).toBeGreaterThan(0);
    const first = slots[0];
    expect(first.assignments).toHaveLength(2);
    // Item 2 starts exactly when item 1 ends (no buffer in this case).
    expect(first.assignments[1].startAt).toBe(first.assignments[0].endAt);
    expect(first.assignments[0].memberId).toBe("a");
    expect(first.assignments[1].memberId).toBe("a");
  });

  it("artist coverage gap: items can use different artists if both are free", () => {
    // s1 only artist A can do; s2 only artist B can do.
    // Both A and B are free all day → basket should still find slots.
    const s1 = baseService({ id: "s1", duration: 60 });
    const s2 = baseService({ id: "s2", duration: 60 });
    const members = [mem("a"), mem("b")];
    const memberServices: MemberService[] = [
      { id: "ms1", memberId: "a", serviceId: "s1", workspaceId: "ws" } as MemberService,
      { id: "ms2", memberId: "b", serviceId: "s2", workspaceId: "ws" } as MemberService,
    ];

    const slots = computeBasketAvailability({
      date: DATE,
      items: [
        { service: s1, memberServices },
        { service: s2, memberServices },
      ],
      workingHours,
      bookings: [],
      members,
    });

    expect(slots.length).toBeGreaterThan(0);
    const first = slots[0];
    expect(first.assignments[0].memberId).toBe("a");
    expect(first.assignments[1].memberId).toBe("b");
  });

  it("artist coverage gap with B unavailable: no slots", () => {
    // s1 needs A, s2 needs B. B is on leave today → basket can't be served.
    const s1 = baseService({ id: "s1", duration: 60 });
    const s2 = baseService({ id: "s2", duration: 60 });
    const members = [
      mem("a"),
      mem("b", { leavePeriods: [{ start: DATE, end: DATE, reason: "sick" }] }),
    ];
    // Sanity: verify the helper actually applied the override.
    expect(members[1].leavePeriods).toHaveLength(1);
    expect(members[1].leavePeriods![0].start).toBe(DATE);
    const memberServices: MemberService[] = [
      { id: "ms1", memberId: "a", serviceId: "s1", workspaceId: "ws" } as MemberService,
      { id: "ms2", memberId: "b", serviceId: "s2", workspaceId: "ws" } as MemberService,
    ];

    const slots = computeBasketAvailability({
      date: DATE,
      items: [
        { service: s1, memberServices },
        { service: s2, memberServices },
      ],
      workingHours,
      bookings: [],
      members,
    });

    expect(slots).toEqual([]);
  });

  it("respects bufferAfter between items", () => {
    const s1 = baseService({ id: "s1", duration: 60, bufferAfter: 15 });
    const s2 = baseService({ id: "s2", duration: 30 });
    const members = [mem("a")];
    const memberServices: MemberService[] = [];

    const slots = computeBasketAvailability({
      date: DATE,
      items: [
        { service: s1, memberServices },
        { service: s2, memberServices },
      ],
      workingHours,
      bookings: [],
      members,
    });

    const first = slots[0];
    // s1 ends at 10:00 (start 09:00 + 60min). bufferAfter 15 → s2 starts 10:15.
    const s1EndMin = new Date(first.assignments[0].endAt).getMinutes();
    const s2StartMin = new Date(first.assignments[1].startAt).getMinutes();
    expect((s2StartMin - s1EndMin + 60) % 60).toBe(15);
  });

  it("rejects slot when an existing booking blocks the only artist mid-basket", () => {
    // s1 09:00-10:00, s2 10:00-10:30. A is busy 10:00-10:30 with another
    // booking → the basket can't start at 09:00 because s2 collides.
    const s1 = baseService({ id: "s1", duration: 60 });
    const s2 = baseService({ id: "s2", duration: 30 });
    const members = [mem("a")];
    const memberServices: MemberService[] = [];

    const conflict = {
      id: "bk",
      workspaceId: "ws",
      clientId: "c",
      assignedToId: "a",
      date: DATE,
      startAt: `${DATE}T10:00:00`,
      endAt: `${DATE}T10:30:00`,
      status: "confirmed",
    } as unknown as Booking;

    const slots = computeBasketAvailability({
      date: DATE,
      items: [
        { service: s1, memberServices },
        { service: s2, memberServices },
      ],
      workingHours,
      bookings: [conflict],
      members,
    });

    // 09:00 should NOT be in the result. The earliest slot should be
    // 10:30 (after the conflict ends).
    expect(slots.find((s) => s.time === "09:00")).toBeUndefined();
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].time >= "10:30").toBe(true);
  });

  it("rejects slot when a required resource is busy mid-basket", () => {
    // s2 needs resource R. R is busy 10:00-10:30 (from some other booking).
    // Basket starting at 09:00 requires s2 at 10:00 → resource conflict.
    const s1 = baseService({ id: "s1", duration: 60 });
    const s2 = baseService({
      id: "s2",
      duration: 30,
      requiredResourceIds: ["R"],
    });
    const members = [mem("a")];
    const memberServices: MemberService[] = [];

    const resourceBusy = new Map<string, { start: number; end: number }[]>();
    resourceBusy.set("R", [{ start: 10 * 60, end: 10 * 60 + 30 }]);

    const slots = computeBasketAvailability({
      date: DATE,
      items: [
        { service: s1, memberServices },
        { service: s2, memberServices },
      ],
      workingHours,
      bookings: [],
      members,
      resourceBusyByDay: resourceBusy,
    });

    expect(slots.find((s) => s.time === "09:00")).toBeUndefined();
  });

  it("respects per-item preferred member", () => {
    const s1 = baseService({ id: "s1", duration: 60 });
    const s2 = baseService({ id: "s2", duration: 30 });
    const members = [mem("a"), mem("b")];
    const memberServices: MemberService[] = []; // anyone can do both

    const slots = computeBasketAvailability({
      date: DATE,
      items: [
        { service: s1, memberServices, preferredMemberId: "b" },
        { service: s2, memberServices },
      ],
      workingHours,
      bookings: [],
      members,
    });

    expect(slots[0].assignments[0].memberId).toBe("b");
  });

  it("returns empty when service is restricted to non-matching weekdays", () => {
    // Only Wed/Thu allowed; date is Mon → no slots.
    const s1 = baseService({ id: "s1", duration: 60, availableWeekdays: [3, 4] });
    const s2 = baseService({ id: "s2", duration: 30 });
    const members = [mem("a")];
    const memberServices: MemberService[] = [];

    const slots = computeBasketAvailability({
      date: DATE,
      items: [
        { service: s1, memberServices },
        { service: s2, memberServices },
      ],
      workingHours,
      bookings: [],
      members,
    });

    expect(slots).toEqual([]);
  });

  it("returns slots when min-notice is satisfied (target is far enough out)", () => {
    // The basket date is months in the future, so even s1's 24h min-notice
    // is comfortably satisfied. Verify the gate doesn't accidentally drop
    // every slot when the basket is bookable.
    const s1 = baseService({ id: "s1", duration: 60, minNoticeHours: 24 });
    const s2 = baseService({ id: "s2", duration: 30, minNoticeHours: 1 });
    const members = [mem("a")];
    const memberServices: MemberService[] = [];

    const slots = computeBasketAvailability({
      date: DATE,
      items: [
        { service: s1, memberServices },
        { service: s2, memberServices },
      ],
      workingHours,
      bookings: [],
      members,
    });

    expect(slots.length).toBeGreaterThan(0);
  });
});
