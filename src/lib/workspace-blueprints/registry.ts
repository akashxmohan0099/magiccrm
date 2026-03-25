import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";
import { nailTechBlueprint } from "./blueprints/nail-tech";
import { photographerBlueprint } from "./blueprints/photographer";
import { tutorBlueprint } from "./blueprints/tutor";

// ── Blueprint Registry ──────────────────────────────────────

const BLUEPRINT_MAP: Record<string, WorkspaceBlueprint> = {
  [nailTechBlueprint.id]: nailTechBlueprint,
  [photographerBlueprint.id]: photographerBlueprint,
  [tutorBlueprint.id]: tutorBlueprint,
};

/** All registered blueprints */
export const ALL_BLUEPRINTS: WorkspaceBlueprint[] = Object.values(BLUEPRINT_MAP);

/** Look up a blueprint by exact ID */
export function getBlueprintById(id: string): WorkspaceBlueprint | undefined {
  return BLUEPRINT_MAP[id];
}

/** Resolve the best blueprint for an industry + persona combination */
export function resolveBlueprint(
  industryId: string,
  personaId?: string,
): WorkspaceBlueprint | undefined {
  // 1. Try exact match: "industry:persona"
  if (personaId) {
    const exact = BLUEPRINT_MAP[`${industryId}:${personaId}`];
    if (exact) return exact;
  }

  // 2. Try industry default: "industry:default"
  const industryDefault = BLUEPRINT_MAP[`${industryId}:default`];
  if (industryDefault) return industryDefault;

  // 3. No blueprint available — caller should fall back to existing config
  return undefined;
}

/** Get all blueprint IDs */
export function getAllBlueprintIds(): string[] {
  return Object.keys(BLUEPRINT_MAP);
}
