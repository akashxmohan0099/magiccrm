import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

// Beauty & Wellness blueprints
import { beautyWellnessDefaultBlueprint } from "./blueprints/beauty-wellness-default";
import { nailTechBlueprint } from "./blueprints/nail-tech";
import { lashBrowTechBlueprint } from "./blueprints/lash-brow-tech";
import { hairSalonBlueprint } from "./blueprints/hair-salon";
import { barberBlueprint } from "./blueprints/barber";
import { spaMassageBlueprint } from "./blueprints/spa-massage";
import { makeupArtistBlueprint } from "./blueprints/makeup-artist";

// ── Blueprint Registry ──────────────────────────────────────

const BLUEPRINT_MAP: Record<string, WorkspaceBlueprint> = {
  [beautyWellnessDefaultBlueprint.id]: beautyWellnessDefaultBlueprint,
  [nailTechBlueprint.id]: nailTechBlueprint,
  [lashBrowTechBlueprint.id]: lashBrowTechBlueprint,
  [hairSalonBlueprint.id]: hairSalonBlueprint,
  [barberBlueprint.id]: barberBlueprint,
  [spaMassageBlueprint.id]: spaMassageBlueprint,
  [makeupArtistBlueprint.id]: makeupArtistBlueprint,
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
  if (personaId) {
    const exact = BLUEPRINT_MAP[`${industryId}:${personaId}`];
    if (exact) return exact;
  }
  const industryDefault = BLUEPRINT_MAP[`${industryId}:default`];
  if (industryDefault) return industryDefault;
  return undefined;
}

/** Get all blueprint IDs */
export function getAllBlueprintIds(): string[] {
  return Object.keys(BLUEPRINT_MAP);
}
