import { describe, expect, it } from "vitest";
import { MODULE_REGISTRY } from "@/lib/module-registry";
import { assembleWorkspaceSync } from "@/lib/assembly-pipeline";
import { getAllSchemas, getAllSchemaIds, getAllVariants } from "@/lib/module-schemas";
import { validateModuleSchema } from "@/lib/schema-validator";
import type { ActionDefinition, FieldDefinition } from "@/types/module-schema";

const knownModuleIds = new Set(MODULE_REGISTRY.map((module) => module.id));

function collectRelationTargets(fields: FieldDefinition[]): string[] {
  const targets: string[] = [];

  for (const field of fields) {
    if (field.relationTo) targets.push(field.relationTo);
    if (field.subFields) {
      targets.push(...collectRelationTargets(field.subFields));
    }
  }

  return targets;
}

function collectActionTargets(actions: ActionDefinition[] | undefined): string[] {
  if (!actions) return [];

  const targets: string[] = [];
  for (const action of actions) {
    switch (action.type) {
      case "convert":
      case "notify":
        targets.push(action.targetModule);
        break;
      case "cascade-delete":
        targets.push(...action.targetModules.map((target) => target.moduleId));
        break;
      case "navigate":
        break;
    }
  }

  return targets;
}

describe("module schema wiring", () => {
  it("every base schema ID matches a registered module ID", () => {
    for (const schema of getAllSchemas()) {
      expect(knownModuleIds.has(schema.id)).toBe(true);
    }
  });

  it("every persona variant references a registered base schema", () => {
    const schemaIds = new Set(getAllSchemas().map((schema) => schema.id));

    for (const variant of getAllVariants()) {
      expect(schemaIds.has(variant.baseSchemaId)).toBe(true);
    }
  });

  it("all schema cross-module references use known module IDs", () => {
    for (const schema of getAllSchemas()) {
      const fieldTargets = collectRelationTargets(schema.fields);
      const relationTargets = schema.relations?.map((relation) => relation.targetModule) ?? [];
      const actionTargets = collectActionTargets(schema.actions);

      for (const targetModuleId of [...fieldTargets, ...relationTargets, ...actionTargets]) {
        expect(knownModuleIds.has(targetModuleId)).toBe(true);
      }
    }
  });

  it("assembles the canonical core module set without fallbacks", () => {
    const result = assembleWorkspaceSync({
      enabledModuleIds: [
        "client-database",
        "leads-pipeline",
        "communication",
        "quotes-invoicing",
        "bookings-calendar",
        "jobs-projects",
        "products",
      ],
      industryId: "beauty-wellness",
      personaId: "hair-salon",
    });

    expect(result.fallbacks).toEqual([]);
    expect(result.schemas.map((schema) => schema.id)).toEqual([
      "client-database",
      "leads-pipeline",
      "communication",
      "quotes-invoicing",
      "bookings-calendar",
      "jobs-projects",
      "products",
    ]);
  });
});

describe("schema validator integration", () => {
  it("accepts the base clients schema with dynamic multiselect options", () => {
    const clientsSchema = getAllSchemas().find((schema) => schema.id === "client-database");
    expect(clientsSchema).toBeDefined();

    const result = validateModuleSchema(clientsSchema!, getAllSchemaIds());
    expect(result.valid).toBe(true);
  });

  it("still requires options for status fields", () => {
    const clientsSchema = structuredClone(
      getAllSchemas().find((schema) => schema.id === "client-database")!,
    );

    const statusField = clientsSchema.fields.find((field) => field.id === "status");
    expect(statusField).toBeDefined();
    if (statusField) statusField.options = [];

    const result = validateModuleSchema(clientsSchema, getAllSchemaIds());
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('Field "status"'))).toBe(true);
  });
});
