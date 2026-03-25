import type { PresentationPatch } from "@/types/workspace-blueprint";

// ── AI Patch Generation (v2 — stub for now) ─────────────────
//
// v1: All patches are human-authored in blueprint files.
// This file exists so v2 can plug in AI generation without
// architecture changes.
//
// When v2 lands:
// - Use OpenAI Structured Outputs with strict: true
// - Schema: presentationPatchResponseFormat (oneOf discriminated union)
// - System prompt enforces presentation-only constraint
// - Failure policy: parse fail → [], invalid patch → drop, all invalid → []
// - Max 1 retry, then fallback to no-patches
// - No patch is always safer than a speculative patch.

/**
 * Placeholder for AI patch generation.
 * In v1, always returns empty array (no AI patches applied).
 * In v2, will call OpenAI with strict JSON schema to generate
 * bounded presentation patches.
 */
export async function requestAiPresentationPatches(
  _draft: { functional: unknown; presentation: unknown },
  _prompt?: string,
): Promise<PresentationPatch[]> {
  // v1: no AI patches
  return [];
}

// ── Structured Output Schema (for v2 reference) ─────────────
//
// export const presentationPatchResponseFormat = {
//   type: "json_schema",
//   name: "presentation_patch_response",
//   strict: true,
//   schema: {
//     type: "object",
//     additionalProperties: false,
//     required: ["patches"],
//     properties: {
//       patches: {
//         type: "array",
//         maxItems: 6,
//         items: { oneOf: [ ...6 patch op schemas... ] }
//       }
//     }
//   }
// } as const;
