import { describe, it, expect } from "vitest";
import { computeUtilization } from "../utilization";
import type {
  Booking,
  CalendarBlock,
  Service,
  TeamMember,
  WorkingHours,
} from "@/types/models";

const NOW = "2026-05-04T00:00:00.000Z"; // a Monday

const fullWeekHours: Record<string, WorkingHours> = {
  mon: { start: "09:00", end: "17:00" },
  tue: { start: "09:00", end: "17:00" },
  wed: { start: "09:00", end: "17:00" },
  thu: { start: "09:00", end: "17:00" },
  fri: { start: "09:00", end: "17:00" },
};

function makeMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: "m1",
    authUserId: "auth1",
    workspaceId: "w1",
    name: "Sarah",
    email: "sarah@x.com",
    role: "owner",
    status: "active",
    workingHours: {},
    daysOff: [],
    leavePeriods: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeBooking(overrides: Partial<Booking>): Booking {
  return {
    id: "b1",
    workspaceId: "w1",
    clientId: "c1",
    assignedToId: "m1",
    date: "2026-05-04",
    startAt: "2026-05-04T09:00:00",
    endAt: "2026-05-04T10:00:00",
    status: "confirmed",
    notes: "",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as Booking;
}

function makeBlock(overrides: Partial<CalendarBlock>): CalendarBlock {
  return {
    id: "blk1",
    workspaceId: "w1",
    teamMemberId: "m1",
    kind: "personal",
    date: "2026-05-04",
    startTime: "2026-05-04T12:00:00",
    endTime: "2026-05-04T13:00:00",
    isPrivate: false,
    isRecurring: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as CalendarBlock;
}

describe("computeUtilization", () => {
  it("computes 0% with no bookings on a working day", () => {
    const result = computeUtilization({
      startDate: "2026-05-04",
      endDate: "2026-05-04",
      workspaceWorkingHours: fullWeekHours,
      members: [makeMember()],
      bookings: [],
      blocks: [],
    });
    expect(result.bookableMinutes).toBe(8 * 60);
    expect(result.bookedMinutes).toBe(0);
    expect(result.filledPct).toBe(0);
  });

  it("computes 100% when fully booked", () => {
    const result = computeUtilization({
      startDate: "2026-05-04",
      endDate: "2026-05-04",
      workspaceWorkingHours: fullWeekHours,
      members: [makeMember()],
      bookings: [
        makeBooking({
          startAt: "2026-05-04T09:00:00",
          endAt: "2026-05-04T17:00:00",
          resolvedPrice: 400,
        }),
      ],
      blocks: [],
    });
    expect(result.bookedMinutes).toBe(8 * 60);
    expect(result.filledPct).toBe(100);
    expect(result.bookedRevenue).toBe(400);
  });

  it("excludes cancelled bookings, includes no_show", () => {
    const result = computeUtilization({
      startDate: "2026-05-04",
      endDate: "2026-05-04",
      workspaceWorkingHours: fullWeekHours,
      members: [makeMember()],
      bookings: [
        makeBooking({
          id: "b-cancel",
          status: "cancelled",
          startAt: "2026-05-04T09:00:00",
          endAt: "2026-05-04T11:00:00",
          resolvedPrice: 100,
        }),
        makeBooking({
          id: "b-noshow",
          status: "no_show",
          startAt: "2026-05-04T13:00:00",
          endAt: "2026-05-04T14:00:00",
          resolvedPrice: 80,
        }),
      ],
      blocks: [],
    });
    expect(result.bookedMinutes).toBe(60);
    expect(result.bookedRevenue).toBe(80);
  });

  it("subtracts blocks from bookable minutes", () => {
    const result = computeUtilization({
      startDate: "2026-05-04",
      endDate: "2026-05-04",
      workspaceWorkingHours: fullWeekHours,
      members: [makeMember()],
      bookings: [],
      blocks: [
        makeBlock({
          startTime: "2026-05-04T12:00:00",
          endTime: "2026-05-04T13:00:00",
        }),
      ],
    });
    expect(result.blockedMinutes).toBe(60);
    expect(result.bookableMinutes).toBe(8 * 60 - 60);
  });

  it("respects member-specific working hours over workspace defaults", () => {
    const member = makeMember({
      workingHours: { mon: { start: "10:00", end: "14:00" } },
    });
    const result = computeUtilization({
      startDate: "2026-05-04",
      endDate: "2026-05-04",
      workspaceWorkingHours: fullWeekHours,
      members: [member],
      bookings: [],
      blocks: [],
    });
    expect(result.bookableMinutes).toBe(4 * 60);
  });

  it("treats daysOff and leavePeriods as zero bookable minutes", () => {
    const onLeave = makeMember({ id: "m-leave", leavePeriods: [{ start: "2026-05-04", end: "2026-05-04" }] });
    const dayOff = makeMember({ id: "m-off", daysOff: ["mon"] });
    const result = computeUtilization({
      startDate: "2026-05-04",
      endDate: "2026-05-04",
      workspaceWorkingHours: fullWeekHours,
      members: [onLeave, dayOff],
      bookings: [],
      blocks: [],
    });
    expect(result.bookableMinutes).toBe(0);
  });

  it("aggregates across multiple staff and days", () => {
    const sarah = makeMember({ id: "sarah" });
    const james = makeMember({ id: "james" });
    const result = computeUtilization({
      startDate: "2026-05-04",
      endDate: "2026-05-05", // Mon + Tue
      workspaceWorkingHours: fullWeekHours,
      members: [sarah, james],
      bookings: [
        makeBooking({
          id: "b-s",
          assignedToId: "sarah",
          startAt: "2026-05-04T09:00:00",
          endAt: "2026-05-04T13:00:00",
          resolvedPrice: 200,
        }),
        makeBooking({
          id: "b-j",
          assignedToId: "james",
          startAt: "2026-05-05T14:00:00",
          endAt: "2026-05-05T15:00:00",
          resolvedPrice: 50,
        }),
      ],
      blocks: [],
    });
    // 2 staff × 2 days × 8 hrs = 32 hrs bookable
    expect(result.bookableMinutes).toBe(2 * 2 * 8 * 60);
    expect(result.bookedMinutes).toBe(4 * 60 + 60);
    expect(result.bookedRevenue).toBe(250);
    expect(result.perStaff).toHaveLength(2);
    expect(result.perDay).toHaveLength(2);
  });

  it("derives potentialRevenue from observed revenue per minute", () => {
    const result = computeUtilization({
      startDate: "2026-05-04",
      endDate: "2026-05-04",
      workspaceWorkingHours: fullWeekHours,
      members: [makeMember()],
      bookings: [
        // 60 min booked at $120 → $2/min observed
        makeBooking({
          startAt: "2026-05-04T09:00:00",
          endAt: "2026-05-04T10:00:00",
          resolvedPrice: 120,
        }),
      ],
      blocks: [],
    });
    expect(result.revenuePerMinute).toBe(2);
    // 7 hrs (420 min) remaining × $2 = $840 opportunity
    expect(result.opportunityRevenue).toBe(840);
    expect(result.potentialRevenue).toBe(960);
    expect(result.bookedRevenue).toBe(120);
  });

  it("falls back to service price/duration when no bookings exist", () => {
    const services: Service[] = [
      {
        id: "s1",
        workspaceId: "w1",
        name: "Cut",
        description: "",
        duration: 60,
        price: 90,
        enabled: true,
        sortOrder: 0,
        bufferMinutes: 0,
        requiresConfirmation: false,
        depositType: "none",
        depositAmount: 0,
      } as Service,
    ];
    const result = computeUtilization({
      startDate: "2026-05-04",
      endDate: "2026-05-04",
      workspaceWorkingHours: fullWeekHours,
      members: [makeMember()],
      bookings: [],
      blocks: [],
      services,
    });
    expect(result.revenuePerMinute).toBe(1.5);
    expect(result.opportunityRevenue).toBe(8 * 60 * 1.5);
    expect(result.avgServiceDurationMin).toBe(60);
    expect(result.totalSlots).toBe(8);
    expect(result.filledSlots).toBe(0);
  });

  it("uses resolvedPrice when present, falls back to service.price", () => {
    const services: Service[] = [
      {
        id: "s1",
        workspaceId: "w1",
        name: "Color",
        description: "",
        duration: 120,
        price: 200,
        enabled: true,
        sortOrder: 0,
        bufferMinutes: 0,
        requiresConfirmation: false,
        depositType: "none",
        depositAmount: 0,
      } as Service,
    ];
    const result = computeUtilization({
      startDate: "2026-05-04",
      endDate: "2026-05-04",
      workspaceWorkingHours: fullWeekHours,
      members: [makeMember()],
      bookings: [
        makeBooking({
          id: "b-resolved",
          serviceId: "s1",
          startAt: "2026-05-04T09:00:00",
          endAt: "2026-05-04T11:00:00",
          resolvedPrice: 220, // promo + tip
        }),
        makeBooking({
          id: "b-fallback",
          serviceId: "s1",
          startAt: "2026-05-04T12:00:00",
          endAt: "2026-05-04T14:00:00",
          // no resolvedPrice → falls back to service.price (200)
        }),
      ],
      blocks: [],
      services,
    });
    expect(result.bookedRevenue).toBe(420);
  });

  it("zero working hours yields zero division (filledPct = 0)", () => {
    const result = computeUtilization({
      startDate: "2026-05-04",
      endDate: "2026-05-04",
      workspaceWorkingHours: {}, // closed
      members: [makeMember()],
      bookings: [],
      blocks: [],
    });
    expect(result.bookableMinutes).toBe(0);
    expect(result.filledPct).toBe(0);
    expect(result.opportunityRevenue).toBe(0);
  });
});
