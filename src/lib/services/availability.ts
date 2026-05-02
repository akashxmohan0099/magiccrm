/**
 * Availability engine — pure functions that compute bookable slots given the
 * workspace's working hours, existing bookings, calendar blocks, member
 * availability, and a target service (or chain of services).
 *
 * The engine is deliberately pure & synchronous: it takes already-loaded
 * stores as inputs. Callers (the public booking page, admin slot picker,
 * SMS scheduling agents) wire it up with whatever data source they have —
 * Supabase fetch in the API route, in-memory store on the client.
 */
import type {
  Service,
  Booking,
  TeamMember,
  WorkingHours,
  MemberService,
  Location,
} from "@/types/models";
import { resolveDuration, resolveBuffer, maxDuration } from "./price";

export interface Slot {
  /** Local "HH:MM" time of day. */
  time: string;
  /** ISO timestamp when the booking starts. */
  startAt: string;
  /** ISO timestamp when the artist finishes (excludes after-buffer). */
  endAt: string;
  /** Members eligible to take this slot — empty array means "any". */
  memberIds: string[];
}

export interface AvailabilityInput {
  /** YYYY-MM-DD in the workspace's timezone (caller normalizes). */
  date: string;
  service: Service;
  /** Workspace working hours, keyed by 3-letter weekday ("mon".."sun"). */
  workingHours: Record<string, WorkingHours>;
  /** Bookings on this date that may conflict. Cancelled bookings should be filtered out by the caller. */
  bookings: Booking[];
  /** Active team members who could take this booking. */
  members: TeamMember[];
  /** member_services rows for this service. Empty = "anyone" eligibility. */
  memberServices: MemberService[];
  /** Pinned member id from the artist picker (Pattern 1) — narrows eligibility to one. */
  preferredMemberId?: string;
  /** Pinned location — when set, only members allowed at this location are considered. */
  locationId?: string;
  locations?: Location[];
  /** Slot increment in minutes. Defaults to 15. */
  step?: number;
  /** Selected variant id (only relevant for priceType==='variants'). */
  variantId?: string;
  /** Member-specific duration override (only used when preferredMemberId is set). */
  memberDurationOverride?: number;
  /** Buffer before/after — when undefined, derived from service via resolveBuffer. */
  bufferBeforeMin?: number;
  bufferAfterMin?: number;
  /** Optional cap on slots returned. */
  limit?: number;
  /**
   * Extra minutes that must fit inside the booking envelope on top of the
   * service's base duration — typically the sum of selected add-on durations,
   * or the gap between a basket-wide required duration and the engine's
   * computed base. Added to baseDuration in totalNeeded.
   */
  extraDurationMinutes?: number;
  /**
   * Pre-computed resource busy intervals for the day, keyed by resourceId.
   * Caller derives this by walking bookings for services that share required
   * resources with the target service. Empty/missing = no resource locks.
   */
  resourceBusyByDay?: Map<string, { start: number; end: number }[]>;
}

/** 3-letter weekday key matching workingHours keys. Sunday = "sun". */
const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map((n) => Number(n) || 0);
  return h * 60 + m;
}

function fmtHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function localIso(date: string, hhmm: string): string {
  // Treat date/time as local; the caller is responsible for tz normalization.
  return new Date(`${date}T${hhmm}:00`).toISOString();
}

/**
 * Compute bookable slots for a given (date, service) and the eligible members.
 *
 * The algorithm:
 *  1. Determine which members are eligible (assigned + location + preferred).
 *  2. For each member, compute their busy intervals from existing bookings.
 *  3. For each candidate start time on the workspace grid, check if any
 *     eligible member is free for the full (preBuffer + duration + postBuffer)
 *     window. Members must also be working that weekday.
 *  4. Collapse to a single slot list with the union of eligible member ids.
 *
 * For "Anyone" services, the slot is bookable if at least one eligible member
 * is free. For pinned-member bookings, only that member's calendar matters.
 */
