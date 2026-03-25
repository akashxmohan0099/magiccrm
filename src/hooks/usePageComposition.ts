import { useMemo } from "react";
import { useEffectivePresentation } from "./useResolvedWorkspace";

interface PageCompositionResult {
  homePage: string;
  sidebarOrder: string[];
  primaryAction: { label: string; href: string; icon: string };
}

const DEFAULT_COMPOSITION: PageCompositionResult = {
  homePage: "clients",
  sidebarOrder: ["clients", "leads", "communication", "bookings", "jobs", "invoicing"],
  primaryAction: { label: "Add Client", href: "/dashboard/clients", icon: "Plus" },
};

/**
 * Returns the page composition for the current workspace.
 *
 * Determines which module is "home", the sidebar order, and the
 * primary CTA button. Falls back to a sensible default if no
 * blueprint is active.
 */
export function usePageComposition(): PageCompositionResult {
  const presentation = useEffectivePresentation();

  return useMemo(() => {
    if (!presentation) return DEFAULT_COMPOSITION;

    return {
      homePage: presentation.homePage,
      sidebarOrder: presentation.sidebarOrder,
      primaryAction: presentation.primaryAction,
    };
  }, [presentation]);
}
