import { useSyncExternalStore } from "react";

// Magic-string for the catch-all category bucket — kept in sync with
// services/list/category-colors.ts. Re-declared here to keep the preview
// surface dependency-free of the list internals.
export const UNCATEGORIZED = "Uncategorized";

const emptySubscribe = () => () => {};
export function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function nameColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(h) % 360} 60% 88%)`;
}

export function hhmmToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToHHMM(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Walk a basket of duration-bearing items in order, attaching a chain start
 * time to each based on the booking's overall start time. Pure function so
 * it works inside JSX without local mutation.
 */
export function chainItems<T extends { duration: number }>(
  items: T[],
  startTime: string | null,
): { item: T; startAt: number | null }[] {
  if (!startTime) return items.map((item) => ({ item, startAt: null }));
  let cursor = hhmmToMinutes(startTime);
  return items.map((item) => {
    const startAt = cursor;
    cursor += item.duration;
    return { item, startAt };
  });
}

export function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
