/**
 * Calendar utilisation — pure functions powering the Calendar tab's
 * "This Week" outlook card and the suggestion generators.
 *
 * The model is minutes, not slots. Reason: services range from a 10-minute
 * brow tidy to a 4-hour balayage; counting "slots" without a duration model
 * either over- or under-states the truth. We compute everything in minutes
 * and convert to a slot count for display by dividing by an average service
 * duration.
 *
 * Sources of truth:
 *   - Bookable minutes  = Σ over members & days of (member working window
 *                         minus calendar blocks minus leave).
 *   - Booked minutes    = Σ duration of non-cancelled bookings.
 *                         (no_show counts — the chair was held.)
 *   - Blocked minutes   = Σ duration of calendar blocks falling in working
 *                         hours, attributed to the affected member or
 *                         workspace-wide if the block has no member.
 *   - Booked revenue    = Σ resolvedPrice (fallback service.price) of
 *                         non-cancelled bookings in window.
 *   - Potential revenue = bookedRevenue + (remaining bookable minutes ×
 *                         derived revenue-per-minute).
 *
 * Working hours resolution per (member, day):
 *   1. Member has explicit workingHours[weekday]? Use that.
 *   2. Else fall back to workspace.workingHours[weekday].
 *   3. Day is in member.daysOff? Bookable = 0 for that day.
 *   4. Day is inside any member.leavePeriods? Bookable = 0 for that day.
 *   5. No working hours defined either place? Bookable = 0 (closed).
 */

import type {
  Booking,
  CalendarBlock,
  Service,
  TeamMember,
  WorkingHours,
} from "@/types/models";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export interface UtilizationInput {
  /** Inclusive start date (YYYY-MM-DD) in workspace local time. */
  startDate: string;
  /** Inclusive end date (YYYY-MM-DD) in workspace local time. */
  endDate: string;
  /** Workspace-level default working hours, keyed by 3-letter weekday. */
  workspaceWorkingHours: Record<string, WorkingHours>;
  /** Active team members. Inactive/invited members are ignored. */
  members: TeamMember[];
  /** Bookings with startAt/endAt — caller filters to the date range. */
  bookings: Booking[];
  /** Calendar blocks (time-off, holds) — caller filters to the date range. */
  blocks: CalendarBlock[];
  /** Services — used to look up resolvedPrice fallback and compute avg duration. */
  services?: Service[];
  /**
   * Optional override for the average service duration in minutes used to
   * convert minutes ↔ slots for display. When omitted, derived from booked
   * services in the range, then from `services`, then defaults to 60.
   */
  avgServiceDurationMin?: number;
  /**
   * Optional override for revenue-per-minute used to estimate potential
   * revenue. When omitted, derived from booked revenue ÷ booked minutes
   * in the range, then from `services` mean (price ÷ duration), then 0.
   */
  revenuePerMinute?: number;
}

export interface UtilizationPerStaff {
  memberId: string;
  bookableMinutes: number;
  bookedMinutes: number;
  blockedMinutes: number;
  filledPct: number;
  bookedRevenue: number;
}

export interface UtilizationPerDay {
  date: string;             // YYYY-MM-DD
  bookableMinutes: number;
  bookedMinutes: number;
  filledPct: number;
}

export interface UtilizationResult {
  startDate: string;
  endDate: string;
  // Aggregate (across all active members, all days in range)
  bookableMinutes: number;
  bookedMinutes: number;
  blockedMinutes: number;
  filledPct: number;        // 0–100, two decimals
  // Slot view — minutes ÷ avgServiceDurationMin, rounded
  avgServiceDurationMin: number;
  totalSlots: number;
  filledSlots: number;
  // Money view
  bookedRevenue: number;
  potentialRevenue: number;
  opportunityRevenue: number;
  revenuePerMinute: number;
  // Breakdowns
  perStaff: UtilizationPerStaff[];
  perDay: UtilizationPerDay[];
}

// ── helpers ─────────────────────────────────────────

function parseHHMM(s: string): number {
  const parts = s.split(":");
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
}

/**
 * All date math is done as wall-clock strings to avoid host-timezone
 * surprises. ISO timestamps from bookings/blocks are treated as wall-clock
 * (the workspace's local time); we don't construct Date objects for date
 * comparisons.
 */
function weekdayKey(dateStr: string): WeekdayKey {
  const [y, m, d] = dateStr.split("-").map(Number);
  // UTC-only arithmetic so the result doesn't depend on the host TZ.
  const dt = new Date(Date.UTC(y, m - 1, d));
  return WEEKDAY_KEYS[dt.getUTCDay()];
}

