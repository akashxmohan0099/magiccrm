import type { Booking, CalendarBlock } from "@/types/models";

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const PX_PER_HOUR = 64;
export const WEEK_PX_PER_HOUR = 48;
export const GRID_FIRST_HOUR = 0;
export const GRID_LAST_HOUR = 24;
/** Default visible window when no working-hours config is loaded yet. */
export const DEFAULT_FIRST_HOUR = 7;
export const DEFAULT_LAST_HOUR = 21;
export const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * Compute the visible-hour window from workspace working hours: earliest
 * start across the week (rounded down) → latest end (rounded up). Falls
 * back to a 7AM–9PM window when no hours exist yet so the grid still
 * renders. Min span is 8h to keep the UI usable.
 */
export function deriveHourWindow(
  hours: Record<string, { start?: string; end?: string }> | undefined,
): { firstHour: number; lastHour: number } {
  const fallback = { firstHour: DEFAULT_FIRST_HOUR, lastHour: DEFAULT_LAST_HOUR };
  if (!hours) return fallback;
  let earliest: number | null = null;
  let latest: number | null = null;
  for (const day of Object.values(hours)) {
    if (!day?.start || !day?.end) continue;
    const [sh] = day.start.split(":").map(Number);
    const [eh, em] = day.end.split(":").map(Number);
    const startHr = isFinite(sh) ? sh : null;
    const endHr = isFinite(eh) ? (em ? eh + 1 : eh) : null;
    if (startHr !== null && (earliest === null || startHr < earliest)) earliest = startHr;
    if (endHr !== null && (latest === null || endHr > latest)) latest = endHr;
  }
  if (earliest === null || latest === null) return fallback;
  // Ensure at least an 8h span to keep the time grid usable.
  if (latest - earliest < 8) latest = earliest + 8;
  return {
    firstHour: Math.max(0, Math.min(earliest, 23)),
    lastHour: Math.max(earliest + 1, Math.min(latest, 24)),
  };
}

export function deriveDayMinuteWindow(
  date: Date,
  hours: Record<string, { start?: string; end?: string }> | undefined,
): { start: number; end: number } | null {
  const day = hours?.[WEEKDAY_KEYS[date.getDay()]];
  if (!day?.start || !day?.end) return null;
  const start = timeToMinutes(day.start);
  const end = timeToMinutes(day.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { start, end };
}

export function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function timeToMinutes(time: string): number {
  // Handle both ISO timestamps and HH:MM format
  if (time.includes("T")) {
    const match = time.match(/T(\d{2}):(\d{2})/);
    if (match) return Number(match[1]) * 60 + Number(match[2]);
  }
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * A block is "all-day" when it spans (close to) the entire wall-clock day.
 * Vacation/closed blocks created from `Close this day` use 00:00–23:59, so
 * we use a generous 23h+ threshold instead of strict equality.
 */
export function isAllDayBlock(b: CalendarBlock): boolean {
  const startMin = timeToMinutes(b.startTime);
  const endMin = timeToMinutes(b.endTime);
  return endMin - startMin >= 23 * 60;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatTimeDisplay(isoOrTime: string): string {
  if (isoOrTime.includes("T")) {
    const match = isoOrTime.match(/T(\d{2}):(\d{2})/);
    if (match) return `${match[1]}:${match[2]}`;
  }
  return isoOrTime;
}

export function addMinutesToWallClock(
  value: string,
  date: string,
  minutes: number,
  minMin: number,
  maxMin: number,
): string {
  const datePart = value.includes("T") ? value.slice(0, 10) : date;
  const start = timeToMinutes(value);
  const next = Math.max(minMin, Math.min(maxMin, start + minutes));
  return `${datePart}T${minutesToTime(next)}:00`;
}

export function scrollToMinute(
  ref: React.RefObject<HTMLDivElement | null>,
  minute: number,
  pxPerHour: number,
  viewportHeight: number,
  behavior: ScrollBehavior,
) {
  if (!ref.current) return;
  const target = (minute / 60) * pxPerHour - viewportHeight / 2;
  const max = ref.current.scrollHeight - ref.current.clientHeight;
  ref.current.scrollTo({
    top: Math.max(0, Math.min(target, max)),
    behavior,
  });
}

export function formatTimeLabel(hour: number): string {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

export const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-primary/20 border-primary/30 text-foreground",
  pending: "bg-yellow-50 border-yellow-200 text-yellow-800",
  completed: "bg-emerald-50 border-emerald-200 text-emerald-800",
  cancelled: "bg-red-50 border-red-200 text-red-500 line-through opacity-50",
  no_show: "bg-gray-100 border-gray-300 text-gray-500",
};

export function getBookingStyle(b: Booking): string {
  return STATUS_STYLES[b.status] || STATUS_STYLES.confirmed;
}
