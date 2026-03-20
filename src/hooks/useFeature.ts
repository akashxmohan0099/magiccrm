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
    return !!features && features.length > 0;
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

/** Returns only core modules that are enabled via onboarding */
export function useEnabledModules(): ModuleDefinition[] {
  const featureSelections = useOnboardingStore((s) => s.featureSelections);
  return useMemo(() => {
    return MODULE_REGISTRY.filter((mod) => {
      if (mod.kind === "addon") return false; // add-ons handled separately
      const features = featureSelections[mod.id];
      return features && features.length > 0 && features.some((f) => f.selected);
    });
  }, [featureSelections]);
}

/** Returns add-on modules that the user has enabled */
export function useEnabledAddons(): ModuleDefinition[] {
  const enabledAddons = useAddonsStore((s) => s.enabledAddons);
  return useMemo(() => {
    return MODULE_REGISTRY.filter((mod) => mod.kind === "addon" && enabledAddons.includes(mod.id));
  }, [enabledAddons]);
}
