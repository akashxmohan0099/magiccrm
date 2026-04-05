import { describe, it, expect } from "vitest";
import { LOCAL_FOLLOWUP_QUESTIONS, getLocalFollowUps } from "../local-followup-questions";

describe("local-followup-questions", () => {
  it("returns empty array when no chips match", () => {
    expect(getLocalFollowUps([])).toEqual([]);
    expect(getLocalFollowUps(["nonexistent-chip"])).toEqual([]);
  });

  it("returns travel-fee question when op-mobile chip is selected", () => {
    const results = getLocalFollowUps(["op-mobile"]);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("travel-fee");
    expect(results[0].question).toContain("travel");
  });

  it("returns team-roster question when op-team chip is selected", () => {
    const results = getLocalFollowUps(["op-team"]);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("team-roster");
  });

  it("returns multiple questions when multiple chips are selected", () => {
    const results = getLocalFollowUps(["op-mobile", "deposits", "op-team"]);
    expect(results).toHaveLength(3);
    const ids = results.map((q) => q.id);
    expect(ids).toContain("travel-fee");
    expect(ids).toContain("deposit-percent");
    expect(ids).toContain("team-roster");
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
