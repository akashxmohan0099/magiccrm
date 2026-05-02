/**
 * Pure resource-conflict checker.
 *
 * Given a candidate booking window and a list of existing bookings, return
 * every conflict where another booking already holds one of the candidate's
 * required resources during the (buffer-inflated) window.
 *
 * Used by:
 *   - the admin BookingForm to show a soft warning the operator can override
 *   - tests (no Supabase needed)
 *
 * The public booking path does its own DB-side scan and rejects clashes
 * outright; this helper exists so the admin path can reach the same answer
 * from the in-memory Zustand stores without round-tripping the server.
 */

export interface ConflictBooking {
  id: string;
  /** ISO start_at of the existing booking. */
  startAt: string;
  /** ISO end_at of the existing booking. */
  endAt: string;
  /** Resources this booking holds (from its service's required_resource_ids). */
  requiredResourceIds: string[];
  /** Service buffer minutes — inflate the window on each side. Defaults to 0. */
  bufferBefore?: number;
  bufferAfter?: number;
  /** Display fields to surface in the warning UI. */
  serviceName?: string;
  assignedMemberName?: string;
}

export interface ConflictCandidate {
  /** ISO start_at the operator is trying to book. */
  startAt: string;
  /** ISO end_at the operator is trying to book. */
  endAt: string;
  /** Resources the new booking would hold. */
  requiredResourceIds: string[];
}

export interface ResourceConflict {
  /** The resource the candidate and the existing booking share. */
  resourceId: string;
  /** The existing booking that already holds it. */
  bookingId: string;
  /** Buffer-inflated window of the existing booking, ISO strings. */
  busyStartAt: string;
  busyEndAt: string;
  /** Display hints — populated when the caller passed them on the input. */
  serviceName?: string;
  assignedMemberName?: string;
}

export function findResourceConflicts(
  candidate: ConflictCandidate,
  bookings: ConflictBooking[],
): ResourceConflict[] {
  if (candidate.requiredResourceIds.length === 0) return [];
  const candStart = new Date(candidate.startAt).getTime();
  const candEnd = new Date(candidate.endAt).getTime();
  if (!Number.isFinite(candStart) || !Number.isFinite(candEnd) || candEnd <= candStart) {
    return [];
  }
  const out: ResourceConflict[] = [];
  for (const b of bookings) {
    const reqs = b.requiredResourceIds ?? [];
    if (reqs.length === 0) continue;
    const shared = reqs.filter((rid) => candidate.requiredResourceIds.includes(rid));
    if (shared.length === 0) continue;
    const before = (b.bufferBefore ?? 0) * 60_000;
    const after = (b.bufferAfter ?? 0) * 60_000;
    const bStart = new Date(b.startAt).getTime() - before;
    const bEnd = new Date(b.endAt).getTime() + after;
    if (!Number.isFinite(bStart) || !Number.isFinite(bEnd)) continue;
    // Half-open overlap test — touching edges (one ends exactly when the
    // other starts) does not conflict.
    if (bStart >= candEnd || bEnd <= candStart) continue;
    for (const rid of shared) {
      out.push({
        resourceId: rid,
        bookingId: b.id,
        busyStartAt: new Date(bStart).toISOString(),
        busyEndAt: new Date(bEnd).toISOString(),
        serviceName: b.serviceName,
        assignedMemberName: b.assignedMemberName,
      });
    }
  }
  return out;
}
