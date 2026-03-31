import { describe, it, expect, beforeAll } from "vitest";
import { validateModuleSchema } from "@/lib/schema-validator";
import {
  getBaseSchema,
  getAllSchemaIds,
  getAllVariants,
  findVariant,
  applyVariant,
  assembleSchema,
} from "@/lib/module-schemas";
import { assembleWorkspaceSync } from "@/lib/assembly-pipeline";
import type { ModuleSchema } from "@/types/module-schema";

const ALL_IDS = getAllSchemaIds();

// ══════════════════════════════════════════════════════
// 1. EVERY VARIANT PASSES VALIDATION
// ══════════════════════════════════════════════════════

describe("all variants pass schema validation", () => {
  const variants = getAllVariants();

  for (const variant of variants) {
    it(`${variant.variantId}`, () => {
      const base = getBaseSchema(variant.baseSchemaId);
      expect(base).toBeDefined();
      const assembled = applyVariant(base!, variant);
      const result = validateModuleSchema(assembled, ALL_IDS);
      if (!result.valid) {
        console.error(`Variant ${variant.variantId} failed:`, result.errors);
      }
      expect(result.valid).toBe(true);
    });
  }
});

// ══════════════════════════════════════════════════════
// 2. FULL PERSONA FLOW TESTS
//    Simulate the full onboarding → assembly for each persona
// ══════════════════════════════════════════════════════

interface PersonaTestCase {
  name: string;
  industryId: string;
  personaId: string;
  enabledModules: string[];
  expectedLabels: Record<string, string>; // moduleId → expected label
  expectedFieldExists?: Record<string, string[]>; // moduleId → field IDs that must exist
  expectedFieldMissing?: Record<string, string[]>; // moduleId → field IDs that must NOT exist
}

const PERSONA_TEST_CASES: PersonaTestCase[] = [
  {
    name: "Hair Salon",
    industryId: "beauty-wellness",
    personaId: "hair-salon",
    enabledModules: ["client-database", "leads-pipeline", "bookings-calendar", "quotes-invoicing", "products", "communication"],
    expectedLabels: {
      "bookings-calendar": "Appointments",
      "quotes-invoicing": "Receipts",
      "products": "Services",
      "leads-pipeline": "Inquiries",
    },
    expectedFieldExists: {
      "client-database": ["hairType", "colourFormula", "allergies"],
    },
    expectedFieldMissing: {
      "quotes-invoicing": ["recurringSchedule"],
    },
  },
  {
    name: "Barber",
    industryId: "beauty-wellness",
    personaId: "barber",
    enabledModules: ["client-database", "bookings-calendar", "quotes-invoicing", "products", "communication"],
    expectedLabels: {
      "bookings-calendar": "Appointments",
      "quotes-invoicing": "Receipts",
      "products": "Services",
    },
    expectedFieldExists: {
      "client-database": ["preferredStyle"],
    },
  },
  {
    name: "Nail Tech",
    industryId: "beauty-wellness",
    personaId: "nail-tech",
    enabledModules: ["client-database", "bookings-calendar", "quotes-invoicing", "products", "communication"],
    expectedLabels: {
      "bookings-calendar": "Appointments",
      "quotes-invoicing": "Receipts",
      "products": "Services",
    },
    expectedFieldExists: {
      "client-database": ["nailType", "preferredShape", "allergies"],
    },
  },
  {
    name: "Makeup Artist",
    industryId: "beauty-wellness",
    personaId: "makeup-artist",
    enabledModules: ["client-database", "leads-pipeline", "bookings-calendar", "quotes-invoicing", "products", "communication"],
    expectedLabels: {
      "leads-pipeline": "Wedding Inquiries",
      "bookings-calendar": "Appointments",
    },
    expectedFieldExists: {
      "client-database": ["skinType", "clientType", "allergies"],
      "leads-pipeline": ["weddingDate", "venue", "partySize", "eventType"],
    },
  },
];