/** Iterate calendar dates from start to end inclusive (YYYY-MM-DD). */
function* eachDate(start: string, end: string): Generator<string> {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const d = new Date(Date.UTC(sy, sm - 1, sd));
  const last = new Date(Date.UTC(ey, em - 1, ed));
  while (d.getTime() <= last.getTime()) {
    yield d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

/** Wall-clock date portion of an ISO-like timestamp. */
function wallClockDate(iso: string): string {
  return iso.slice(0, 10);
}

/** Wall-clock minutes-of-day from an ISO-like timestamp. */
function wallClockMinutes(iso: string): number {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Minutes between two wall-clock ISO timestamps, clamped to [0, ∞). */
function diffMinutes(startIso: string, endIso: string): number {
  // Same-day: subtract minute-of-day. Cross-day: add 24h per day boundary.
  const startDay = wallClockDate(startIso);
  const endDay = wallClockDate(endIso);
  const startMin = wallClockMinutes(startIso);
  const endMin = wallClockMinutes(endIso);
  if (startDay === endDay) return Math.max(0, endMin - startMin);
  // Rare for bookings; compute via UTC date diff to be safe.
  const [sy, sm, sd] = startDay.split("-").map(Number);
  const [ey, em, ed] = endDay.split("-").map(Number);
  const days = Math.round(
    (Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86400000,
  );
  return Math.max(0, days * 24 * 60 + endMin - startMin);
}

function clampInterval(
  a: { start: number; end: number },
  bound: { start: number; end: number },
): { start: number; end: number } | null {
  const start = Math.max(a.start, bound.start);
  const end = Math.min(a.end, bound.end);
  return end > start ? { start, end } : null;
}

function intervalLength(ivs: { start: number; end: number }[]): number {
  return ivs.reduce((acc, iv) => acc + (iv.end - iv.start), 0);
}

function isMemberOnLeave(member: TeamMember, date: string): boolean {
  if (member.daysOff?.length) {
    const wk = weekdayKey(date);
    if (member.daysOff.includes(wk)) return true;
  }
  for (const period of member.leavePeriods ?? []) {
    if (date >= period.start && date <= period.end) return true;
  }
  return false;
}

function workingWindowFor(
  member: TeamMember,
  date: string,
  workspaceWorkingHours: Record<string, WorkingHours>,
): { start: number; end: number } | null {
  if (member.status !== "active") return null;
  if (isMemberOnLeave(member, date)) return null;

  const wk = weekdayKey(date);
  const memberHours = member.workingHours?.[wk];
  const workspaceHours = workspaceWorkingHours?.[wk];
  const hours = memberHours ?? workspaceHours;
  if (!hours?.start || !hours?.end) return null;

  const start = parseHHMM(hours.start);
  const end = parseHHMM(hours.end);
  return end > start ? { start, end } : null;
}

function bookingPrice(booking: Booking, services: Service[]): number {
  if (typeof booking.resolvedPrice === "number") return booking.resolvedPrice;
  if (booking.serviceId) {
    const svc = services.find((s) => s.id === booking.serviceId);
    if (svc) return svc.price;
  }
  return 0;
}

// ── main ────────────────────────────────────────────

export function computeUtilization(input: UtilizationInput): UtilizationResult {
  const services = input.services ?? [];
  const activeBookings = input.bookings.filter(
    (b) => b.status !== "cancelled",
  );
  const activeMembers = input.members.filter((m) => m.status === "active");

  // Per-staff accumulators
  const perStaff = new Map<string, UtilizationPerStaff>();
  for (const m of activeMembers) {
    perStaff.set(m.id, {
      memberId: m.id,
      bookableMinutes: 0,
      bookedMinutes: 0,
      blockedMinutes: 0,
      filledPct: 0,
      bookedRevenue: 0,
    });
  }

  // Per-day accumulator
  const perDay = new Map<string, UtilizationPerDay>();
  for (const date of eachDate(input.startDate, input.endDate)) {
    perDay.set(date, {
      date,
      bookableMinutes: 0,
      bookedMinutes: 0,
      filledPct: 0,
    });
  }

  // Pre-bucket blocks and bookings by date for cheaper lookups.
  const bookingsByMember = new Map<string, Booking[]>();
  for (const b of activeBookings) {
    if (!b.assignedToId) continue;
    const arr = bookingsByMember.get(b.assignedToId) ?? [];
    arr.push(b);
    bookingsByMember.set(b.assignedToId, arr);
  }

  const blocksByMember = new Map<string | null, CalendarBlock[]>();
  for (const block of input.blocks) {
    const key = block.teamMemberId ?? null;
    const arr = blocksByMember.get(key) ?? [];
    arr.push(block);
    blocksByMember.set(key, arr);
  }
  const workspaceBlocks = blocksByMember.get(null) ?? [];

  // Walk the (member × day) grid.
  for (const member of activeMembers) {
    const staff = perStaff.get(member.id)!;
    const memberBookings = bookingsByMember.get(member.id) ?? [];
    const memberBlocks = blocksByMember.get(member.id) ?? [];

    for (const date of eachDate(input.startDate, input.endDate)) {
      const window = workingWindowFor(member, date, input.workspaceWorkingHours);
      if (!window) continue;

      // Blocks affecting this member on this day, in minutes-of-day.
      const dayBlocks: { start: number; end: number }[] = [];
      for (const block of [...memberBlocks, ...workspaceBlocks]) {
        if (wallClockDate(block.startTime) !== date) continue;
        const startMin = wallClockMinutes(block.startTime);
        const endMin = wallClockMinutes(block.endTime);
        const clamped = clampInterval({ start: startMin, end: endMin }, window);
        if (clamped) dayBlocks.push(clamped);
      }
      const blockedMinutesDay = intervalLength(dayBlocks);
      const bookableMinutesDay = window.end - window.start - blockedMinutesDay;

      // Bookings for this member on this day, intersected with window.
      let bookedMinutesDay = 0;
      let bookedRevenueDay = 0;
      for (const b of memberBookings) {
        if (wallClockDate(b.startAt) !== date) continue;
        const startMin = wallClockMinutes(b.startAt);
        const endMin = wallClockMinutes(b.endAt);
        const clamped = clampInterval({ start: startMin, end: endMin }, window);
        if (!clamped) continue;
        bookedMinutesDay += clamped.end - clamped.start;
        bookedRevenueDay += bookingPrice(b, services);
      }

      staff.bookableMinutes += Math.max(0, bookableMinutesDay);
      staff.blockedMinutes += blockedMinutesDay;
      staff.bookedMinutes += bookedMinutesDay;
      staff.bookedRevenue += bookedRevenueDay;

      const dayBucket = perDay.get(date)!;
      dayBucket.bookableMinutes += Math.max(0, bookableMinutesDay);
      dayBucket.bookedMinutes += bookedMinutesDay;
    }
  }

  // Finalize per-staff and per-day percentages.
  for (const staff of perStaff.values()) {
    staff.filledPct = pct(staff.bookedMinutes, staff.bookableMinutes);
  }
  for (const day of perDay.values()) {
    day.filledPct = pct(day.bookedMinutes, day.bookableMinutes);
  }

  // Aggregate.
  const bookableMinutes = sum(perStaff, (s) => s.bookableMinutes);
  const bookedMinutes = sum(perStaff, (s) => s.bookedMinutes);
  const blockedMinutes = sum(perStaff, (s) => s.blockedMinutes);
  const bookedRevenue = sum(perStaff, (s) => s.bookedRevenue);

  const avgServiceDurationMin = resolveAvgServiceDuration(
    input.avgServiceDurationMin,
    activeBookings,
    services,
  );
  const revenuePerMinute = resolveRevenuePerMinute(
    input.revenuePerMinute,
    bookedRevenue,
    bookedMinutes,
    services,
  );

  const remainingMinutes = Math.max(0, bookableMinutes - bookedMinutes);
  const opportunityRevenue = round2(remainingMinutes * revenuePerMinute);
  const potentialRevenue = round2(bookedRevenue + opportunityRevenue);

  return {
    startDate: input.startDate,
    endDate: input.endDate,
    bookableMinutes,
    bookedMinutes,
    blockedMinutes,
    filledPct: pct(bookedMinutes, bookableMinutes),
    avgServiceDurationMin,
    totalSlots: avgServiceDurationMin > 0
      ? Math.round(bookableMinutes / avgServiceDurationMin)
      : 0,
    filledSlots: avgServiceDurationMin > 0
      ? Math.round(bookedMinutes / avgServiceDurationMin)
      : 0,
    bookedRevenue: round2(bookedRevenue),
    potentialRevenue,
    opportunityRevenue,
    revenuePerMinute,
    perStaff: [...perStaff.values()].sort((a, b) => b.filledPct - a.filledPct),
    perDay: [...perDay.values()],
  };
}

// ── small utils ─────────────────────────────────────

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

function sum<T>(map: Map<string, T>, pick: (v: T) => number): number {
  let total = 0;
  for (const v of map.values()) total += pick(v);
  return total;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function resolveAvgServiceDuration(
  override: number | undefined,
  bookings: Booking[],
  services: Service[],
): number {
  if (typeof override === "number" && override > 0) return Math.round(override);
  // Derived from bookings in range (most representative of actual mix).
  if (bookings.length) {
    const total = bookings.reduce((acc, b) => acc + diffMinutes(b.startAt, b.endAt), 0);
    if (total > 0) return Math.round(total / bookings.length);
  }
  // Fall back to the mean of defined service durations.
  if (services.length) {
    const total = services.reduce((acc, s) => acc + (s.duration || 0), 0);
    if (total > 0) return Math.round(total / services.length);
  }
  return 60;
}

function resolveRevenuePerMinute(
  override: number | undefined,
  bookedRevenue: number,
  bookedMinutes: number,
  services: Service[],
): number {
  if (typeof override === "number" && override >= 0) return override;
  if (bookedMinutes > 0) return round2(bookedRevenue / bookedMinutes);
  // Last resort: mean of service.price ÷ service.duration.
  if (services.length) {
    const ratios = services
      .filter((s) => s.duration > 0 && s.price > 0)
      .map((s) => s.price / s.duration);
    if (ratios.length) {
      const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      return round2(mean);
    }
  }
  return 0;
}
