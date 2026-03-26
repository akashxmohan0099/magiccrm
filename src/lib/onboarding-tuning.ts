import type { PresentationPatch } from "@/types/workspace-blueprint";

export interface TuningModuleMeta {
  label: string;
  description: string;
}

export interface ExtractedTuningState {
  patches: PresentationPatch[];
  moduleMeta: Record<string, TuningModuleMeta>;
  combinationIds: string[];
}

function clampText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function extractTuningState(
  payload: { patches?: unknown; moduleMeta?: unknown },
): ExtractedTuningState {
  const patches = Array.isArray(payload.patches)
    ? payload.patches.filter(
        (patch): patch is PresentationPatch =>
          !!patch && typeof patch === "object" && "op" in patch,
      )
    : [];

  const moduleMeta: Record<string, TuningModuleMeta> = {};

  if (payload.moduleMeta && typeof payload.moduleMeta === "object") {
    for (const [moduleId, meta] of Object.entries(payload.moduleMeta)) {
      if (!meta || typeof meta !== "object") continue;
      const label = clampText((meta as { label?: unknown }).label, 40);
      const description = clampText((meta as { description?: unknown }).description, 120);
      if (!label || !description) continue;
      moduleMeta[moduleId] = { label, description };
    }
  }

  const combinationIds = new Set<string>();
  for (const patch of patches) {
    if (patch.op !== "apply-module-combination") continue;
    combinationIds.add(patch.combinationId);

    const label = clampText(patch.label, 40);
    const description = clampText(patch.description, 120);
    if (!label && !description) continue;

    const existing = moduleMeta[patch.combinationId];
    moduleMeta[patch.combinationId] = {
      label: label ?? existing?.label ?? "",
      description: description ?? existing?.description ?? "",
    };
  }

  return {
    patches,
    moduleMeta,
    combinationIds: Array.from(combinationIds),
  };
}