describe("full persona assembly flows", () => {
  for (const tc of PERSONA_TEST_CASES) {
    describe(tc.name, () => {
      let result: ReturnType<typeof assembleWorkspaceSync>;

      // Run assembly once for this persona
      beforeAll(() => {
        result = assembleWorkspaceSync({
          enabledModuleIds: tc.enabledModules,
          industryId: tc.industryId,
          personaId: tc.personaId,
        });
      });

      it("assembles without fatal errors", () => {
        expect(result.schemas.length).toBeGreaterThan(0);
        // Some modules may not have schemas yet (e.g., addons) — that's OK
        // But the core modules should all assemble
        const assembledIds = new Set(result.schemas.map((s) => s.id));
        for (const moduleId of tc.enabledModules) {
          if (ALL_IDS.has(moduleId)) {
            expect(assembledIds.has(moduleId)).toBe(true);
          }
        }
      });

      it("all assembled schemas pass validation", () => {
        for (const schema of result.schemas) {
          const validation = validateModuleSchema(schema, ALL_IDS);
          if (!validation.valid) {
            console.error(`${tc.name} / ${schema.id} failed:`, validation.errors);
          }
          expect(validation.valid).toBe(true);
        }
      });

      it("has correct module labels", () => {
        const schemaMap = new Map(result.schemas.map((s) => [s.id, s]));
        for (const [moduleId, expectedLabel] of Object.entries(tc.expectedLabels)) {
          const schema = schemaMap.get(moduleId);
          if (schema) {
            expect(schema.label).toBe(expectedLabel);
          }
        }
      });

      if (tc.expectedFieldExists) {
        it("has expected persona-specific fields", () => {
          const schemaMap = new Map(result.schemas.map((s) => [s.id, s]));
          for (const [moduleId, fieldIds] of Object.entries(tc.expectedFieldExists!)) {
            const schema = schemaMap.get(moduleId);
            if (!schema) continue;
            const existingFieldIds = new Set(schema.fields.map((f) => f.id));
            for (const fieldId of fieldIds) {
              expect(existingFieldIds.has(fieldId)).toBe(true);
            }
          }
        });
      }

      if (tc.expectedFieldMissing) {
        it("removed persona-irrelevant fields", () => {
          const schemaMap = new Map(result.schemas.map((s) => [s.id, s]));
          for (const [moduleId, fieldIds] of Object.entries(tc.expectedFieldMissing!)) {
            const schema = schemaMap.get(moduleId);
            if (!schema) continue;
            const existingFieldIds = new Set(schema.fields.map((f) => f.id));
            for (const fieldId of fieldIds) {
              expect(existingFieldIds.has(fieldId)).toBe(false);
            }
          }
        });
      }

      it("every schema has at least one view", () => {
        for (const schema of result.schemas) {
          expect(schema.views.length).toBeGreaterThan(0);
        }
      });

      it("every schema has a valid primaryView", () => {
        for (const schema of result.schemas) {
          const viewIds = schema.views.map((v) => v.id);
          expect(viewIds).toContain(schema.primaryView);
        }
      });

      it("every schema has a primaryAction", () => {
        for (const schema of result.schemas) {
          expect(schema.primaryAction).toBeDefined();
          expect(schema.primaryAction!.label.length).toBeGreaterThan(0);
        }
      });
    });
  }
});

// ══════════════════════════════════════════════════════
// 3. CROSS-MODULE REFERENCE INTEGRITY
// ══════════════════════════════════════════════════════

describe("cross-module reference integrity", () => {
  it("all relation fields point to existing schema IDs", () => {
    for (const schemaId of getAllSchemaIds()) {
      const base = getBaseSchema(schemaId);
      if (!base) continue;
      for (const field of base.fields) {
        if (field.type === "relation" && field.relationTo) {
          // "team" module doesn't have a schema yet — skip for now
          if (field.relationTo === "team") continue;
          expect(
            ALL_IDS.has(field.relationTo),
            `${schemaId}.${field.id} → relationTo "${field.relationTo}" not found in schemas`,
          ).toBe(true);
        }
      }
    }
  });

  it("all convert actions target existing schema IDs", () => {
    for (const schemaId of getAllSchemaIds()) {
      const base = getBaseSchema(schemaId);
      if (!base?.actions) continue;
      for (const action of base.actions) {
        if (action.type === "convert") {
          expect(ALL_IDS.has(action.targetModule)).toBe(true);
        }
        if (action.type === "cascade-delete") {
          for (const target of action.targetModules) {
            expect(ALL_IDS.has(target.moduleId)).toBe(true);
          }
        }
        if (action.type === "notify") {
          expect(ALL_IDS.has(action.targetModule)).toBe(true);
        }
      }
    }
  });

  it("all variant baseSchemaIds match existing schemas", () => {
    for (const variant of getAllVariants()) {
      expect(ALL_IDS.has(variant.baseSchemaId)).toBe(true);
    }
  });

  it("no duplicate slugs across base schemas", () => {
    const slugs = new Set<string>();
    for (const schemaId of ALL_IDS) {
      const schema = getBaseSchema(schemaId);
      if (!schema) continue;
      expect(slugs.has(schema.slug)).toBe(false);
      slugs.add(schema.slug);
    }
  });

  it("no duplicate variant IDs", () => {
    const ids = new Set<string>();
    for (const variant of getAllVariants()) {
      expect(ids.has(variant.variantId)).toBe(false);
      ids.add(variant.variantId);
    }
  });
});

// ══════════════════════════════════════════════════════
// 4. SCHEMA STRUCTURE CONSISTENCY
// ══════════════════════════════════════════════════════

describe("schema structure consistency", () => {
  it("all base schemas have createdAt and updatedAt fields", () => {
    for (const schemaId of ALL_IDS) {
      const schema = getBaseSchema(schemaId)!;
      const fieldIds = schema.fields.map((f) => f.id);
      expect(fieldIds).toContain("createdAt");
      expect(fieldIds).toContain("updatedAt");
    }
  });

  it("all base schemas have capabilities defined", () => {
    for (const schemaId of ALL_IDS) {
      const schema = getBaseSchema(schemaId)!;
      expect(schema.capabilities).toBeDefined();
      expect(typeof schema.capabilities.canCreate).toBe("boolean");
      expect(typeof schema.capabilities.canEdit).toBe("boolean");
      expect(typeof schema.capabilities.canDelete).toBe("boolean");
    }
  });

  it("all base schemas have an icon", () => {
    for (const schemaId of ALL_IDS) {
      const schema = getBaseSchema(schemaId)!;
      expect(schema.icon.length).toBeGreaterThan(0);
    }
  });

  it("all base schemas with statusFlow have the status field in their fields", () => {
    for (const schemaId of ALL_IDS) {
      const schema = getBaseSchema(schemaId)!;
      if (!schema.statusFlow) continue;
      const fieldIds = schema.fields.map((f) => f.id);
      expect(fieldIds).toContain(schema.statusFlow.field);
    }
  });
});
