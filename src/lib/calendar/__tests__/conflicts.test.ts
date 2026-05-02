import { describe, it, expect } from "vitest";
import { checkConflicts, isSlotClear } from "../conflicts";
import type { Booking, CalendarBlock, TeamMember } from "@/types/models";

/**
 * Conflict detection guards every booking move + create. A regression here
 * either lets the operator double-book (loses customer trust) or refuses
 * legal moves (frustrating UX). Cover all three conflict kinds + the
 * exclude-self rule for moves.
 */
const workspaceHours = {
  mon: { start: "09:00", end: "17:00" },
  tue: { start: "09:00", end: "17:00" },
  wed: { start: "09:00", end: "17:00" },
  thu: { start: "09:00", end: "17:00" },
  fri: { start: "09:00", end: "17:00" },
};

const member = (overrides: Partial<TeamMember> = {}): TeamMember =>
  ({
    id: "tm-1",
    authUserId: "auth-1",
    workspaceId: "ws-1",
    name: "Sophie",
    email: "s@x.com",
    role: "owner",
    status: "active",
    workingHours: workspaceHours,
    daysOff: [],
    leavePeriods: [],
    createdAt: "x",
    updatedAt: "x",
    ...overrides,
  }) as TeamMember;

const booking = (overrides: Partial<Booking> = {}): Booking =>
  ({
    id: "bk-1",
    workspaceId: "ws-1",
    clientId: "cli-1",
    serviceId: "svc-1",
    assignedToId: "tm-1",
    date: "2026-05-04", // a Monday
    startAt: "2026-05-04T10:00:00",
    endAt: "2026-05-04T11:00:00",
    status: "confirmed",
    notes: "",
    createdAt: "x",
    updatedAt: "x",
    ...overrides,
  }) as Booking;

const block = (overrides: Partial<CalendarBlock> = {}): CalendarBlock =>
  ({
    id: "blk-1",
    workspaceId: "ws-1",
    teamMemberId: "tm-1",
    kind: "blocked",
    date: "2026-05-04",
    startTime: "12:00",
    endTime: "13:00",
    label: "Lunch",
    isPrivate: true,
    isRecurring: false,
    ...overrides,
  }) as CalendarBlock;

