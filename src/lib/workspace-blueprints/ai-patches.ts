import type { PresentationPatch, WorkspaceFunctionalConfig, WorkspacePresentationConfig } from "@/types/workspace-blueprint";
import { kimiChat } from "@/lib/integrations/kimi";
import { validatePatch } from "./validator";

// ── AI Presentation Patch Generation (via Kimi) ─────────────
//
// Invariant: AI can ONLY generate presentation patches.
// No patch is always safer than a speculative patch.
//
// Failure policy:
// 1. API call fails → return []
// 2. JSON parse fails → return []
// 3. Individual patch invalid → drop only that patch
// 4. All patches invalid → return []
// 5. Max 1 retry, then fallback to no-patches

const SYSTEM_PROMPT = `You are a workspace configuration assistant. Return ONLY valid JSON.
You can ONLY propose presentation patches — visual layout changes.
You must NEVER modify functional behavior, enabled modules, or workflow logic.
If no safe improvement exists, return {"patches":[]}.

Available patch operations:
1. set-homepage: Change which page is the home/landing page
2. reorder-sidebar: Change the order of sidebar navigation items
3. rename-module-section: Rename a module's display label
4. set-module-default-columns: Set which columns are visible by default in a module's table
5. set-column-label: Rename a column header
6. replace-dashboard-widgets: Replace dashboard widget layout

Maximum 6 patches per response.`;

/**
 * Request AI-generated presentation patches for a workspace.
 * Returns validated patches only — invalid patches are silently dropped.
 * Returns [] on any failure.
 */
export async function requestAiPresentationPatches(
  draft: { functional: WorkspaceFunctionalConfig; presentation: WorkspacePresentationConfig },
  prompt?: string,
): Promise<PresentationPatch[]> {
  const userPrompt = JSON.stringify({
    prompt: prompt ?? "Suggest presentation improvements for this workspace configuration.",
    functional: draft.functional,
    presentation: draft.presentation,
  });

  // Attempt 1
  let result = await kimiChat(SYSTEM_PROMPT, userPrompt, { model: "moonshot-v1-8k", maxTokens: 1024 });

  if (!result) {
    // Retry once with tightened prompt
    result = await kimiChat(
      SYSTEM_PROMPT + "\nIMPORTANT: You MUST return valid JSON with a 'patches' array. If unsure, return {\"patches\":[]}.",
      userPrompt,
      { model: "moonshot-v1-8k", maxTokens: 1024 },
    );
  }

  if (!result) return [];

  // Parse response
  let parsed: { patches?: unknown[] };
  try {
    parsed = JSON.parse(result);
  } catch {
    return [];
  }

  if (!parsed.patches || !Array.isArray(parsed.patches)) return [];

  // Validate each patch — drop invalid ones
  const validPatches: PresentationPatch[] = [];
  for (const rawPatch of parsed.patches) {
    const patch = rawPatch as PresentationPatch;
    if (!patch || typeof patch !== "object" || !("op" in patch)) continue;

    const error = validatePatch(patch, draft.functional);
    if (error === null) {
      validPatches.push(patch);
    }
    // Invalid patches are silently dropped — no patch is safer than a bad patch
  }

  return validPatches;
}
