import type {
  Booking,
  Suggestion,
  SuggestionGenerator,
  SuggestionGeneratorContext,
  TeamMember,
  WorkingHours,
} from "@/types/models";
import { generateId } from "@/lib/id";
import { todayString, lastVisitByClient, pickTopClients } from "./_helpers";

/**
 * Last-minute gap: an unbooked stretch ≥ minGapMinutes inside the working
 * window for today or tomorrow. Common causes are a fresh cancellation, a
 * staff schedule change, or a service that was deleted/rescheduled.
 *
 * Two passes:
 *   1. Same-day gaps still in the future → urgent (offer to nearby clients).
 *   2. Tomorrow's gaps → high (offer to a wider past-client list).
 *
 * Different from empty_day: this fires on *holes inside an otherwise busy
 * day*, not on whole-day low fill. Fewer slots, faster fuse.
 */

const MIN_GAP_MINUTES = 60;
const HOURS_AHEAD_SAME_DAY = 8; // only suggest gaps within 8h of "now"
const AUDIENCE_NEARBY_CAP = 8;
const AUDIENCE_TOMORROW_CAP = 15;

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function weekdayKey(dateStr: string): (typeof WEEKDAY_KEYS)[number] {
  const [y, m, d] = dateStr.split("-").map(Number);
  return WEEKDAY_KEYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
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

function fmt12h(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? "pm" : "am";
  const hr12 = h % 12 || 12;
  if (m === 0) return `${hr12}${period}`;
  return `${hr12}:${String(m).padStart(2, "0")}${period}`;
}

function workingWindowForDay(
  member: TeamMember,
  date: string,
  workspaceHours: Record<string, WorkingHours>,
): { start: number; end: number } | null {
  if (member.status !== "active") return null;
  const wk = weekdayKey(date);
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

interface BusyInterval {
  start: number;
  end: number;
}

function busyIntervalsFor(
  memberId: string,
  date: string,
  bookings: Booking[],
  blocks: SuggestionGeneratorContext["blocks"],
): BusyInterval[] {
  const out: BusyInterval[] = [];
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

interface Gap {
  memberId: string;
  date: string;
  start: number;
  end: number;
}

function gapsForMemberDay(
  member: TeamMember,
  date: string,
  ctx: SuggestionGeneratorContext,
): Gap[] {
  const window = workingWindowForDay(member, date, ctx.settings.workingHours ?? {});
  if (!window) return [];
  const busy = busyIntervalsFor(member.id, date, ctx.bookings, ctx.blocks);
  const gaps: Gap[] = [];
  let cursor = window.start;
  for (const iv of busy) {
    const ivStart = Math.max(iv.start, window.start);
    const ivEnd = Math.min(iv.end, window.end);
    if (ivStart > cursor && ivStart - cursor >= MIN_GAP_MINUTES) {
      gaps.push({ memberId: member.id, date, start: cursor, end: ivStart });
    }
    cursor = Math.max(cursor, ivEnd);
  }
  if (window.end - cursor >= MIN_GAP_MINUTES) {
    gaps.push({ memberId: member.id, date, start: cursor, end: window.end });
  }
  return gaps;
}

export const lastMinuteGapGenerator: SuggestionGenerator = {
  kind: "last_minute_gap",
  generate(ctx: SuggestionGeneratorContext): Suggestion[] {
    const today = todayString(ctx.now);
    const tomorrow = (() => {
      const [y, m, d] = today.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() + 1);
      return dt.toISOString().slice(0, 10);
    })();

    const nowMinutes = ctx.now.getHours() * 60 + ctx.now.getMinutes();
    const lastVisit = lastVisitByClient(ctx.bookings);

    // Past clients in a wider window for tomorrow.
    const pastClients = ctx.clients.filter((c) => {
      const v = lastVisit.get(c.id);
      if (!v) return false;
      const days = Math.floor((ctx.now.getTime() - new Date(v.startAt).getTime()) / 86400000);
      return days >= 21 && days <= 120;
    });
    const tomorrowAudience = pickTopClients(pastClients, lastVisit, AUDIENCE_TOMORROW_CAP);

    // For "nearby" we just take the most-recent past clients (no postcode
    // logic v1; the "nearby" framing rides on most-recent-visit proxy).
    const nearbyAudience = pickTopClients(pastClients, lastVisit, AUDIENCE_NEARBY_CAP);

    const generatedAt = ctx.now.toISOString();
    const out: Suggestion[] = [];

    for (const date of [today, tomorrow]) {
      const isToday = date === today;
      const audience = isToday ? nearbyAudience : tomorrowAudience;
      if (!audience.length) continue;

      // Aggregate gaps across staff. Operators care about "there's a hole at
      // 2pm" not which artist's calendar it sits on — but we pin the staff
      // id so the offer can later be wired to that artist.
      for (const member of ctx.members.filter((m) => m.status === "active")) {
        const gaps = gapsForMemberDay(member, date, ctx);
        for (const gap of gaps) {
          // Same-day: prune past gaps and gaps too far in the future.
          if (isToday) {
            if (gap.end <= nowMinutes) continue;
            if (gap.start - nowMinutes > HOURS_AHEAD_SAME_DAY * 60) continue;
          }

          const startLabel = fmt12h(Math.max(gap.start, isToday ? nowMinutes : gap.start));
          const lengthMin = gap.end - Math.max(gap.start, isToday ? nowMinutes : gap.start);
          if (lengthMin < MIN_GAP_MINUTES) continue;

          const triggerKey = `last_minute_gap:${date}:${member.id}:${fmtHHMM(gap.start)}`;

          out.push({
            id: generateId(),
            workspaceId: ctx.workspaceId,
            kind: "last_minute_gap",
            priority: isToday ? "urgent" : "high",
            status: "open",
            title: isToday
              ? `${startLabel} gap today`
              : `${startLabel} gap tomorrow`,
            body: isToday
              ? `Last-minute offer to ${audience.length} recent clients?`
              : `Send offer to ${audience.length} recent clients?`,
            reasonSummary: isToday
              ? `${lengthMin}-minute opening on ${member.name}'s calendar starting ${startLabel}.`
              : `${lengthMin}-minute opening tomorrow on ${member.name}'s calendar starting ${startLabel}.`,
            reasonDetails: [
              `Audience: clients with a recent visit (21–120 days ago), most recent first.`,
              `${audience.length} client${audience.length === 1 ? "" : "s"} match.`,
              `Gap detected from ${fmt12h(gap.start)} to ${fmt12h(gap.end)} on ${date}.`,
            ],
            metrics: {
              date,
              startTime: fmtHHMM(gap.start),
              lengthMin,
              memberId: member.id,
              audienceCount: audience.length,
            },
            audience: isToday
              ? { kind: "nearby_clients" }
              : { kind: "past_clients", lastVisitedFromDays: 21, lastVisitedToDays: 120 },
            audienceClientIds: audience.map((c) => c.id),
            primaryAction: {
              kind: "send_message",
              channel: "sms",
              defaultMessage: isToday
                ? `Hi {first_name} — last-minute opening at ${startLabel} today. First reply gets it.`
                : `Hi {first_name} — opening at ${startLabel} tomorrow. Want it?`,
              slotDate: date,
              slotTime: fmtHHMM(gap.start),
            },
            secondaryAction: {
              kind: "open_calendar",
              date,
            },
            triggerKey,
            expiresAt: `${date}T23:59:59`,
            generatedAt,
            createdAt: generatedAt,
            updatedAt: generatedAt,
          });
        }
      }
    }

    return out;
  },
};