describe("checkConflicts", () => {
  it("returns empty array for a clear slot", () => {
    const conflicts = checkConflicts({
      date: "2026-05-04",
      startAt: "2026-05-04T10:00:00",
      endAt: "2026-05-04T11:00:00",
      memberId: "tm-1",
      bookings: [],
      blocks: [],
      members: [member()],
      workspaceWorkingHours: workspaceHours,
    });
    expect(conflicts).toEqual([]);
  });

  it("flags outside_working_hours when before window", () => {
    const conflicts = checkConflicts({
      date: "2026-05-04",
      startAt: "2026-05-04T07:00:00",
      endAt: "2026-05-04T08:00:00",
      memberId: "tm-1",
      bookings: [],
      blocks: [],
      members: [member()],
      workspaceWorkingHours: workspaceHours,
    });
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].kind).toBe("outside_working_hours");
  });

  it("flags outside_working_hours when member has the day off", () => {
    const conflicts = checkConflicts({
      date: "2026-05-04",
      startAt: "2026-05-04T10:00:00",
      endAt: "2026-05-04T11:00:00",
      memberId: "tm-1",
      bookings: [],
      blocks: [],
      members: [member({ daysOff: ["mon"] })],
      workspaceWorkingHours: workspaceHours,
    });
    expect(conflicts[0].kind).toBe("outside_working_hours");
    expect(conflicts[0].message).toMatch(/isn't working/);
  });

  it("flags outside_working_hours during a leave period", () => {
    const conflicts = checkConflicts({
      date: "2026-05-04",
      startAt: "2026-05-04T10:00:00",
      endAt: "2026-05-04T11:00:00",
      memberId: "tm-1",
      bookings: [],
      blocks: [],
      members: [member({ leavePeriods: [{ start: "2026-05-01", end: "2026-05-10" }] })],
      workspaceWorkingHours: workspaceHours,
    });
    expect(conflicts[0].kind).toBe("outside_working_hours");
  });

  it("flags booking_overlap when another booking overlaps", () => {
    const existing = booking({
      id: "bk-2",
      startAt: "2026-05-04T10:30:00",
      endAt: "2026-05-04T11:30:00",
    });
    const conflicts = checkConflicts({
      date: "2026-05-04",
      startAt: "2026-05-04T10:00:00",
      endAt: "2026-05-04T11:00:00",
      memberId: "tm-1",
      bookings: [existing],
      blocks: [],
      members: [member()],
      workspaceWorkingHours: workspaceHours,
    });
    expect(conflicts.find((c) => c.kind === "booking_overlap")?.refId).toBe("bk-2");
  });

  it("respects excludeBookingId (moving a booking past its old slot)", () => {
    const moving = booking({ id: "bk-1" });
    const conflicts = checkConflicts({
      date: "2026-05-04",
      startAt: "2026-05-04T10:00:00",
      endAt: "2026-05-04T11:00:00",
      memberId: "tm-1",
      excludeBookingId: "bk-1",
      bookings: [moving],
      blocks: [],
      members: [member()],
      workspaceWorkingHours: workspaceHours,
    });
    expect(conflicts).toEqual([]);
  });

  it("ignores cancelled bookings", () => {
    const cancelled = booking({ id: "bk-2", status: "cancelled" });
    const conflicts = checkConflicts({
      date: "2026-05-04",
      startAt: "2026-05-04T10:00:00",
      endAt: "2026-05-04T11:00:00",
      memberId: "tm-1",
      bookings: [cancelled],
      blocks: [],
      members: [member()],
      workspaceWorkingHours: workspaceHours,
    });
    expect(conflicts.filter((c) => c.kind === "booking_overlap")).toEqual([]);
  });

  it("flags block_overlap when colliding with a member's lunch", () => {
    const conflicts = checkConflicts({
      date: "2026-05-04",
      startAt: "2026-05-04T12:30:00",
      endAt: "2026-05-04T13:30:00",
      memberId: "tm-1",
      bookings: [],
      blocks: [block()],
      members: [member()],
      workspaceWorkingHours: workspaceHours,
    });
    expect(conflicts.find((c) => c.kind === "block_overlap")?.refId).toBe("blk-1");
  });

  it("workspace-wide block (no teamMemberId) blocks every member", () => {
    const wsHoliday = block({ teamMemberId: undefined, label: "Public holiday" });
    const conflicts = checkConflicts({
      date: "2026-05-04",
      startAt: "2026-05-04T12:30:00",
      endAt: "2026-05-04T13:30:00",
      memberId: "tm-1",
      bookings: [],
      blocks: [wsHoliday],
      members: [member()],
      workspaceWorkingHours: workspaceHours,
    });
    expect(conflicts.find((c) => c.kind === "block_overlap")).toBeDefined();
  });
});

describe("isSlotClear", () => {
  it("true for clear slot, false otherwise", () => {
    expect(
      isSlotClear({
        date: "2026-05-04",
        startAt: "2026-05-04T10:00:00",
        endAt: "2026-05-04T11:00:00",
        memberId: "tm-1",
        bookings: [],
        blocks: [],
        members: [member()],
        workspaceWorkingHours: workspaceHours,
      }),
    ).toBe(true);

    expect(
      isSlotClear({
        date: "2026-05-04",
        startAt: "2026-05-04T07:00:00",
        endAt: "2026-05-04T08:00:00",
        memberId: "tm-1",
        bookings: [],
        blocks: [],
        members: [member()],
        workspaceWorkingHours: workspaceHours,
      }),
    ).toBe(false);
  });
});
