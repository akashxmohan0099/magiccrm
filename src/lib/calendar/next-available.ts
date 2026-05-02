/**
 * Next-available slot finder — answers "when can I fit someone in?".
 *
 * Pure: walks the (member × day) grid forward from `now`, finds the first
 * stretches of unbooked working time, and returns up to `count` of them.
 * Does not target a specific service; picks any open run ≥ `minMinutes`.
 *
 * The frontend uses this on the Outlook card. The same helper could later
 * back a "Quick book — first available" CTA.
 */
import type {
  Booking,
  CalendarBlock,
  TeamMember,
  WorkingHours,
} from "@/types/models";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export interface NextAvailableInput {
  now: Date;
  workspaceWorkingHours: Record<string, WorkingHours>;
  members: TeamMember[];
  bookings: Booking[];
  blocks: CalendarBlock[];
  /** Minimum gap length in minutes. Default 30. */
  minMinutes?: number;
  /** Lookahead horizon in days. Default 14. */
  horizonDays?: number;
  /** Max number of distinct slots to return. Default 2. */
  count?: number;
}

export interface NextAvailableSlot {
  date: string;       // YYYY-MM-DD (workspace local)
  time: string;       // HH:MM
  memberId: string;
  /** How long the open run is in minutes — ≥ minMinutes. */
  lengthMin: number;
}

function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fmtHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weekdayKeyForDate(date: string): (typeof WEEKDAY_KEYS)[number] {
  const [y, m, d] = date.split("-").map(Number);
  return WEEKDAY_KEYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function workingWindow(
  member: TeamMember,
  date: string,
  workspaceHours: Record<string, WorkingHours>,
): { start: number; end: number } | null {
  if (member.status !== "active") return null;
  const wk = weekdayKeyForDate(date);
  if (member.daysOff?.includes(wk)) return null;
  for (const period of member.leavePeriods ?? []) {
    if (date >= period.start && date <= period.end) return null;
  }
  const hrs = member.workingHours?.[wk] ?? workspaceHours[wk];
  if (!hrs?.start || !hrs?.end) return null;
  const start = parseHHMM(hrs.start);
  const end = parseHHMM(hrs.end);
  return end > start ? { start, end } : null;
}

function busyIntervals(
  memberId: string,
  date: string,
  bookings: Booking[],
  blocks: CalendarBlock[],
): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  for (const b of bookings) {
    if (b.assignedToId !== memberId) continue;
    if (b.status === "cancelled") continue;
    if (b.startAt.slice(0, 10) !== date) continue;
    out.push({
      start: parseHHMM(b.startAt.slice(11, 16)),
      end: parseHHMM(b.endAt.slice(11, 16)),
    });
  }
  for (const blk of blocks) {
    if (blk.teamMemberId && blk.teamMemberId !== memberId) continue;
    if (blk.startTime.slice(0, 10) !== date) continue;
    out.push({
      start: parseHHMM(blk.startTime.slice(11, 16)),
      end: parseHHMM(blk.endTime.slice(11, 16)),
    });
  }
  return out.sort((a, b) => a.start - b.start);
}

export function nextAvailableSlots(input: NextAvailableInput): NextAvailableSlot[] {
  const minMinutes = input.minMinutes ?? 30;
  const horizonDays = input.horizonDays ?? 14;
  const count = input.count ?? 2;

  const todayStr = ymd(input.now);
  const nowMinutes = input.now.getHours() * 60 + input.now.getMinutes();

  const out: NextAvailableSlot[] = [];

  for (let dayOffset = 0; dayOffset < horizonDays && out.length < count; dayOffset++) {
    const target = new Date(input.now);
    target.setDate(target.getDate() + dayOffset);
    const date = ymd(target);
    const isToday = date === todayStr;

    // Best (earliest) slot for this date across all eligible members.
    let best: NextAvailableSlot | null = null;

    for (const member of input.members) {
      const window = workingWindow(member, date, input.workspaceWorkingHours);
      if (!window) continue;

      const lowerBound = isToday ? Math.max(window.start, nowMinutes) : window.start;
      if (window.end - lowerBound < minMinutes) continue;

      const busy = busyIntervals(member.id, date, input.bookings, input.blocks);

      let cursor = lowerBound;
      for (const iv of busy) {
        if (iv.end <= cursor) continue;
        if (iv.start > cursor && iv.start - cursor >= minMinutes) {
          break; // found a gap before this booking
        }
        cursor = Math.max(cursor, iv.end);
      }

      // If cursor + minMinutes ≤ window.end, that's a valid free slot.
      if (window.end - cursor < minMinutes) continue;

      // Did the loop break out because of a gap before a busy iv? Recompute.
      let gapStart = cursor;
      let gapEnd = window.end;
      for (const iv of busy) {
        if (iv.end <= cursor) continue;
        if (iv.start > cursor && iv.start - cursor >= minMinutes) {
          gapStart = cursor;
          gapEnd = iv.start;
          break;
        }
        cursor = Math.max(cursor, iv.end);
      }
      if (gapEnd === window.end) {
        // No mid-day gap found — use the trailing run from cursor to window.end.
        gapStart = cursor;
        gapEnd = window.end;
      }
      if (gapEnd - gapStart < minMinutes) continue;

      const candidate: NextAvailableSlot = {
        date,
        time: fmtHHMM(gapStart),
        memberId: member.id,
        lengthMin: gapEnd - gapStart,
      };
      if (!best || candidate.time < best.time) best = candidate;
    }

    if (best) out.push(best);
  }

  return out;
}

/** Format a NextAvailableSlot for display: "Today 3pm", "Tomorrow 10am", "Mon 11am". */
export function formatNextAvailable(slot: NextAvailableSlot, now: Date): string {
  const today = ymd(now);
  const tomorrow = (() => {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    return ymd(t);
  })();

  const min = parseHHMM(slot.time);
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? "pm" : "am";
  const hr12 = h % 12 || 12;
  const timeLabel = m === 0 ? `${hr12}${period}` : `${hr12}:${String(m).padStart(2, "0")}${period}`;

  if (slot.date === today) return `Today ${timeLabel}`;
  if (slot.date === tomorrow) return `Tomorrow ${timeLabel}`;
  // Within ~6 days → weekday name; further out → date.
  const [y, mo, d] = slot.date.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  const daysAhead = Math.round((dt.getTime() - new Date(today + "T00:00:00").getTime()) / 86400000);
  if (daysAhead < 7) {
    return `${dt.toLocaleDateString("en-US", { weekday: "short" })} ${timeLabel}`;
  }
  return `${dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${timeLabel}`;
}
