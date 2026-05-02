import { describe, it, expect } from "vitest";
import type {
  Booking,
  CalendarBlock,
  Client,
  Service,
  TeamMember,
  WorkspaceSettings,
  SuggestionGeneratorContext,
} from "@/types/models";
import { emptyDayGenerator } from "../empty-day";
import { lastMinuteGapGenerator } from "../last-minute-gap";
import { overdueRebookGenerator } from "../overdue-rebook";
import { runSuggestions } from "..";

// Local wall-clock Monday 10am — generators read getHours()/getDate()
// (workspace-local), so anchoring to a Z-instant would skew the test in
// non-UTC environments.
const NOW = new Date(2026, 4, 4, 10, 0, 0);

const fullWeekHours = {
  mon: { start: "09:00", end: "17:00" },
  tue: { start: "09:00", end: "17:00" },
  wed: { start: "09:00", end: "17:00" },
  thu: { start: "09:00", end: "17:00" },
  fri: { start: "09:00", end: "17:00" },
  sat: { start: "09:00", end: "17:00" },
  sun: { start: "09:00", end: "17:00" },
};

function settings(): WorkspaceSettings {
  return {
    workspaceId: "w1",
    stripeOnboardingComplete: false,
    workingHours: fullWeekHours,
    cancellationWindowHours: 24,
    depositPercentage: 0,
    noShowFee: 0,
    messageTemplates: {},
    notificationDefaults: "email",
    branding: {},
  } as WorkspaceSettings;
}

function member(id = "m1", overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id,
    authUserId: `auth-${id}`,
    workspaceId: "w1",
    name: `Member ${id}`,
    email: `${id}@x.com`,
    role: "owner",
    status: "active",
    workingHours: {},
    daysOff: [],
    leavePeriods: [],
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

function client(id: string, name = `Client ${id}`): Client {
  return {
    id,
    workspaceId: "w1",
    name,
    email: `${id}@x.com`,
    phone: "+61400000000",
    notes: "",
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  };
}

function booking(overrides: Partial<Booking>): Booking {
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
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  } as Booking;
}

function ctxBuilder(opts: {
  bookings?: Booking[];
  clients?: Client[];
  members?: TeamMember[];
  services?: Service[];
  blocks?: CalendarBlock[];
}): SuggestionGeneratorContext {
  return {
    workspaceId: "w1",
    now: NOW,
    bookings: opts.bookings ?? [],
    clients: opts.clients ?? [],
    members: opts.members ?? [member()],
    services: opts.services ?? [],
    blocks: opts.blocks ?? [],
    settings: settings(),
  };
}

// ── empty_day ─────────────────────────────────────

describe("emptyDayGenerator", () => {
  it("returns no suggestions when there's no past-client audience", () => {
    const result = emptyDayGenerator.generate(
      ctxBuilder({ clients: [client("c1")], bookings: [] }),
    );
    expect(result).toEqual([]);
  });

  it("flags a low-fill day in the next week", () => {
    // Two past clients, both visited 5 weeks ago → eligible.
    const past = [client("c1"), client("c2")];
    const oldVisits = past.map((c) =>
      booking({
        id: `old-${c.id}`,
        clientId: c.id,
        startAt: "2026-03-30T10:00:00", // ~5 weeks before NOW
        endAt: "2026-03-30T11:00:00",
        date: "2026-03-30",
        status: "completed",
      }),
    );

    const result = emptyDayGenerator.generate(
      ctxBuilder({ clients: past, bookings: oldVisits }),
    );

    expect(result.length).toBeGreaterThan(0);
    const tomorrow = result.find((s) => s.metrics?.date === "2026-05-05");
    expect(tomorrow).toBeDefined();
    expect(tomorrow!.audienceClientIds).toEqual(
      expect.arrayContaining(["c1", "c2"]),
    );
    expect(tomorrow!.triggerKey).toBe("empty_day:2026-05-05");
    expect(tomorrow!.primaryAction.kind).toBe("send_message");
  });

  it("skips today and skips fully booked days", () => {
    const past = [client("c1")];
    const oldVisit = booking({
      id: "old1",
      clientId: "c1",
      startAt: "2026-03-30T10:00:00",
      endAt: "2026-03-30T11:00:00",
      date: "2026-03-30",
      status: "completed",
    });
    // Fill tomorrow 9-17 entirely.
    const tomorrowFull = booking({
      id: "fill",
      clientId: "c1",
      startAt: "2026-05-05T09:00:00",
      endAt: "2026-05-05T17:00:00",
      date: "2026-05-05",
      status: "confirmed",
      resolvedPrice: 400,
    });

    const result = emptyDayGenerator.generate(
      ctxBuilder({ clients: past, bookings: [oldVisit, tomorrowFull] }),
    );

    expect(result.find((s) => s.metrics?.date === "2026-05-04")).toBeUndefined();
    expect(result.find((s) => s.metrics?.date === "2026-05-05")).toBeUndefined();
  });
});

// ── last_minute_gap ───────────────────────────────

