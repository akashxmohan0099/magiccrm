// Pure helpers used across the Forms feature. Pulled out so the editor and
// list pages don't redefine the same time-formatting / slug / CSV utilities,
// and so they can be unit-tested in isolation if needed.

import { useSyncExternalStore } from "react";
import type { FormFieldConfig, FormFieldCondition, FormFontFamily } from "@/types/models";

// ── React mount detection ───────────────────────────────────
//
// SSR-safe mount detection without setState-in-effect. Used by portals and
// other client-only DOM consumers so they don't render against
// document.body before hydration.
const emptySubscribe = () => () => {};
export function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// ── Slug + URL helpers ──────────────────────────────────────

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ── Time formatting ─────────────────────────────────────────

/** Compact relative time for at-a-glance row metadata: "just now", "2h ago",
 *  "yesterday", "3d ago", or a localized date once it's older than a week. */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

/** Absolute date formatter for the "Created …" footer line — always shown
 *  in full so the operator can scan the canonical date without doing the
 *  relative-time arithmetic in their head. */
export function formatTimestamp(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── CSV ─────────────────────────────────────────────────────

/** RFC4180-ish CSV cell escape. Wraps the value in quotes when it contains
 *  a comma, quote, CR, or LF; doubles up embedded quotes. */
export function csvEscape(value: string) {
  if (value === "") return "";
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

// ── Field-config helpers ────────────────────────────────────

/** Field types that present a list of selectable options to the visitor. */
export function fieldHasOptions(type: FormFieldConfig["type"]): boolean {
  return type === "select" || type === "multi_select" || type === "radio" || type === "checkbox";
}

/** Fields that can drive a `showWhen` rule on the field at `idx` — i.e.
 *  any earlier field whose answer can be reasoned about. Gating on
 *  something the visitor hasn't seen yet would be confusing, so only
 *  prior fields qualify. Hidden, file, and date-range fields are
 *  excluded as condition sources because their values aren't meaningful
 *  to compare. */
export function eligibleConditionFields(
  fields: FormFieldConfig[],
  idx: number,
): FormFieldConfig[] {
  return fields
    .slice(0, idx)
    .filter((f) => f.type !== "hidden" && f.type !== "file" && f.type !== "date_range");
}

/** Default rule seeded when the user first turns conditional logic on for
 *  a field. Picks the most recent eligible field — almost always what
 *  they meant. Returns undefined if no eligible source exists. Values
 *  start empty so the picker is the first thing the operator focuses. */
export function seedCondition(
  fields: FormFieldConfig[],
  idx: number,
): FormFieldCondition | undefined {
  const eligible = eligibleConditionFields(fields, idx);
  if (eligible.length === 0) return undefined;
  const ref = eligible[eligible.length - 1];
  return { fieldName: ref.name, operator: "equals", values: [] };
}

// ── Font pair preset matching ───────────────────────────────
//
// Local copy of the FONT_PAIR_PRESETS list: matchFontPair is needed by the
// helpers module without pulling in the editor's giant component file.
// Keep in sync with the FONT_PAIR_PRESETS in FormsPage.tsx.
const FONT_PAIR_IDS: {
  id: string;
  heading: FormFontFamily;
  body: FormFontFamily;
}[] = [
  { id: "soft-romantic", heading: "serif", body: "sans" },
  { id: "modern-editorial", heading: "display", body: "serif" },
  { id: "luxe-minimal", heading: "display", body: "sans" },
  { id: "classic", heading: "sans", body: "sans" },
];

export function matchFontPair(heading: FormFontFamily, body: FormFontFamily): string {
  const found = FONT_PAIR_IDS.find((p) => p.heading === heading && p.body === body);
  return found?.id ?? "soft-romantic";
}
