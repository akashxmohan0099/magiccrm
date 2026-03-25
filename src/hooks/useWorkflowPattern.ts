import { useMemo } from "react";
import { useResolvedWorkspace } from "./useResolvedWorkspace";
import { useIndustryConfig } from "./useIndustryConfig";
import type { WorkflowPattern } from "@/types/workspace-blueprint";

/**
 * Returns the active workflow pattern for the current workspace.
 *
 * Resolution order:
 * 1. From resolved workspace blueprint (if available)
 * 2. Derived from bookingMode.defaultMode (backward compat)
 * 3. Defaults to "booking-first"
 */
export function useWorkflowPattern(): WorkflowPattern {
  const resolved = useResolvedWorkspace();
  const config = useIndustryConfig();

  return useMemo(() => {
    // 1. Blueprint-defined pattern
    if (resolved?.functional.workflowPattern) {
      return resolved.functional.workflowPattern;
    }

    // 2. Derive from existing booking mode config
    switch (config.bookingMode.defaultMode) {
      case "recurring-lesson":
        return "recurring";
      case "date-exclusive":
        return "inquiry-first";
      default:
        return "booking-first";
    }
  }, [resolved, config.bookingMode.defaultMode]);
}
