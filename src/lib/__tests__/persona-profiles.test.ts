import { describe, it, expect } from "vitest";
import { PERSONA_PROFILES, getPersonaProfile, getProfileForAIPrompt } from "../persona-profiles";
import { INDUSTRY_CONFIGS } from "@/types/onboarding";

describe("persona-profiles", () => {
  // Collect all persona IDs from the onboarding configs
  const allPersonaIds = INDUSTRY_CONFIGS.flatMap(
    (industry) => (industry.personas || []).map((p) => p.id),
  );

  it("has a profile for every persona in INDUSTRY_CONFIGS", () => {
    const profileIds = new Set(PERSONA_PROFILES.map((p) => p.id));
    const missing = allPersonaIds.filter((id) => !profileIds.has(id));
    expect(missing).toEqual([]);
  });

  it("has no orphaned profiles (profile without a matching persona)", () => {
    const personaIdSet = new Set(allPersonaIds);
    const orphaned = PERSONA_PROFILES.filter((p) => !personaIdSet.has(p.id));
    expect(orphaned.map((p) => p.id)).toEqual([]);
  });

  it("every profile has non-empty fields", () => {
    for (const profile of PERSONA_PROFILES) {
      expect(profile.id).toBeTruthy();
      expect(profile.industryId).toBeTruthy();
      expect(profile.operatingModel).toBeTruthy();
      expect(profile.travelPattern.length).toBeGreaterThan(5);
      expect(profile.typicalServices.length).toBeGreaterThan(5);
      expect(profile.paymentModel.length).toBeGreaterThan(5);
      expect(profile.clientInteraction.length).toBeGreaterThan(5);
      expect(profile.commonChallenges.length).toBeGreaterThan(5);
    }
  });

  it("every profile has a valid operatingModel", () => {
    const validModels = new Set(["studio", "mobile", "on-site", "hybrid", "remote"]);
    for (const profile of PERSONA_PROFILES) {
      expect(validModels.has(profile.operatingModel)).toBe(true);
    }
  });

  it("every profile industryId matches the persona's actual industry", () => {
    for (const industry of INDUSTRY_CONFIGS) {
      for (const persona of industry.personas || []) {
        const profile = getPersonaProfile(persona.id);
        if (profile) {
          expect(profile.industryId).toBe(industry.id);
        }
      }
    }
  });

  it("getPersonaProfile returns undefined for unknown IDs", () => {
    expect(getPersonaProfile("nonexistent-persona")).toBeUndefined();
  });

  it("getProfileForAIPrompt returns a non-empty string for valid personas", () => {
    for (const id of allPersonaIds) {
      const prompt = getProfileForAIPrompt(id);
      expect(prompt.length).toBeGreaterThan(50);
      expect(prompt).toContain("Operating model:");
    }
  });

  it("getProfileForAIPrompt returns empty string for unknown personas", () => {
    expect(getProfileForAIPrompt("nonexistent")).toBe("");
  });
});