export function computeAvailability(input: AvailabilityInput): Slot[] {
  const {
    date,
    service,
    workingHours,
    bookings,
    members,
    memberServices,
    preferredMemberId,
    locationId,
    step = 15,
    variantId,
    memberDurationOverride,
    bufferBeforeMin,
    bufferAfterMin,
    limit,
    resourceBusyByDay,
    extraDurationMinutes = 0,
  } = input;

  const weekday = WEEKDAY_KEYS[new Date(`${date}T12:00:00`).getDay()];
  const workspaceHours = workingHours[weekday];
  if (!workspaceHours) return [];

  // Service-level weekday filter (e.g. only Mon/Wed for that service).
  if (
    service.availableWeekdays &&
    service.availableWeekdays.length > 0 &&
    !service.availableWeekdays.includes(WEEKDAY_KEYS.indexOf(weekday))
  ) {
    return [];
  }

  // Member eligibility from member_services (empty rows = "anyone").
  const assignedIds = memberServices
    .filter((ms) => ms.serviceId === service.id)
    .map((ms) => ms.memberId);
  const isAnyoneMode = assignedIds.length === 0;

  let eligible = members.filter((m) => {
    if (m.status === "inactive") return false;
    if (preferredMemberId && m.id !== preferredMemberId) return false;
    if (!isAnyoneMode && !assignedIds.includes(m.id)) return false;
    if (locationId) {
      const ms = memberServices.find(
        (x) => x.memberId === m.id && x.serviceId === service.id,
      );
      if (ms?.locationIds && ms.locationIds.length > 0 && !ms.locationIds.includes(locationId)) {
        return false;
      }
    }
    return true;
  });

  if (eligible.length === 0) return [];

  // Effective duration: if a single artist is pinned with a duration override,
  // use that; if "anyone" mode, use the slowest possible duration so a slow
  // artist taking the slot doesn't overbook.
  const baseDuration = preferredMemberId
    ? resolveDuration(service, {
        variantId,
        memberId: preferredMemberId,
        memberDurationOverride,
      })
    : maxDuration(service);

  const buf = (() => {
    if (bufferBeforeMin != null || bufferAfterMin != null) {
      return { before: bufferBeforeMin ?? 0, after: bufferAfterMin ?? 0 };
    }
    return resolveBuffer(service);
  })();

  const totalNeeded = buf.before + baseDuration + Math.max(0, extraDurationMinutes) + buf.after;

  // Build per-member busy intervals (in minutes-of-day) from bookings.
  type Interval = { start: number; end: number };
  const busyByMember = new Map<string, Interval[]>();
  for (const b of bookings) {
    if (b.date !== date) continue;
    if (!b.assignedToId) continue;
    const startMin =
      new Date(b.startAt).getHours() * 60 + new Date(b.startAt).getMinutes();
    const endMin =
      new Date(b.endAt).getHours() * 60 + new Date(b.endAt).getMinutes();
    const list = busyByMember.get(b.assignedToId) ?? [];
    list.push({ start: startMin, end: endMin });
    busyByMember.set(b.assignedToId, list);
  }

  const memberIsFree = (memberId: string, start: number, end: number): boolean => {
    const intervals = busyByMember.get(memberId) ?? [];
    for (const iv of intervals) {
      if (start < iv.end && end > iv.start) return false;
    }
    return true;
  };

  const dayStart = parseHHMM(workspaceHours.start);
  const dayEnd = parseHHMM(workspaceHours.end);

  // Per-member working hours + leave gating. The operator form stores days
  // off in TWO ways depending on how it was authored:
  //   - `daysOff: string[]` — explicit list of weekday keys the member doesn't work
  //   - `workingHours: Record<weekday, {start, end}>` — only present for working days
  // We check daysOff first (definitive), then fall back to workingHours.
  const memberDayWindow = (memberId: string): { start: number; end: number } | null => {
    const m = members.find((x) => x.id === memberId);
    if (!m) return null;
    const onLeave = (m.leavePeriods ?? []).some(
      (lp) => date >= lp.start && date <= lp.end,
    );
    if (onLeave) return null;
    if ((m.daysOff ?? []).includes(weekday)) return null;
    const memberHours = m.workingHours?.[weekday];
    if (!memberHours) {
      // No per-day override and not in daysOff → default to workspace window.
      return { start: dayStart, end: dayEnd };
    }
    const memberStart = parseHHMM(memberHours.start);
    const memberEnd = parseHHMM(memberHours.end);
    return {
      start: Math.max(memberStart, dayStart),
      end: Math.min(memberEnd, dayEnd),
    };
  };

  // Pre-filter eligible to drop members on leave today.
  eligible = eligible.filter((m) => memberDayWindow(m.id) !== null);
  if (eligible.length === 0) return [];
  const minNoticeCutoff = (() => {
    if (!service.minNoticeHours) return 0;
    const now = new Date();
    const target = new Date(`${date}T00:00:00`);
    const hoursUntilDate = (target.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDate < service.minNoticeHours) {
      return Math.max(
        dayStart,
        now.getHours() * 60 + now.getMinutes() + service.minNoticeHours * 60,
      );
    }
    return 0;
  })();

  const slots: Slot[] = [];
  for (let cursor = dayStart; cursor + totalNeeded <= dayEnd; cursor += step) {
    if (cursor < minNoticeCutoff) continue;

    const slotStart = cursor + buf.before;
    const slotEnd = slotStart + baseDuration + Math.max(0, extraDurationMinutes);

    const freeMembers = eligible.filter((m) => {
      // Each member needs their full envelope (incl. buffers) clear AND the
      // envelope must sit inside their own working window for the day.
      if (!memberIsFree(m.id, cursor, cursor + totalNeeded)) return false;
      const window = memberDayWindow(m.id);
      if (!window) return false;
      if (cursor < window.start || cursor + totalNeeded > window.end) return false;
      return true;
    });
    if (freeMembers.length === 0) continue;

    // Resource conflict: every required resource must be free for the same
    // envelope. A busy resource rejects the slot regardless of artist
    // availability.
    if (
      service.requiredResourceIds &&
      service.requiredResourceIds.length > 0 &&
      resourceBusyByDay
    ) {
      let resourceConflict = false;
      for (const rid of service.requiredResourceIds) {
        const busy = resourceBusyByDay.get(rid) ?? [];
        for (const iv of busy) {
          if (cursor < iv.end && cursor + totalNeeded > iv.start) {
            resourceConflict = true;
            break;
          }
        }
        if (resourceConflict) break;
      }
      if (resourceConflict) continue;
    }

    slots.push({
      time: fmtHHMM(slotStart),
      startAt: localIso(date, fmtHHMM(slotStart)),
      endAt: localIso(date, fmtHHMM(slotEnd)),
      memberIds: freeMembers.map((m) => m.id),
    });

    if (limit && slots.length >= limit) break;
  }

  return slots;
}
