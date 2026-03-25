import { useMemo } from "react";
import { useEffectivePresentation } from "./useResolvedWorkspace";
import type { ModulePresentation } from "@/types/workspace-blueprint";

/**
 * Returns the presentation config for a specific module.
 *
 * Includes default columns and column label overrides from the
 * resolved workspace blueprint. Returns null if no blueprint is
 * active (falls back to static defaults in components).
 */
export function useModulePresentation(moduleId: string): ModulePresentation | null {
  const presentation = useEffectivePresentation();

  return useMemo(() => {
    if (!presentation) return null;
    return presentation.modulePresentation[moduleId] ?? null;
  }, [presentation, moduleId]);
}
