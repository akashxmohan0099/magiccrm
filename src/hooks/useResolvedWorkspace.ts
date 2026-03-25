import { useMemo } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { resolveBlueprint } from "@/lib/workspace-blueprints/registry";
import { buildBaseResolvedWorkspace } from "@/lib/workspace-blueprints/resolver";
import { mergeUserOverride } from "@/lib/workspace-blueprints/user-override";
import type {
  ResolvedWorkspace,
  WorkspacePresentationConfig,
} from "@/types/workspace-blueprint";

/**
 * Returns the resolved workspace for the current session.
 *
 * In v1, the resolved workspace is derived from the blueprint matching
 * the user's selected industry + persona. In v2, it will be loaded
 * from persisted workspace_versions table.
 *
 * Returns null if no blueprint matches (existing workspaces without blueprints).
 */
export function useResolvedWorkspace(): ResolvedWorkspace | null {
  const industryId = useOnboardingStore((s) => s.selectedIndustry);
  const personaId = useOnboardingStore((s) => s.selectedPersona);

  return useMemo(() => {
    if (!industryId) return null;
    const blueprint = resolveBlueprint(industryId, personaId || undefined);
    if (!blueprint) return null;
    return buildBaseResolvedWorkspace(blueprint);
  }, [industryId, personaId]);
}

/**
 * Returns the effective presentation config after merging user overrides.
 * Falls back to null if no blueprint is resolved.
 */
export function useEffectivePresentation(): WorkspacePresentationConfig | null {
  const resolved = useResolvedWorkspace();

  return useMemo(() => {
    if (!resolved) return null;
    // v1: no user override persistence yet — return base presentation
    // v2: load UserPresentationOverride from store/DB and merge
    return mergeUserOverride(resolved.presentation, null);
  }, [resolved]);
}
