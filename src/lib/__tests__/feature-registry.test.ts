/**
 * CI validation tests for the feature registry and question bank.
 *
 * These ensure the mapping layer stays consistent as features and questions evolve.
 * Run with: npx vitest run src/lib/__tests__/feature-registry.test.ts
 */

import { describe, it, expect } from "vitest";
import { FEATURE_REGISTRY, getFeatureDefinition } from "../feature-registry";
import { DEEP_DIVE_QUESTIONS } from "../deep-dive-questions";
import { MODULE_REGISTRY } from "../module-registry";
import { FEATURE_BLOCKS } from "@/types/features";

describe("Feature Registry", () => {
  it("should have no duplicate featureIds", () => {
    const ids = FEATURE_REGISTRY.map((f) => f.featureId);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it("should have a registry entry for every sub-feature in FEATURE_BLOCKS", () => {
    for (const block of FEATURE_BLOCKS) {
      for (const sf of block.subFeatures) {
        const entry = getFeatureDefinition(sf.id);
        expect(entry, `Missing registry entry: ${sf.id} (${block.id})`).toBeDefined();
        expect(entry!.moduleId).toBe(block.id);
      }
    }
  });

  it("should have valid moduleIds matching MODULE_REGISTRY", () => {
    const validModuleIds = new Set(MODULE_REGISTRY.map((m) => m.id));
    // Also include addon feature block IDs that may not be in MODULE_REGISTRY core
    const blockIds = new Set(FEATURE_BLOCKS.map((b) => b.id));
    const allValid = new Set([...validModuleIds, ...blockIds]);

    for (const f of FEATURE_REGISTRY) {
      expect(allValid.has(f.moduleId), `Invalid moduleId: ${f.moduleId} for feature ${f.featureId}`).toBe(true);
    }
  });

  it("should have a valid riskTier for every entry", () => {
    for (const f of FEATURE_REGISTRY) {
      expect(["safe", "consequential", "deferred"]).toContain(f.riskTier);
    }
  });
});

describe("Deep-Dive Question Bank", () => {
  it("should have all enabled featureIds exist in FEATURE_REGISTRY", () => {
    for (const q of DEEP_DIVE_QUESTIONS) {
      for (const { featureId } of q.enables) {
        const entry = getFeatureDefinition(featureId);
        expect(entry, `Question ${q.id} references unknown featureId: ${featureId}`).toBeDefined();
      }
      // Check follow-up enables too
      if (q.followUp) {
        for (const { featureId } of q.followUp.enables) {
          const entry = getFeatureDefinition(featureId);
          expect(entry, `Question ${q.id} follow-up references unknown featureId: ${featureId}`).toBeDefined();
        }
      }
    }
  });

  it("should not auto-enable deferred-tier features", () => {
    for (const q of DEEP_DIVE_QUESTIONS) {
      for (const { featureId, action } of q.enables) {
        if (action === "auto") {
          const entry = getFeatureDefinition(featureId);
          expect(
            entry?.riskTier,
            `Question ${q.id} auto-enables deferred feature: ${featureId}`,
          ).not.toBe("deferred");
        }
      }
      if (q.followUp) {
        for (const { featureId, action } of q.followUp.enables) {
          if (action === "auto") {
            const entry = getFeatureDefinition(featureId);
            expect(
              entry?.riskTier,
              `Question ${q.id} follow-up auto-enables deferred feature: ${featureId}`,
            ).not.toBe("deferred");
          }
        }
      }
    }
  });

  it("should have unique question IDs", () => {
    const ids = DEEP_DIVE_QUESTIONS.map((q) => q.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it("should have valid moduleIds for all questions", () => {
    const blockIds = new Set(FEATURE_BLOCKS.map((b) => b.id));
    for (const q of DEEP_DIVE_QUESTIONS) {
      expect(blockIds.has(q.moduleId), `Question ${q.id} has invalid moduleId: ${q.moduleId}`).toBe(true);
    }
  });

  it("should have features belonging to the correct module", () => {
    for (const q of DEEP_DIVE_QUESTIONS) {
      for (const { featureId } of q.enables) {
        const entry = getFeatureDefinition(featureId);
        if (entry) {
          expect(
            entry.moduleId,
            `Question ${q.id}: feature ${featureId} belongs to ${entry.moduleId}, not ${q.moduleId}`,
          ).toBe(q.moduleId);
        }
      }
    }
  });
});

describe("Consequential Feature Coverage", () => {
  // Whitelist: consequential features intentionally NOT covered by questions
  // (they're handled by smart defaults or are too niche for onboarding)
  const COVERAGE_WHITELIST = new Set([
    "client-source-tracking",  // covered by chip question "track how clients found you"
    "rebooking-prompts",       // bundled with recurring-bookings question as recommend
    // Communication channels — covered by the channel picker UI in ConfigureStep, not yes/no questions
    "sms", "instagram-dms", "facebook-messenger", "whatsapp", "linkedin",
    // Team features — auto-assign only relevant when team module is enabled
    "auto-assign-leads",
  ]);

  it("should have every consequential feature covered by a question or whitelisted", async () => {
    const coveredFeatures = new Set<string>();

    // Check deep-dive questions
    for (const q of DEEP_DIVE_QUESTIONS) {
      for (const { featureId } of q.enables) {
        coveredFeatures.add(featureId);
      }
      if (q.followUp) {
        for (const { featureId } of q.followUp.enables) {
          coveredFeatures.add(featureId);
        }
      }
    }

    // Also check local follow-up questions (triggered by chip selections)
    const { LOCAL_FOLLOWUP_QUESTIONS } = await import("@/lib/local-followup-questions");
    for (const q of LOCAL_FOLLOWUP_QUESTIONS) {
      for (const { featureId } of q.enables) {
        coveredFeatures.add(featureId);
      }
      if (q.followUp) {
        for (const { featureId } of q.followUp.enables) {
          coveredFeatures.add(featureId);
        }
      }
    }

    const consequential = FEATURE_REGISTRY.filter((f) => f.riskTier === "consequential");
    const uncovered = consequential.filter(
      (f) => !coveredFeatures.has(f.featureId) && !COVERAGE_WHITELIST.has(f.featureId),
    );

    if (uncovered.length > 0) {
      const list = uncovered.map((f) => `${f.featureId} (${f.moduleId})`).join(", ");
      expect(uncovered.length, `Uncovered consequential features: ${list}`).toBe(0);
    }
  });
});
