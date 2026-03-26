import { useMemo } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { getCombinationById } from "@/lib/module-combinations";
import { getModuleById } from "@/lib/module-registry";

/**
 * Returns the active module combinations and a helper to check if a module is merged.
 */
export function useActiveCombinations() {
  const tuningCombinations = useOnboardingStore((s) => s.tuningCombinations);
  const tuningModuleMeta = useOnboardingStore((s) => s.tuningModuleMeta);

  return useMemo(() => {
    const activeCombos = tuningCombinations
      .map((id) => getCombinationById(id))
      .filter(Boolean) as NonNullable<ReturnType<typeof getCombinationById>>[];

    // Set of module IDs that are absorbed into a combination
    const mergedModuleIds = new Set<string>();
    for (const combo of activeCombos) {
      for (const moduleId of combo.mergedModuleIds) {
        mergedModuleIds.add(moduleId);
      }
    }

    // Module slug → module ID lookup for merged modules
    const mergedSlugs = new Set<string>();
    for (const moduleId of mergedModuleIds) {
      const mod = getModuleById(moduleId);
      if (mod) mergedSlugs.add(mod.slug);
    }

    return {
      activeCombinations: activeCombos,
      mergedModuleIds,
      mergedSlugs,
      tuningModuleMeta,
      /** Check if a module ID is part of an active combination */
      isModuleMerged: (moduleId: string) => mergedModuleIds.has(moduleId),
      /** Check if a module slug is part of an active combination */
      isSlugMerged: (slug: string) => mergedSlugs.has(slug),
    };
  }, [tuningCombinations, tuningModuleMeta]);
}
