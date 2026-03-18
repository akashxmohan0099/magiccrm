"use client";

import { useMemo } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { MODULE_REGISTRY, ModuleDefinition } from "@/lib/module-registry";

export function useFeature(moduleId: string, featureId: string): boolean {
  const featureSelections = useOnboardingStore((s) => s.featureSelections);
  const features = featureSelections[moduleId];
  if (!features) return false;
  const feature = features.find((f) => f.id === featureId);
  return feature?.selected ?? false;
}

export function useModuleEnabled(moduleId: string): boolean {
  const featureSelections = useOnboardingStore((s) => s.featureSelections);
  const features = featureSelections[moduleId];
  if (!features || features.length === 0) return false;
  return features.some((f) => f.selected);
}

export function useEnabledModules(): ModuleDefinition[] {
  const featureSelections = useOnboardingStore((s) => s.featureSelections);
  return useMemo(() => {
    return MODULE_REGISTRY.filter((mod) => {
      const features = featureSelections[mod.id];
      return features && features.length > 0 && features.some((f) => f.selected);
    });
  }, [featureSelections]);
}