describe("lastMinuteGapGenerator", () => {
  it("returns nothing without a recent-client audience", () => {
    const result = lastMinuteGapGenerator.generate(ctxBuilder({}));
    expect(result).toEqual([]);
  });

  it("flags a same-day gap after 'now'", () => {
    // Past client (audience) and a different client whose booking creates
    // the gap — last_visit excludes anyone with a booking that pushes them
    // out of the recent-visit window.
    const past = client("c1");
    const todayClient = client("c2");
    const recent = booking({
      id: "old1",
      clientId: "c1",
      startAt: "2026-04-13T10:00:00", // ~3 weeks before NOW
      endAt: "2026-04-13T11:00:00",
      date: "2026-04-13",
      status: "completed",
    });
    // Today (Mon) booking 9-11 → gap from 11 to 17.
    const today = booking({
      id: "today",
      clientId: "c2",
      startAt: "2026-05-04T09:00:00",
      endAt: "2026-05-04T11:00:00",
      date: "2026-05-04",
      status: "confirmed",
    });

    const result = lastMinuteGapGenerator.generate(
      ctxBuilder({ clients: [past, todayClient], bookings: [recent, today] }),
    );

    const todayGap = result.find(
      (s) => s.metrics?.date === "2026-05-04" && s.priority === "urgent",
    );
    expect(todayGap).toBeDefined();
    expect(todayGap!.audienceClientIds).toContain("c1");
  });

  it("ignores past gaps on today", () => {
    const c = client("c1");
    const recent = booking({
      id: "old1",
      clientId: "c1",
      startAt: "2026-04-13T10:00:00",
      endAt: "2026-04-13T11:00:00",
      date: "2026-04-13",
      status: "completed",
    });
    // Booking 14-15 today → gap 9-14 entirely before 10am NOW.
    // Actually NOW is 10am UTC; window is 9-17. The 9-14 gap straddles now.
    // Use a simpler case: a booking that fills the rest of the day.
    const today = booking({
      id: "today",
      clientId: "c1",
      startAt: "2026-05-04T10:00:00",
      endAt: "2026-05-04T17:00:00",
      date: "2026-05-04",
      status: "confirmed",
    });

    const result = lastMinuteGapGenerator.generate(
      ctxBuilder({ clients: [c], bookings: [recent, today] }),
    );

    expect(result.filter((s) => s.metrics?.date === "2026-05-04")).toEqual([]);
  });
});

// ── overdue_rebook ────────────────────────────────

describe("overdueRebookGenerator", () => {
  it("buckets clients by overdue tier", () => {
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
        rebookAfterDays: 30,
      } as Service,
    ];
    // c1: visited 35 days ago → 5 overdue → due_now tier
    // c2: visited 80 days ago → 50 overdue → month_plus tier
    // c3: visited 200 days ago → 170 overdue → lapsed tier
    const clients = [client("c1"), client("c2"), client("c3")];
    const bookings = [
      booking({
        id: "b-c1",
        clientId: "c1",
        serviceId: "s1",
        startAt: "2026-03-30T10:00:00",
        endAt: "2026-03-30T11:00:00",
        date: "2026-03-30",
        status: "completed",
      }),
      booking({
        id: "b-c2",
        clientId: "c2",
        serviceId: "s1",
        startAt: "2026-02-13T10:00:00",
        endAt: "2026-02-13T11:00:00",
        date: "2026-02-13",
        status: "completed",
      }),
      booking({
        id: "b-c3",
        clientId: "c3",
        serviceId: "s1",
        startAt: "2025-10-16T10:00:00",
        endAt: "2025-10-16T11:00:00",
        date: "2025-10-16",
        status: "completed",
      }),
    ];

    const result = overdueRebookGenerator.generate(
      ctxBuilder({ clients, services, bookings }),
    );

    const tiers = result.map((s) => s.metrics?.tier);
    expect(tiers).toContain("due_now");
    expect(tiers).toContain("month_plus");
    expect(tiers).toContain("lapsed");

    const dueNow = result.find((s) => s.metrics?.tier === "due_now")!;
    expect(dueNow.audienceClientIds).toContain("c1");
    expect(dueNow.audienceClientIds).not.toContain("c2");
  });

  it("excludes clients who already have a future booking", () => {
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
        rebookAfterDays: 30,
      } as Service,
    ];
    const clients = [client("c1")];
    const bookings = [
      booking({
        id: "old",
        clientId: "c1",
        serviceId: "s1",
        startAt: "2026-03-15T10:00:00",
        endAt: "2026-03-15T11:00:00",
        date: "2026-03-15",
        status: "completed",
      }),
      booking({
        id: "future",
        clientId: "c1",
        serviceId: "s1",
        startAt: "2026-05-20T10:00:00",
        endAt: "2026-05-20T11:00:00",
        date: "2026-05-20",
        status: "confirmed",
      }),
    ];

    const result = overdueRebookGenerator.generate(
      ctxBuilder({ clients, services, bookings }),
    );
    expect(result).toEqual([]);
  });
});

// ── runner ────────────────────────────────────────

describe("runSuggestions", () => {
  it("calls all generators and dedupes by triggerKey", () => {
    const result = runSuggestions(ctxBuilder({}));
    // Empty inputs → no errors, no suggestions.
    expect(Array.isArray(result)).toBe(true);
    const keys = new Set(result.map((s) => s.triggerKey));
    expect(keys.size).toBe(result.length);
  });
});
