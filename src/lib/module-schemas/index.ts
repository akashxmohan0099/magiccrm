// ── Module Schema Registry ───────────────────────────────────
//
// Central registry for all base schemas and persona variants.
// Schemas are looked up by module ID or slug.

import type { ModuleSchema, SchemaVariant, SchemaTuningResult, FieldDefinition } from "@/types/module-schema";
import { validateModuleSchema } from "@/lib/schema-validator";

// ── Base Schemas ─────────────────────────────────────────────

import { clientsSchema } from "./base/clients";
import { leadsSchema } from "./base/leads";
import { jobsSchema } from "./base/jobs";
import { bookingsSchema } from "./base/bookings";
import { invoicingSchema } from "./base/invoicing";
import { productsSchema } from "./base/products";
import { communicationSchema } from "./base/communication";

/** All registered base schemas, keyed by module ID */
const BASE_SCHEMAS: Record<string, ModuleSchema> = {
  "client-database": clientsSchema,
  "leads-pipeline": leadsSchema,
  "jobs-projects": jobsSchema,
  "bookings-calendar": bookingsSchema,
  "quotes-invoicing": invoicingSchema,
  products: productsSchema,
  communication: communicationSchema,
};

import { hairSalonVariants } from "./variants/hair-salon";
import { plumberVariants } from "./variants/plumber";
import { photographerVariants } from "./variants/photographer";
import { personalTrainerVariants } from "./variants/personal-trainer";
import { tutorVariants } from "./variants/tutor";
import { makeupArtistVariants } from "./variants/makeup-artist";

/** All registered persona variants */
const SCHEMA_VARIANTS: SchemaVariant[] = [
  ...hairSalonVariants,
  ...plumberVariants,
  ...photographerVariants,
  ...personalTrainerVariants,
  ...tutorVariants,
  ...makeupArtistVariants,
];

// ── Lookup Functions ─────────────────────────────────────────

/** Get a base schema by module ID */
export function getBaseSchema(moduleId: string): ModuleSchema | undefined {
  return BASE_SCHEMAS[moduleId];
}

/** Get a schema by slug */
export function getSchemaBySlug(slug: string): ModuleSchema | undefined {
  return Object.values(BASE_SCHEMAS).find((s) => s.slug === slug);
}

/** Get all registered base schema IDs */
export function getAllSchemaIds(): Set<string> {
  return new Set(Object.keys(BASE_SCHEMAS));
}

/** Get all registered base schemas */
export function getAllSchemas(): ModuleSchema[] {
  return Object.values(BASE_SCHEMAS);
}

/** Get all registered persona variants */
export function getAllVariants(): SchemaVariant[] {
  return [...SCHEMA_VARIANTS];
}

/** Check if a module has a schema-driven renderer available */
export function hasSchemaRenderer(moduleId: string): boolean {
  return moduleId in BASE_SCHEMAS;
}

// ── Variant Resolution ───────────────────────────────────────

/** Find a persona variant for a given base schema + persona */
export function findVariant(
  baseSchemaId: string,
  industryId: string,
  personaId: string,
): SchemaVariant | undefined {
  return SCHEMA_VARIANTS.find(
    (v) =>
      v.baseSchemaId === baseSchemaId &&
      v.industryId === industryId &&
      v.personaId === personaId,
  );
}

