"use client";

import { useMemo } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { MODULE_REGISTRY, ModuleDefinition } from "@/lib/module-registry";
import { FEATURE_BLOCKS } from "@/types/features";
import { useAddonsStore } from "@/store/addons";

// Precompute a set of core feature IDs per module for fast lookup
const CORE_FEATURE_IDS: Record<string, Set<string>> = {};
for (const block of FEATURE_BLOCKS) {
  CORE_FEATURE_IDS[block.id] = new Set(block.coreFeatures.map((f) => f.id));
}

export function useFeature(moduleId: string, featureId: string): boolean {
  const featureSelections = useOnboardingStore((s) => s.featureSelections);

  // Core features are always enabled when the module has any selections
  if (CORE_FEATURE_IDS[moduleId]?.has(featureId)) {
    const features = featureSelections[moduleId];
    return !!features && features.some(f => f.selected);
  }

  const features = featureSelections[moduleId];
  if (!features) return false;
  const feature = features.find((f) => f.id === featureId);
  return feature?.selected ?? false;
}

export function useModuleEnabled(moduleId: string): boolean {
  const featureSelections = useOnboardingStore((s) => s.featureSelections);
  const enabledAddons = useAddonsStore((s) => s.enabledAddons);

  // Check if it's an enabled add-on
  if (enabledAddons.includes(moduleId)) return true;

  // Check core module feature selections
  const features = featureSelections[moduleId];
  if (!features || features.length === 0) return false;
  return features.some((f) => f.selected);
}

// Always-on modules — enabled for every user regardless of answers
const ALWAYS_ON_MODULES = new Set([
  "client-database",
  "leads-pipeline",
  "communication",
  "quotes-invoicing",
]);

// Map from module IDs to their NeedsAssessment trigger keys
const MODULE_TO_NEED: Record<string, string> = {
  "client-database": "manageCustomers",
  "leads-pipeline": "receiveInquiries",
  "communication": "communicateClients",
  "bookings-calendar": "acceptBookings",
  "quotes-invoicing": "sendInvoices",
  "jobs-projects": "manageProjects",
  "marketing": "runMarketing",
};

/** Returns only core modules that are enabled via onboarding */
export function useEnabledModules(): ModuleDefinition[] {
  const featureSelections = useOnboardingStore((s) => s.featureSelections);
  const needs = useOnboardingStore((s) => s.needs);
  return useMemo(() => {
    return MODULE_REGISTRY.filter((mod) => {
      if (mod.kind === "addon") return false;

      // Always-on modules are enabled for every user
      if (ALWAYS_ON_MODULES.has(mod.id)) return true;

      // Check direct feature selections (by module ID)
      const features = featureSelections[mod.id];
      if (features && features.length > 0 && features.some((f) => f.selected)) return true;

      // Check by NeedsAssessment key (legacy/onboarding writes)
      const needKey = MODULE_TO_NEED[mod.id];
      if (needKey) {
        const needFeatures = featureSelections[needKey];
        if (needFeatures && needFeatures.length > 0 && needFeatures.some((f) => f.selected)) return true;
      }

      // Check auto-enabled modules (products, team, automations, reporting, client-portal)
      const block = FEATURE_BLOCKS.find((b) => b.id === mod.id);
      if (block?.autoEnabledBy) {
        const isAutoEnabled = block.autoEnabledBy.some((trigger) => needs[trigger]);
        if (isAutoEnabled) return true;
      }
      if (block?.triggeredBy && needs[block.triggeredBy]) return true;

      return false;
    });
  }, [featureSelections, needs]);
}

/** Returns add-on modules that the user has enabled */
export function useEnabledAddons(): ModuleDefinition[] {
  const enabledAddons = useAddonsStore((s) => s.enabledAddons);
  return useMemo(() => {
    return MODULE_REGISTRY.filter((mod) => mod.kind === "addon" && enabledAddons.includes(mod.id));
  }, [enabledAddons]);
}
