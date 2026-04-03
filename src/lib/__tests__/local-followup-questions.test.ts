import { describe, it, expect } from "vitest";
import { LOCAL_FOLLOWUP_QUESTIONS, getLocalFollowUps } from "../local-followup-questions";

describe("local-followup-questions", () => {
  it("returns empty array when no chips match", () => {
    expect(getLocalFollowUps([])).toEqual([]);
    expect(getLocalFollowUps(["nonexistent-chip"])).toEqual([]);
  });

  it("returns travel-charge question when visit-clients chip is selected", () => {
    const results = getLocalFollowUps(["visit-clients"]);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("travel-charge");
    expect(results[0].question).toContain("travel");
  });

  it("returns team-services question when op-team chip is selected", () => {
    const results = getLocalFollowUps(["op-team"]);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("team-services");
  });

  it("returns multiple questions when multiple chips are selected", () => {
    const results = getLocalFollowUps(["visit-clients", "memberships", "op-team"]);
    expect(results).toHaveLength(3);
    const ids = results.map((q) => q.id);
    expect(ids).toContain("travel-charge");
    expect(ids).toContain("memberships-packs");
    expect(ids).toContain("team-services");
  });

  it("travel-charge has a follow-up question", () => {
    const travel = LOCAL_FOLLOWUP_QUESTIONS.find((q) => q.id === "travel-charge");
    expect(travel).toBeDefined();
    expect(travel!.followUp).toBeDefined();
    expect(travel!.followUp!.condition).toBe("yes");
    expect(travel!.followUp!.question).toContain("distance");
  });

  it("every question has valid enables with featureId and action", () => {
    for (const q of LOCAL_FOLLOWUP_QUESTIONS) {
      expect(q.enables.length).toBeGreaterThan(0);
      for (const enable of q.enables) {
        expect(enable.featureId).toBeTruthy();
        expect(["auto", "recommend"]).toContain(enable.action);
      }
    }
  });

  it("every question has a non-empty triggerChipId", () => {
    for (const q of LOCAL_FOLLOWUP_QUESTIONS) {
      expect(q.triggerChipId).toBeTruthy();
    }
  });
});
