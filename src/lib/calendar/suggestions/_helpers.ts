import type { Booking, Client, Service } from "@/types/models";

/** YYYY-MM-DD in workspace local (wall-clock). */
export function todayString(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000,
  );
}

/**
 * Last completed/no_show booking per client. Excludes cancelled. The first
 * pass over bookings keeps the latest one.
 */
export function lastVisitByClient(
  bookings: Booking[],
): Map<string, Booking> {
  const out = new Map<string, Booking>();
  for (const b of bookings) {
    if (b.status === "cancelled" || b.status === "pending") continue;
    const prior = out.get(b.clientId);
    if (!prior || b.startAt > prior.startAt) out.set(b.clientId, b);
  }
  return out;
}

/** Service rebook cadence: explicit `rebookAfterDays` falls back to 42 days (~6 weeks, the beauty-industry mean). */
export function rebookCadence(service: Service | undefined): number {
  if (service?.rebookAfterDays && service.rebookAfterDays > 0) {
    return service.rebookAfterDays;
  }
  return 42;
}

/** Cap a list with deterministic ordering (most-recent visit first). */
export function pickTopClients(
  clients: Client[],
  lastVisit: Map<string, Booking>,
  limit: number,
): Client[] {
  return [...clients]
    .sort((a, b) => {
      const va = lastVisit.get(a.id)?.startAt ?? "";
      const vb = lastVisit.get(b.id)?.startAt ?? "";
      return vb.localeCompare(va);
    })
    .slice(0, limit);
}

export function clampInt(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return Math.round(n);
}
