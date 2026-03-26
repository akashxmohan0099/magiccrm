// ── Module Assembly Pipeline ─────────────────────────────────
//
// Runs during the 2-3 minute "building your workspace" phase
// after onboarding. Assembles feature primitives into persona-
// specific modules.
//
// 5 stages:
//   1. Schema Selection (deterministic, <1s)
//   2. AI Fine-Tuning (Kimi, ~30-60s)
//   3. Validation (deterministic, <5s)
//   4. Persist (Supabase, <5s)
//   5. Deliver (return assembled schemas)

import type { ModuleSchema, SchemaTuningResult } from "@/types/module-schema";
import {
  getBaseSchema,
  findVariant,
  applyVariant,
  applyTuningResult,
  getAllSchemaIds,
} from "@/lib/module-schemas";
import { validateModuleSchema } from "@/lib/schema-validator";
import { getProfileForAIPrompt } from "@/lib/persona-profiles";

// ── Pipeline Result ──────────────────────────────────────────

export interface AssemblyResult {
  /** Successfully assembled schemas */
  schemas: ModuleSchema[];
  /** Modules that failed assembly (fell back to base) */
  fallbacks: { moduleId: string; reason: string }[];
  /** Total time in ms */
  durationMs: number;
  /** Per-stage timing */
  stageTiming: {
    selection: number;
    tuning: number;
    validation: number;
    total: number;
  };
}

export interface AssemblyInput {
  /** Which module IDs to assemble (from onboarding enabled modules) */
  enabledModuleIds: string[];
  /** Industry ID from onboarding */
  industryId: string;
  /** Persona ID from onboarding */
  personaId: string;
  /** Business context for AI tuning */
  businessContext: {
    businessName: string;
    businessDescription: string;
    location: string;
  };
  /** Skip AI tuning (for testing or when Kimi is down) */
  skipAiTuning?: boolean;
}

// ── Stage 1: Schema Selection ────────────────────────────────

function selectSchemas(
  input: AssemblyInput,
): { selected: ModuleSchema[]; missing: string[] } {
  const selected: ModuleSchema[] = [];
  const missing: string[] = [];

  for (const moduleId of input.enabledModuleIds) {
    const base = getBaseSchema(moduleId);
    if (!base) {
      missing.push(moduleId);
      continue;
    }

    // Apply persona variant if one exists
    const variant = findVariant(moduleId, input.industryId, input.personaId);
    const schema = variant ? applyVariant(base, variant) : structuredClone(base);
    selected.push(schema);
  }

  return { selected, missing };
}

// ── Stage 2: AI Fine-Tuning ──────────────────────────────────

async function tuneSchemas(
  schemas: ModuleSchema[],
  input: AssemblyInput,
): Promise<{ tuned: ModuleSchema[]; aiUsed: boolean }> {
  if (input.skipAiTuning) {
    return { tuned: schemas, aiUsed: false };
  }

  try {
    const personaProfile = getProfileForAIPrompt(input.personaId);

    // Build the tuning request
    const moduleList = schemas.map((s) => ({
      id: s.id,
      label: s.label,
      description: s.description,
      fieldLabels: s.fields.map((f) => ({ id: f.id, label: f.label })),
      viewLabels: s.views.map((v) => ({ id: v.id, label: v.label })),
      statusLabels: s.statusFlow?.states.map((st) => ({ value: st.value, label: st.label })),
      primaryActionLabel: s.primaryAction?.label,
      emptyStateTitle: s.emptyState?.title,
    }));

    const res = await fetch("/api/onboarding/assemble-tune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industry: input.industryId,
        persona: input.personaId,
        businessName: input.businessContext.businessName,
        businessDescription: input.businessContext.businessDescription,
        location: input.businessContext.location,
        personaProfile,
        modules: moduleList,
      }),
    });

    if (!res.ok) {
      // AI failed — return un-tuned schemas
      return { tuned: schemas, aiUsed: false };
    }

    const data = await res.json();
    const tuningResults: SchemaTuningResult[] = data.tuningResults || [];

    // Apply tuning results to schemas
    const tuned = schemas.map((schema) => {
      const tuning = tuningResults.find((t) => t.moduleId === schema.id);
      return tuning ? applyTuningResult(schema, tuning) : schema;
    });

    return { tuned, aiUsed: true };
  } catch {
    // AI failed — return un-tuned schemas (graceful degradation)
    return { tuned: schemas, aiUsed: false };
  }
}