/** Apply a variant's overrides to a base schema, returning a new schema */
export function applyVariant(
  base: ModuleSchema,
  variant: SchemaVariant,
): ModuleSchema {
  const result = structuredClone(base);
  const o = variant.overrides;

  // Top-level overrides
  if (o.label) result.label = o.label;
  if (o.description) result.description = o.description;
  if (o.icon) result.icon = o.icon;
  if (o.slug) result.slug = o.slug;

  // Field overrides
  if (o.fieldOverrides) {
    // Remove fields
    if (o.fieldOverrides.remove) {
      const removeSet = new Set(o.fieldOverrides.remove);
      result.fields = result.fields.filter((f) => !removeSet.has(f.id));
    }

    // Modify fields
    if (o.fieldOverrides.modify) {
      for (const mod of o.fieldOverrides.modify) {
        const idx = result.fields.findIndex((f) => f.id === mod.id);
        if (idx >= 0) {
          result.fields[idx] = { ...result.fields[idx], ...mod } as FieldDefinition;
        }
      }
    }

    // Add fields
    if (o.fieldOverrides.add) {
      result.fields.push(...o.fieldOverrides.add);
    }
  }

  // Status flow override
  if (o.statusFlow) result.statusFlow = o.statusFlow;

  // View overrides
  if (o.viewOverrides) {
    if (o.viewOverrides.remove) {
      const removeSet = new Set(o.viewOverrides.remove);
      result.views = result.views.filter((v) => !removeSet.has(v.id));
    }
    if (o.viewOverrides.modify) {
      for (const mod of o.viewOverrides.modify) {
        const idx = result.views.findIndex((v) => v.id === mod.id);
        if (idx >= 0) {
          result.views[idx] = { ...result.views[idx], ...mod } as typeof result.views[0];
        }
      }
    }
    if (o.viewOverrides.add) {
      result.views.push(...o.viewOverrides.add);
    }
  }

  if (o.primaryView) result.primaryView = o.primaryView;

  // Action overrides
  if (o.actionOverrides) {
    if (!result.actions) result.actions = [];
    if (o.actionOverrides.remove) {
      const removeSet = new Set(o.actionOverrides.remove);
      result.actions = result.actions.filter((a) => !removeSet.has(a.id));
    }
    if (o.actionOverrides.add) {
      result.actions.push(...o.actionOverrides.add);
    }
  }

  if (o.primaryAction) result.primaryAction = o.primaryAction;
  if (o.emptyState) result.emptyState = o.emptyState;

  return result;
}

// ── AI Tuning Application ────────────────────────────────────

/** Apply AI-generated label overrides to a schema. Only changes presentation text. */
export function applyTuningResult(
  schema: ModuleSchema,
  tuning: SchemaTuningResult,
): ModuleSchema {
  const result = structuredClone(schema);
  const o = tuning.labelOverrides;

  if (o.moduleLabel) result.label = o.moduleLabel;
  if (o.moduleDescription) result.description = o.moduleDescription;

  // Field labels
  if (o.fieldLabels) {
    for (const [fieldId, label] of Object.entries(o.fieldLabels)) {
      const field = result.fields.find((f) => f.id === fieldId);
      if (field) field.label = label;
    }
  }

  // Field placeholders
  if (o.fieldPlaceholders) {
    for (const [fieldId, placeholder] of Object.entries(o.fieldPlaceholders)) {
      const field = result.fields.find((f) => f.id === fieldId);
      if (field) field.placeholder = placeholder;
    }
  }

  // View labels
  if (o.viewLabels) {
    for (const [viewId, label] of Object.entries(o.viewLabels)) {
      const view = result.views.find((v) => v.id === viewId);
      if (view) view.label = label;
    }
  }

  // Action labels
  if (o.actionLabels && result.actions) {
    for (const [actionId, label] of Object.entries(o.actionLabels)) {
      const action = result.actions.find((a) => a.id === actionId);
      if (action && "label" in action) {
        (action as { label: string }).label = label;
      }
    }
  }

  // Status labels
  if (o.statusLabels && result.statusFlow) {
    for (const [value, label] of Object.entries(o.statusLabels)) {
      const state = result.statusFlow.states.find((s) => s.value === value);
      if (state) state.label = label;
    }
  }

  // Empty state
  if (o.emptyStateTitle && result.emptyState) result.emptyState.title = o.emptyStateTitle;
  if (o.emptyStateDescription && result.emptyState) result.emptyState.description = o.emptyStateDescription;

  // Primary action label
  if (o.primaryActionLabel && result.primaryAction) result.primaryAction.label = o.primaryActionLabel;

  return result;
}

// ── Assembly Helper ──────────────────────────────────────────

/**
 * Assemble a module schema for a specific persona.
 * 1. Start with base schema
 * 2. Apply persona variant if one exists
 * 3. Optionally apply AI tuning
 * 4. Validate
 */
export function assembleSchema(
  moduleId: string,
  industryId: string,
  personaId: string,
  tuning?: SchemaTuningResult,
): { schema: ModuleSchema; valid: boolean; errors: string[] } {
  const base = getBaseSchema(moduleId);
  if (!base) {
    return { schema: null as never, valid: false, errors: [`No base schema for module "${moduleId}"`] };
  }

  // Apply variant
  const variant = findVariant(moduleId, industryId, personaId);
  let schema = variant ? applyVariant(base, variant) : structuredClone(base);

  // Apply AI tuning
  if (tuning) {
    schema = applyTuningResult(schema, tuning);
  }

  // Validate
  const allIds = getAllSchemaIds();
  const result = validateModuleSchema(schema, allIds);

  return { schema, valid: result.valid, errors: result.errors };
}
