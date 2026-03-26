import { describe, it, expect } from "vitest";
import { validateModuleSchema, validateSchemaStructure } from "@/lib/schema-validator";
import {
  getBaseSchema,
  getAllSchemas,
  getAllSchemaIds,
  getSchemaBySlug,
  findVariant,
  applyVariant,
  applyTuningResult,
  assembleSchema,
  getAllVariants,
} from "@/lib/module-schemas";
import type { ModuleSchema, SchemaTuningResult, SchemaVariant } from "@/types/module-schema";

// ══════════════════════════════════════════════════════
// 1. SCHEMA VALIDATOR
// ══════════════════════════════════════════════════════

describe("schema-validator", () => {
  // ── Level 1: Field integrity ──
  it("rejects duplicate field IDs", () => {
    const schema = makeMinimalSchema({
      fields: [
        { id: "name", label: "Name", type: "text", showInTable: true },
        { id: "name", label: "Name 2", type: "text" },
      ],
    });
    const result = validateModuleSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Duplicate field ID");
  });

  it("rejects required fields with visibleWhen", () => {
    const schema = makeMinimalSchema({
      fields: [
        { id: "name", label: "Name", type: "text", required: true, visibleWhen: { field: "other", operator: "truthy" }, showInTable: true },
      ],
    });
    const result = validateModuleSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("required fields cannot have visibleWhen");
  });

  it("rejects status field without options", () => {
    const schema = makeMinimalSchema({
      fields: [
        { id: "status", label: "Status", type: "status", options: [], showInTable: true },
      ],
    });
    const result = validateModuleSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("must have at least 1 option");
  });

  it("allows select field without options (populated dynamically)", () => {
    const schema = makeMinimalSchema({
      fields: [
        { id: "tags", label: "Tags", type: "multiselect", options: [], showInTable: true },
      ],
      views: [{ id: "table", type: "table", label: "Table", visibleFields: ["tags"] }],
    });
    const result = validateSchemaStructure(schema);
    expect(result.valid).toBe(true);
  });

  it("rejects relation field without relationTo", () => {
    const schema = makeMinimalSchema({
      fields: [
        { id: "clientId", label: "Client", type: "relation", showInTable: true },
      ],
    });
    const result = validateModuleSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("relation field must have relationTo");
  });

  it("rejects nested subFields more than 1 level deep", () => {
    const schema = makeMinimalSchema({
      fields: [
        { id: "tasks", label: "Tasks", type: "subRecords", subFields: [
          { id: "nested", label: "Nested", type: "subRecords", subFields: [
            { id: "deep", label: "Deep", type: "text" },
          ]},
        ], showInTable: true },
      ],
    });
    const result = validateModuleSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("cannot nest"))).toBe(true);
  });

  // ── Level 2: View consistency ──
  it("rejects kanban view without groupByField", () => {
    const schema = makeMinimalSchema({
      fields: [{ id: "name", label: "Name", type: "text", showInTable: true }],
      views: [{ id: "board", type: "kanban", label: "Board", visibleFields: ["name"] }],
      primaryView: "board",
    });
    const result = validateModuleSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("must have groupByField");
  });

  it("rejects kanban with non-groupable groupByField", () => {
    const schema = makeMinimalSchema({
      fields: [
        { id: "name", label: "Name", type: "text", showInTable: true },
      ],
      views: [{ id: "board", type: "kanban", label: "Board", visibleFields: ["name"], groupByField: "name" }],
      primaryView: "board",
    });
    const result = validateModuleSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("must be select/status/stage");
  });

  it("rejects calendar view without dateField", () => {
    const schema = makeMinimalSchema({
      fields: [{ id: "name", label: "Name", type: "text", showInTable: true }],
      views: [{ id: "cal", type: "calendar", label: "Calendar", visibleFields: ["name"] }],
      primaryView: "cal",
    });
    const result = validateModuleSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("must have dateField");
  });

  it("rejects view referencing non-existent field", () => {
    const schema = makeMinimalSchema({
      views: [{ id: "table", type: "table", label: "Table", visibleFields: ["ghost_field"] }],
    });
    const result = validateModuleSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("does not exist");
  });

  // ── Level 3: Action safety ──
  it("rejects convert action with unknown target module", () => {
    const schema = makeMinimalSchema({
      actions: [{
        id: "convert",
        type: "convert" as const,
        label: "Convert",
        showOn: "detail" as const,
        targetModule: "nonexistent",
        fieldMapping: [],
        sourceUpdates: [],
        targetDefaults: [],
      }],
    });
    const result = validateModuleSchema(schema, new Set(["test-module"]));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("does not exist");
  });

  // ── Level 4: Condition validation ──
  it("rejects visibleWhen referencing non-existent field", () => {
    const schema = makeMinimalSchema({
      fields: [
        { id: "name", label: "Name", type: "text", showInTable: true },
        { id: "extra", label: "Extra", type: "text", visibleWhen: { field: "ghost", operator: "truthy" } },
      ],
    });
    const result = validateModuleSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("non-existent field");
  });

  it("rejects status flow with fewer than 2 states", () => {
    const schema = makeMinimalSchema({
      statusFlow: {
        field: "name",
        states: [{ value: "only", label: "Only", color: "bg-blue-500" }],
      },
    });
    const result = validateModuleSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("at least 2 states");
  });
});