// ── Stage 3: Validation ──────────────────────────────────────

function validateSchemas(
  schemas: ModuleSchema[],
): { valid: ModuleSchema[]; invalid: { moduleId: string; errors: string[]; fallback: ModuleSchema | null }[] } {
  const allIds = getAllSchemaIds();
  const valid: ModuleSchema[] = [];
  const invalid: { moduleId: string; errors: string[]; fallback: ModuleSchema | null }[] = [];

  for (const schema of schemas) {
    const result = validateModuleSchema(schema, allIds);
    if (result.valid) {
      valid.push(schema);
    } else {
      // Try falling back to base schema without variants/tuning
      const base = getBaseSchema(schema.id);
      if (base) {
        const baseResult = validateModuleSchema(base, allIds);
        if (baseResult.valid) {
          valid.push(base);
          invalid.push({ moduleId: schema.id, errors: result.errors, fallback: base });
          continue;
        }
      }
      invalid.push({ moduleId: schema.id, errors: result.errors, fallback: null });
    }
  }

  return { valid, invalid };
}

// ── Public API: Run the Full Pipeline ────────────────────────

/**
 * Assemble all modules for a workspace.
 *
 * Called during the "building your workspace" loading screen.
 * Takes 2-3 minutes total (mostly waiting for AI tuning).
 */
export async function assembleWorkspace(input: AssemblyInput): Promise<AssemblyResult> {
  const start = Date.now();
  const fallbacks: AssemblyResult["fallbacks"] = [];

  // ── Stage 1: Selection ──
  const selectionStart = Date.now();
  const { selected, missing } = selectSchemas(input);
  const selectionTime = Date.now() - selectionStart;

  for (const moduleId of missing) {
    fallbacks.push({ moduleId, reason: "No base schema available" });
  }

  // ── Stage 2: AI Tuning ──
  const tuningStart = Date.now();
  const { tuned, aiUsed } = await tuneSchemas(selected, input);
  const tuningTime = Date.now() - tuningStart;

  if (!aiUsed && !input.skipAiTuning) {
    // AI was supposed to run but failed — not a hard error, just a note
    fallbacks.push({ moduleId: "__ai__", reason: "AI tuning unavailable, using default labels" });
  }

  // ── Stage 3: Validation ──
  const validationStart = Date.now();
  const { valid, invalid } = validateSchemas(tuned);
  const validationTime = Date.now() - validationStart;

  for (const inv of invalid) {
    fallbacks.push({
      moduleId: inv.moduleId,
      reason: inv.fallback
        ? `Variant failed validation, using base schema: ${inv.errors[0]}`
        : `Schema failed validation: ${inv.errors[0]}`,
    });
  }

  const totalTime = Date.now() - start;

  return {
    schemas: valid,
    fallbacks,
    durationMs: totalTime,
    stageTiming: {
      selection: selectionTime,
      tuning: tuningTime,
      validation: validationTime,
      total: totalTime,
    },
  };
}

/**
 * Quick assembly without AI tuning — for testing and fallback.
 */
export function assembleWorkspaceSync(input: Omit<AssemblyInput, "businessContext">): {
  schemas: ModuleSchema[];
  fallbacks: { moduleId: string; reason: string }[];
} {
  const fallbacks: { moduleId: string; reason: string }[] = [];
  const schemas: ModuleSchema[] = [];

  for (const moduleId of input.enabledModuleIds) {
    const base = getBaseSchema(moduleId);
    if (!base) {
      fallbacks.push({ moduleId, reason: "No base schema" });
      continue;
    }

    const variant = findVariant(moduleId, input.industryId, input.personaId);
    const schema = variant ? applyVariant(base, variant) : structuredClone(base);

    const allIds = getAllSchemaIds();
    const validation = validateModuleSchema(schema, allIds);
    if (validation.valid) {
      schemas.push(schema);
    } else {
      // Fall back to base
      schemas.push(structuredClone(base));
      fallbacks.push({ moduleId, reason: `Variant invalid: ${validation.errors[0]}` });
    }
  }

  return { schemas, fallbacks };
}
