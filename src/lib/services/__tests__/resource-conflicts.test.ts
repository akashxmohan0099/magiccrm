import { describe, it, expect } from "vitest";
import {
  findResourceConflicts,
  type ConflictBooking,
  type ConflictCandidate,
} from "../resource-conflicts";

const candidate: ConflictCandidate = {
  startAt: "2026-05-02T14:00:00Z",
  endAt: "2026-05-02T15:00:00Z",
  requiredResourceIds: ["room-a"],
};

function existing(overrides: Partial<ConflictBooking> & { id: string }): ConflictBooking {
  return {
    startAt: "2026-05-02T14:30:00Z",
    endAt: "2026-05-02T15:30:00Z",
    requiredResourceIds: ["room-a"],
    ...overrides,
  };
}

describe("findResourceConflicts", () => {
  it("returns no conflicts when the candidate requires nothing", () => {
    const out = findResourceConflicts(
      { ...candidate, requiredResourceIds: [] },
      [existing({ id: "b1" })],
    );
    expect(out).toEqual([]);
  });

  it("returns no conflicts when no existing booking shares a resource", () => {
    const out = findResourceConflicts(candidate, [
      existing({ id: "b1", requiredResourceIds: ["room-b"] }),
    ]);
    expect(out).toEqual([]);
  });

  it("flags a conflict on direct overlap", () => {
    const out = findResourceConflicts(candidate, [existing({ id: "b1" })]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ resourceId: "room-a", bookingId: "b1" });
  });

  it("does not flag a touching-edge booking (existing ends exactly when candidate starts)", () => {
    const out = findResourceConflicts(candidate, [
      existing({
        id: "b1",
        startAt: "2026-05-02T13:00:00Z",
        endAt: "2026-05-02T14:00:00Z",
      }),
    ]);
    expect(out).toEqual([]);
  });

  it("inflates the existing booking's window by its before/after buffers", () => {
    // A 14:30-15:30 booking with a 60-min `bufferBefore` runs 13:30-15:30
    // for resource purposes. The candidate (14:00-15:00) now overlaps.
    const out = findResourceConflicts(
      {
        ...candidate,
        startAt: "2026-05-02T13:00:00Z",
        endAt: "2026-05-02T13:45:00Z",
      },
      [
        existing({
          id: "b1",
          startAt: "2026-05-02T14:00:00Z",
          endAt: "2026-05-02T15:00:00Z",
          bufferBefore: 60,
        }),
      ],
    );
    expect(out).toHaveLength(1);
    expect(out[0].busyStartAt).toBe("2026-05-02T13:00:00.000Z");
  });

  it("returns one conflict per shared resource", () => {
    const out = findResourceConflicts(
      { ...candidate, requiredResourceIds: ["room-a", "chair-1"] },
      [existing({ id: "b1", requiredResourceIds: ["room-a", "chair-1"] })],
    );
    expect(out.map((c) => c.resourceId).sort()).toEqual(["chair-1", "room-a"]);
  });

  it("propagates display hints when supplied", () => {
    const out = findResourceConflicts(candidate, [
      existing({
        id: "b1",
        serviceName: "Lash extensions",
        assignedMemberName: "Mia",
      }),
    ]);
    expect(out[0]).toMatchObject({
      serviceName: "Lash extensions",
      assignedMemberName: "Mia",
    });
  });

  it("ignores candidates with non-positive duration", () => {
    const out = findResourceConflicts(
      { ...candidate, endAt: "2026-05-02T13:00:00Z" }, // ends before start
      [existing({ id: "b1" })],
    );
    expect(out).toEqual([]);
  });
});
