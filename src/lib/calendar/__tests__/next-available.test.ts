import { describe, it, expect } from "vitest";
import { nextAvailableSlots, formatNextAvailable } from "../next-available";
import type { Booking, TeamMember, WorkingHours } from "@/types/models";

const NOW = new Date(2026, 4, 4, 10, 0, 0); // Mon 10am local

const fullWeek: Record<string, WorkingHours> = {
  mon: { start: "09:00", end: "17:00" },
  tue: { start: "09:00", end: "17:00" },
  wed: { start: "09:00", end: "17:00" },
  thu: { start: "09:00", end: "17:00" },
  fri: { start: "09:00", end: "17:00" },
};

function member(id = "m1"): TeamMember {
  return {
    id,
    authUserId: `auth-${id}`,
    workspaceId: "w1",
    name: id,
    email: `${id}@x.com`,
    role: "owner",
    status: "active",
    workingHours: {},
    daysOff: [],
    leavePeriods: [],
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  };
}

function booking(o: Partial<Booking>): Booking {
  return {
    id: "b",
    workspaceId: "w1",
    clientId: "c1",
    assignedToId: "m1",
    date: "2026-05-04",
    startAt: "2026-05-04T09:00:00",
    endAt: "2026-05-04T10:00:00",
    status: "confirmed",
    notes: "",
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...o,
  } as Booking;
}

describe("nextAvailableSlots", () => {
  it("returns today's first available time when free now", () => {
    const slots = nextAvailableSlots({
      now: NOW,
      workspaceWorkingHours: fullWeek,
      members: [member()],
      bookings: [],
      blocks: [],
    });
    expect(slots[0]).toEqual({
      date: "2026-05-04",
      time: "10:00",
      memberId: "m1",
      lengthMin: 7 * 60,
    });
  });

  it("skips past a current booking and finds the next gap", () => {
    const slots = nextAvailableSlots({
      now: NOW,
      workspaceWorkingHours: fullWeek,
      members: [member()],
      bookings: [
        booking({
          startAt: "2026-05-04T10:00:00",
          endAt: "2026-05-04T13:00:00",
        }),
      ],
      blocks: [],
    });
    expect(slots[0].date).toBe("2026-05-04");
    expect(slots[0].time).toBe("13:00");
  });

  it("rolls to tomorrow when today is fully booked from now", () => {
    const slots = nextAvailableSlots({
      now: NOW,
      workspaceWorkingHours: fullWeek,
      members: [member()],
      bookings: [
        booking({
          startAt: "2026-05-04T10:00:00",
          endAt: "2026-05-04T17:00:00",
        }),
      ],
      blocks: [],
    });
    expect(slots[0].date).toBe("2026-05-05");
    expect(slots[0].time).toBe("09:00");
  });

  it("returns up to count distinct daily slots", () => {
    const slots = nextAvailableSlots({
      now: NOW,
      workspaceWorkingHours: fullWeek,
      members: [member()],
      bookings: [],
      blocks: [],
      count: 2,
    });
    expect(slots).toHaveLength(2);
    expect(slots[0].date).toBe("2026-05-04");
    expect(slots[1].date).toBe("2026-05-05");
  });
});

describe("formatNextAvailable", () => {
  it("labels today, tomorrow, and weekdays", () => {
    expect(formatNextAvailable(
      { date: "2026-05-04", time: "15:00", memberId: "m1", lengthMin: 60 },
      NOW,
    )).toBe("Today 3pm");

    expect(formatNextAvailable(
      { date: "2026-05-05", time: "10:00", memberId: "m1", lengthMin: 60 },
      NOW,
    )).toBe("Tomorrow 10am");

    expect(formatNextAvailable(
      { date: "2026-05-07", time: "11:30", memberId: "m1", lengthMin: 60 },
      NOW,
    )).toMatch(/Thu 11:30am/);
  });
});
