/**
 * Conflict detection for calendar moves and creates.
 *
 * Pure functions — given the proposed [start, end] for a booking and the
 * surrounding state, return a list of conflicts. Used by the day-view drag
 * handler to refuse a move that would overlap a break/lunch/another booking,
 * or land outside the working window.
 *
 * All inputs are wall-clock ISO strings or HH:MM. We never construct Date
 * objects for time math here so the result doesn't drift in non-UTC zones.
 */
import type {
  Booking,
  CalendarBlock,
  TeamMember,
  WorkingHours,
} from "@/types/models";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export type ConflictKind =
  | "booking_overlap"
  | "block_overlap"
  | "outside_working_hours";

export interface CalendarConflict {
  kind: ConflictKind;
  message: string;
  /** Optional referenced object id (booking or block). */
  refId?: string;
}

export interface ConflictCheckInput {
  /** Proposed booking date (YYYY-MM-DD). */
  date: string;
  /** Proposed start (ISO `YYYY-MM-DDTHH:MM:SS` or wall-clock `HH:MM`). */
  startAt: string;
  /** Proposed end. */
  endAt: string;
  /** Member the booking belongs to. Pass `undefined` for unassigned. */
  memberId?: string;
  /** Booking id being moved — excluded from overlap check. */
  excludeBookingId?: string;
  bookings: Booking[];
  blocks: CalendarBlock[];
  members: TeamMember[];
  workspaceWorkingHours: Record<string, WorkingHours>;
}

function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function wallClockMinutes(value: string): number {
  if (value.includes("T")) {
    const m = value.match(/T(\d{2}):(\d{2})/);
    if (m) return Number(m[1]) * 60 + Number(m[2]);
    return 0;
  }
  return parseHHMM(value);
}

function wallClockDate(value: string): string {
  if (value.includes("T")) return value.slice(0, 10);
  return ""; // HH:MM-only inputs have no date
}

function weekdayKey(date: string): (typeof WEEKDAY_KEYS)[number] {
  const [y, m, d] = date.split("-").map(Number);
  return WEEKDAY_KEYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function workingWindow(
  member: TeamMember | undefined,
  date: string,
  workspaceHours: Record<string, WorkingHours>,
): { start: number; end: number } | null {
  const wk = weekdayKey(date);
  // No assignee: fall back to workspace hours.
  if (!member) {
    const hrs = workspaceHours[wk];
    if (!hrs?.start || !hrs?.end) return null;
    return { start: parseHHMM(hrs.start), end: parseHHMM(hrs.end) };
  }
  if (member.status !== "active") return null;
  if (member.daysOff?.includes(wk)) return null;
  for (const period of member.leavePeriods ?? []) {
    if (date >= period.start && date <= period.end) return null;
  }
  const hrs = member.workingHours?.[wk] ?? workspaceHours[wk];
  if (!hrs?.start || !hrs?.end) return null;
  return { start: parseHHMM(hrs.start), end: parseHHMM(hrs.end) };
}

function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function checkConflicts(input: ConflictCheckInput): CalendarConflict[] {
  const conflicts: CalendarConflict[] = [];

  const startMin = wallClockMinutes(input.startAt);
  const endMin = wallClockMinutes(input.endAt);

  // 1. Working hours
  const member = input.memberId
    ? input.members.find((m) => m.id === input.memberId)
    : undefined;
  const window = workingWindow(member, input.date, input.workspaceWorkingHours);
  if (!window) {
    conflicts.push({
      kind: "outside_working_hours",
      message: member
        ? `${member.name} isn't working on this day.`
        : "No working hours set for this day.",
    });
  } else if (startMin < window.start || endMin > window.end) {
    conflicts.push({
      kind: "outside_working_hours",
      message: "Outside working hours.",
    });
  }

  // 2. Other bookings on the same date for the same member
  for (const b of input.bookings) {
    if (b.id === input.excludeBookingId) continue;
    if (b.status === "cancelled") continue;
    if (input.memberId && b.assignedToId !== input.memberId) continue;
    if (!input.memberId && b.assignedToId) continue;
    const bDate = wallClockDate(b.startAt) || b.date;
    if (bDate !== input.date) continue;
    const bStart = wallClockMinutes(b.startAt);
    const bEnd = wallClockMinutes(b.endAt);
    if (intervalsOverlap(startMin, endMin, bStart, bEnd)) {
      conflicts.push({
        kind: "booking_overlap",
        message: "Overlaps another booking.",
        refId: b.id,
      });
      break;
    }
  }

  // 3. Calendar blocks (lunch, break, vacation, etc.)
  for (const blk of input.blocks) {
    if (blk.teamMemberId && blk.teamMemberId !== input.memberId) continue;
    const bDate = wallClockDate(blk.startTime) || blk.date;
    if (bDate !== input.date) continue;
    const bStart = wallClockMinutes(blk.startTime);
    const bEnd = wallClockMinutes(blk.endTime);
    if (intervalsOverlap(startMin, endMin, bStart, bEnd)) {
      conflicts.push({
        kind: "block_overlap",
        message: `Overlaps ${blk.label || blk.kind.replace("_", " ")}.`,
        refId: blk.id,
      });
      break;
    }
  }

  return conflicts;
}

/** Returns true if the proposed slot is fully clear. */
export function isSlotClear(input: ConflictCheckInput): boolean {
  return checkConflicts(input).length === 0;
}
