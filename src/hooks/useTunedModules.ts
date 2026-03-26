import { useMemo } from "react";
import type { ModuleDefinition } from "@/lib/module-registry";
import { getCombinationById, type ModuleCombination } from "@/lib/module-combinations";

export interface TunedModuleDisplay {
  /** Unique key for rendering */
  id: string;
  slug: string;
  label: string;
  description: string;
  icon: string;
  /** Whether this is a combined module (multiple merged into one) */
  isCombination: boolean;
  /** For combinations: the underlying module IDs */
  constituentModuleIds: string[];
  /** For combinations: the combination definition */
  combination?: ModuleCombination;
  /** For single modules: the original module definition */
  moduleDefinition?: ModuleDefinition;
  /** Whether the user can toggle this off */
  canToggle: boolean;
  /** Original module IDs (for non-combinations, just [id]) */
  originalModuleIds: string[];
}

/**
 * Transforms enabled modules + tuning results into a display-ready list.
 * Combined modules appear as a single entry; their constituent modules are hidden.
 */
export function useTunedModules(
  enabledModules: ModuleDefinition[],
  tuningCombinations: string[],
  tuningModuleMeta: Record<string, { label: string; description: string }>,
  alwaysOnModuleIds: Set<string>,
  vocab: { clients?: string; client?: string },
): TunedModuleDisplay[] {
  return useMemo(() => {
    // Collect all module IDs that are absorbed into active combinations
    const mergedModuleIds = new Set<string>();
    const combinationEntries: TunedModuleDisplay[] = [];

    for (const comboId of tuningCombinations) {
      const combo = getCombinationById(comboId);
      if (!combo) continue;

      // Mark constituent modules as merged
      for (const moduleId of combo.mergedModuleIds) {
        mergedModuleIds.add(moduleId);
      }

      // Get personalized meta for the combination (use first merged module's meta as hint)
      const meta = tuningModuleMeta[combo.id]; // try combo ID first

      combinationEntries.push({
        id: `combo:${combo.id}`,
        slug: combo.slug,
        label: meta?.label || combo.defaultLabel,
        description: meta?.description || combo.defaultDescription,
        icon: combo.icon,
        isCombination: true,
        constituentModuleIds: combo.mergedModuleIds,
        combination: combo,
        canToggle: !combo.mergedModuleIds.every((id) => alwaysOnModuleIds.has(id)),
        originalModuleIds: combo.mergedModuleIds,
      });
    }

    // Build the display list: combinations first at the position of their primary module
    const result: TunedModuleDisplay[] = [];
    const insertedCombos = new Set<string>();

    for (const mod of enabledModules) {
      // Skip modules that are absorbed into a combination
      if (mergedModuleIds.has(mod.id)) {
        // Check if this is the primary module of a combination — insert the combo entry here
        for (const entry of combinationEntries) {
          if (!insertedCombos.has(entry.id) && entry.combination?.primaryModuleId === mod.id) {
            result.push(entry);
            insertedCombos.add(entry.id);
          }
        }
        continue;
      }

      // Regular module with personalized meta
      const meta = tuningModuleMeta[mod.id];
      result.push({
        id: mod.id,
        slug: mod.slug,
        label: meta?.label || mod.name,
        description: meta?.description || mod.description,
        icon: mod.icon,
        isCombination: false,
        constituentModuleIds: [],
        moduleDefinition: mod,
        canToggle: !alwaysOnModuleIds.has(mod.id),
        originalModuleIds: [mod.id],
      });
    }

    // Append any combinations that weren't inserted (shouldn't happen, but safety)
    for (const entry of combinationEntries) {
      if (!insertedCombos.has(entry.id)) {
        result.push(entry);
      }
    }

    return result;
  }, [enabledModules, tuningCombinations, tuningModuleMeta, alwaysOnModuleIds]);
}