// ══════════════════════════════════════════════════════
// 2. ALL BASE SCHEMAS PASS VALIDATION
// ══════════════════════════════════════════════════════

describe("base schemas validation", () => {
  const allIds = getAllSchemaIds();

  for (const schema of getAllSchemas()) {
    it(`${schema.id} passes all 4 validation levels`, () => {
      const result = validateModuleSchema(schema, allIds);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  }
});

// ══════════════════════════════════════════════════════
// 3. SCHEMA REGISTRY
// ══════════════════════════════════════════════════════

describe("schema registry", () => {
  it("has all 7 core modules", () => {
    const ids = getAllSchemaIds();
    expect(ids.has("client-database")).toBe(true);
    expect(ids.has("leads-pipeline")).toBe(true);
    expect(ids.has("jobs-projects")).toBe(true);
    expect(ids.has("bookings-calendar")).toBe(true);
    expect(ids.has("quotes-invoicing")).toBe(true);
    expect(ids.has("products")).toBe(true);
    expect(ids.has("communication")).toBe(true);
  });

  it("looks up by slug", () => {
    expect(getSchemaBySlug("clients")?.id).toBe("client-database");
    expect(getSchemaBySlug("leads")?.id).toBe("leads-pipeline");
    expect(getSchemaBySlug("jobs")?.id).toBe("jobs-projects");
    expect(getSchemaBySlug("bookings")?.id).toBe("bookings-calendar");
    expect(getSchemaBySlug("invoicing")?.id).toBe("quotes-invoicing");
  });

  it("returns undefined for unknown slug", () => {
    expect(getSchemaBySlug("nonexistent")).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════
// 4. VARIANT APPLICATION
// ══════════════════════════════════════════════════════

describe("variant application", () => {
  it("finds hair-salon clients variant", () => {
    const variant = findVariant("client-database", "beauty-wellness", "hair-salon");
    expect(variant).toBeDefined();
    expect(variant?.variantId).toContain("hair-salon");
  });

  it("finds plumber leads variant", () => {
    const variant = findVariant("leads-pipeline", "trades-construction", "plumber");
    expect(variant).toBeDefined();
    expect(variant?.overrides.label).toBe("Job Requests");
  });

  it("returns undefined for unknown persona", () => {
    const variant = findVariant("client-database", "beauty-wellness", "unknown-persona");
    expect(variant).toBeUndefined();
  });

  it("applies label override", () => {
    const base = getBaseSchema("leads-pipeline")!;
    const variant = findVariant("leads-pipeline", "trades-construction", "plumber")!;
    const result = applyVariant(base, variant);
    expect(result.label).toBe("Job Requests");
    expect(result.id).toBe("leads-pipeline"); // ID stays the same
  });

  it("applies field additions", () => {
    const base = getBaseSchema("client-database")!;
    const variant = findVariant("client-database", "beauty-wellness", "hair-salon")!;
    const result = applyVariant(base, variant);
    const hairType = result.fields.find((f) => f.id === "hairType");
    expect(hairType).toBeDefined();
    expect(hairType?.type).toBe("select");
  });

  it("assembled variant passes validation", () => {
    const allIds = getAllSchemaIds();
    for (const variant of getAllVariants()) {
      const base = getBaseSchema(variant.baseSchemaId);
      if (!base) continue;
      const assembled = applyVariant(base, variant);
      const result = validateModuleSchema(assembled, allIds);
      expect(result.valid).toBe(true);
    }
  });
});

// ══════════════════════════════════════════════════════
// 5. AI TUNING APPLICATION
// ══════════════════════════════════════════════════════

describe("AI tuning application", () => {
  it("overrides module label", () => {
    const schema = getBaseSchema("client-database")!;
    const tuning: SchemaTuningResult = {
      moduleId: "client-database",
      labelOverrides: { moduleLabel: "My Regulars" },
    };
    const result = applyTuningResult(schema, tuning);
    expect(result.label).toBe("My Regulars");
    expect(result.id).toBe("client-database"); // ID unchanged
  });

  it("overrides field labels without changing structure", () => {
    const schema = getBaseSchema("client-database")!;
    const tuning: SchemaTuningResult = {
      moduleId: "client-database",
      labelOverrides: {
        fieldLabels: { name: "Full Name", email: "Email Address" },
      },
    };
    const result = applyTuningResult(schema, tuning);
    expect(result.fields.find((f) => f.id === "name")?.label).toBe("Full Name");
    expect(result.fields.find((f) => f.id === "email")?.label).toBe("Email Address");
    expect(result.fields.length).toBe(schema.fields.length); // no fields added/removed
  });

  it("tuned schema still passes validation", () => {
    const schema = getBaseSchema("leads-pipeline")!;
    const tuning: SchemaTuningResult = {
      moduleId: "leads-pipeline",
      labelOverrides: {
        moduleLabel: "Opportunities",
        moduleDescription: "Your sales pipeline",
        fieldLabels: { stage: "Deal Stage", value: "Deal Size" },
        viewLabels: { pipeline: "Deal Board" },
        primaryActionLabel: "New Opportunity",
      },
    };
    const result = applyTuningResult(schema, tuning);
    const allIds = getAllSchemaIds();
    const validation = validateModuleSchema(result, allIds);
    expect(validation.valid).toBe(true);
  });
});

// ══════════════════════════════════════════════════════
// 6. ASSEMBLY PIPELINE
// ══════════════════════════════════════════════════════

describe("assembleSchema", () => {
  it("assembles base schema when no variant exists", () => {
    const { schema, valid } = assembleSchema("products", "generic", "generic");
    expect(valid).toBe(true);
    expect(schema.id).toBe("products");
    expect(schema.label).toBe("Products");
  });

  it("assembles with variant for hair-salon", () => {
    const { schema, valid } = assembleSchema("bookings-calendar", "beauty-wellness", "hair-salon");
    expect(valid).toBe(true);
    expect(schema.label).toBe("Appointments");
  });

  it("assembles with AI tuning", () => {
    const tuning: SchemaTuningResult = {
      moduleId: "client-database",
      labelOverrides: { moduleLabel: "Patients" },
    };
    const { schema, valid } = assembleSchema("client-database", "health-fitness", "physio", tuning);
    expect(valid).toBe(true);
    expect(schema.label).toBe("Patients");
  });

  it("returns error for unknown module", () => {
    const { valid, errors } = assembleSchema("nonexistent", "x", "y");
    expect(valid).toBe(false);
    expect(errors[0]).toContain("No base schema");
  });
});

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════

function makeMinimalSchema(overrides: Partial<ModuleSchema> = {}): ModuleSchema {
  return {
    id: "test-module",
    label: "Test",
    description: "Test module",
    icon: "Zap",
    slug: "test",
    fields: [
      { id: "name", label: "Name", type: "text", showInTable: true },
    ],
    views: [
      { id: "table", type: "table", label: "Table", visibleFields: ["name"] },
    ],
    primaryView: "table",
    capabilities: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canBulkEdit: false,
      canImport: false,
      canExport: false,
      hasDetailPanel: false,
    },
    ...overrides,
    // Deep merge fields if both exist
    fields: overrides.fields || [{ id: "name", label: "Name", type: "text", showInTable: true }],
  };
}
