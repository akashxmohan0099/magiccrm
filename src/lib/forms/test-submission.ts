import type { FormResponse, Inquiry } from "@/types/models";

/**
 * Predicate: is this row a test submission produced by the in-app
 * "Send test" button (POST /api/forms/[id]/test-submit)?
 *
 * Two markers, in order of reliability:
 *  - submission values include `__test: "true"` — set by the test endpoint
 *    on every entry it creates.
 *  - inquiry name starts with "[TEST] " — also set by the test endpoint.
 *
 * The values check is enough on its own; the name check exists because
 * Inquiry rows that originate from the /comms path don't carry submission
 * values, so a tester demoting a test inquiry by hand would otherwise sneak
 * back into the list. Both checks are cheap.
 */
export function isTestFormResponse(row: { values?: Record<string, unknown> | null }): boolean {
  const v = row.values;
  if (!v || typeof v !== "object") return false;
  const flag = (v as Record<string, unknown>).__test;
  return flag === "true" || flag === true;
}

export function isTestInquiry(row: Inquiry): boolean {
  if (typeof row.name === "string" && row.name.startsWith("[TEST] ")) return true;
  const sv = row.submissionValues;
  if (!sv || typeof sv !== "object") return false;
  const flag = (sv as Record<string, unknown>).__test;
  return flag === "true" || flag === true;
}

/** Drop test submissions from a list. Pure helper, easy to unit-test. */
export function withoutTestResponses<T extends { values?: Record<string, unknown> | null }>(
  rows: T[],
): T[] {
  return rows.filter((r) => !isTestFormResponse(r));
}

export function withoutTestInquiries(rows: Inquiry[]): Inquiry[] {
  return rows.filter((r) => !isTestInquiry(r));
}

// Re-export for callers that want the FormResponse-typed signature without
// repeating the cast.
export function withoutTestFormResponses(rows: FormResponse[]): FormResponse[] {
  return withoutTestResponses(rows);
}
