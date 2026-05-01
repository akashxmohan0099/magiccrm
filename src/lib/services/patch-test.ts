/**
 * Patch-test gate. Pure helper that decides whether a client may book a
 * given service based on their patch-test history. Used both server-side
 * (booking endpoint hard-blocks) and client-side (booking page surfaces
 * a warning before the slot picker so the customer isn't blindsided).
 */
import type { Client, Service } from "@/types/models";

export interface PatchTestStatus {
  required: boolean;
  /** True when a fresh enough test exists. */
  passes: boolean;
  /** Human-readable reason when it doesn't pass. */
  reason?: string;
  /** Most recent matching test, when one exists (regardless of expiry). */
  mostRecentDate?: string;
}

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export function checkPatchTest(
  service: Pick<
    Service,
    "requiresPatchTest" | "patchTestValidityDays" | "patchTestMinLeadHours" | "patchTestCategory"
  >,
  client: Pick<Client, "patchTests"> | null,
  appointmentAt: Date | string,
): PatchTestStatus {
  if (!service.requiresPatchTest) return { required: false, passes: true };

  const tests = client?.patchTests ?? [];
  const category = service.patchTestCategory;
  const matching = category
    ? tests.filter((t) => t.category === category)
    : tests;

  if (matching.length === 0) {
    return {
      required: true,
      passes: false,
      reason: category
        ? `No ${category} patch test on file. Please book a patch test first.`
        : "No patch test on file. Please book a patch test first.",
    };
  }

  // Take the most recent test.
  const sorted = [...matching].sort(
    (a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime(),
  );
  const latest = sorted[0];
  const testedAt = new Date(latest.testedAt);
  const apptAt = typeof appointmentAt === "string" ? new Date(appointmentAt) : appointmentAt;

  // Must have happened far enough BEFORE the appointment.
  const minLeadHours = service.patchTestMinLeadHours ?? 0;
  if (minLeadHours > 0) {
    const lead = (apptAt.getTime() - testedAt.getTime()) / HOUR_MS;
    if (lead < minLeadHours) {
      return {
        required: true,
        passes: false,
        mostRecentDate: latest.testedAt,
        reason: `Patch test must be at least ${minLeadHours}h before the appointment. Yours was ${Math.floor(lead)}h ahead.`,
      };
    }
  }

  // Must not be older than the validity window.
  const validityDays = service.patchTestValidityDays ?? 0;
  if (validityDays > 0) {
    const ageDays = (apptAt.getTime() - testedAt.getTime()) / DAY_MS;
    if (ageDays > validityDays) {
      return {
        required: true,
        passes: false,
        mostRecentDate: latest.testedAt,
        reason: `Patch test on ${latest.testedAt} expired (valid for ${validityDays} days).`,
      };
    }
  }

  return {
    required: true,
    passes: true,
    mostRecentDate: latest.testedAt,
  };
}
