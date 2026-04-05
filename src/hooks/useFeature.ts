"use client";

import { useMemo } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import {
  MODULE_REGISTRY,
  ModuleDefinition,
  ALWAYS_ON_MODULES,
  computeEnabledModuleIds,
} from "@/lib/module-registry";
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
  const needs = useOnboardingStore((s) => s.needs);
  const discoveryAnswers = useOnboardingStore((s) => s.discoveryAnswers);
  const enabledAddons = useAddonsStore((s) => s.enabledAddons);

  return useMemo(() => {
    // Add-ons live in their own store
    if (enabledAddons.includes(moduleId)) return true;

    const enabled = computeEnabledModuleIds(needs, discoveryAnswers);
    return enabled.has(moduleId);
  }, [moduleId, needs, discoveryAnswers, enabledAddons]);
}

/** Returns only core modules that are enabled via onboarding */
export function useEnabledModules(): ModuleDefinition[] {
  const needs = useOnboardingStore((s) => s.needs);
  const discoveryAnswers = useOnboardingStore((s) => s.discoveryAnswers);
  return useMemo(() => {
    const enabled = computeEnabledModuleIds(needs, discoveryAnswers);
    return MODULE_REGISTRY.filter((mod) => mod.kind !== "addon" && enabled.has(mod.id));
  }, [needs, discoveryAnswers]);
}

/** Returns add-on modules that the user has enabled */
export function useEnabledAddons(): ModuleDefinition[] {
  const enabledAddons = useAddonsStore((s) => s.enabledAddons);
  return useMemo(() => {
    return MODULE_REGISTRY.filter((mod) => mod.kind === "addon" && enabledAddons.includes(mod.id));
  }, [enabledAddons]);
}
