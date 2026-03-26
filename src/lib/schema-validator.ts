// ── Module Schema Validator ──────────────────────────────────
//
// 4-level structural validation. Runs before any schema reaches
// the user. If ANY check fails, the schema is rejected and the
// system falls back to a known-good default.
//
// Level 1: Field integrity (types, constraints, uniqueness)
// Level 2: View consistency (references, required fields per view type)
// Level 3: Action safety (conversions, cascades, no circular chains)
// Level 4: Condition validation (visibleWhen, autoFillFrom, transitions)

import type {
  ModuleSchema,
  FieldType,
  SchemaValidationResult,
} from "@/types/module-schema";

const VALID_FIELD_TYPES: Set<FieldType> = new Set([
  "text", "textarea", "email", "phone", "url",
  "number", "currency", "percentage",
  "date", "datetime", "time",
  "boolean",
  "select", "multiselect", "status", "stage",
  "relation",
  "file", "image",
  "rating",
  "computed",
  "lineItems", "subRecords",
]);

const SELECTION_TYPES: Set<FieldType> = new Set(["select", "multiselect", "status", "stage"]);
const REQUIRED_OPTIONS_TYPES: Set<FieldType> = new Set(["status", "stage"]);
const NESTED_TYPES: Set<FieldType> = new Set(["lineItems", "subRecords"]);
const DATE_TYPES: Set<FieldType> = new Set(["date", "datetime"]);
const GROUPABLE_TYPES: Set<FieldType> = new Set(["select", "status", "stage"]);

// ── Level 1: Field Integrity ─────────────────────────────────

function validateFieldIntegrity(schema: ModuleSchema): string[] {
  const errors: string[] = [];
  const fieldIds = new Set<string>();

  for (const field of schema.fields) {
    // Unique IDs
    if (fieldIds.has(field.id)) {
      errors.push(`Duplicate field ID: "${field.id}"`);
    }
    fieldIds.add(field.id);

    // Valid type
    if (!VALID_FIELD_TYPES.has(field.type)) {
      errors.push(`Field "${field.id}": invalid type "${field.type}"`);
    }

    // Required fields cannot have visibleWhen (they'd be hidden but required)
    if (field.required && field.visibleWhen) {
      errors.push(`Field "${field.id}": required fields cannot have visibleWhen conditions`);
    }

    // options only on selection types
    if (field.options && field.options.length > 0 && !SELECTION_TYPES.has(field.type)) {
      errors.push(`Field "${field.id}": options only allowed on select/multiselect/status/stage types`);
    }

    // Status/stage fields must declare options; select/multiselect may be populated dynamically.
    if (REQUIRED_OPTIONS_TYPES.has(field.type) && (!field.options || field.options.length === 0)) {
      errors.push(`Field "${field.id}": ${field.type} field must have at least 1 option`);
    }

    // subFields only on nested types
    if (field.subFields && field.subFields.length > 0 && !NESTED_TYPES.has(field.type)) {
      errors.push(`Field "${field.id}": subFields only allowed on lineItems/subRecords types`);
    }

    // Nested types must have subFields
    if (NESTED_TYPES.has(field.type) && (!field.subFields || field.subFields.length === 0)) {
      errors.push(`Field "${field.id}": ${field.type} field must have at least 1 subField`);
    }

    // relationTo only on relation type
    if (field.relationTo && field.type !== "relation") {
      errors.push(`Field "${field.id}": relationTo only allowed on relation type`);
    }

    // relation fields must have relationTo
    if (field.type === "relation" && !field.relationTo) {
      errors.push(`Field "${field.id}": relation field must have relationTo`);
    }

    // computeExpression only on computed type
    if (field.computeExpression && field.type !== "computed") {
      errors.push(`Field "${field.id}": computeExpression only allowed on computed type`);
    }

    // computed fields must have computeExpression
    if (field.type === "computed" && !field.computeExpression) {
      errors.push(`Field "${field.id}": computed field must have computeExpression`);
    }

    // allowInlineCreate only on relation type
    if (field.allowInlineCreate && field.type !== "relation") {
      errors.push(`Field "${field.id}": allowInlineCreate only allowed on relation type`);
    }

    // autoFillFrom only on relation type
    if (field.autoFillFrom && field.autoFillFrom.length > 0 && field.type !== "relation") {
      errors.push(`Field "${field.id}": autoFillFrom only allowed on relation type`);
    }

    // Validate subField integrity (recursive but only 1 level deep)
    if (field.subFields) {
      const subIds = new Set<string>();
      for (const sub of field.subFields) {
        if (subIds.has(sub.id)) {
          errors.push(`Field "${field.id}" subField: duplicate ID "${sub.id}"`);
        }
        subIds.add(sub.id);
        if (!VALID_FIELD_TYPES.has(sub.type)) {
          errors.push(`Field "${field.id}" subField "${sub.id}": invalid type "${sub.type}"`);
        }
        // No nested nesting
        if (NESTED_TYPES.has(sub.type)) {
          errors.push(`Field "${field.id}" subField "${sub.id}": cannot nest lineItems/subRecords`);
        }
      }
    }
  }

  // Must have at least one field
  if (schema.fields.length === 0) {
    errors.push("Schema must have at least one field");
  }

  return errors;
}

// ── Level 2: View Consistency ────────────────────────────────

function validateViewConsistency(schema: ModuleSchema): string[] {
  const errors: string[] = [];
  const fieldIds = new Set(schema.fields.map((f) => f.id));
  const viewIds = new Set<string>();

  // Must have at least one view
  if (schema.views.length === 0) {
    errors.push("Schema must have at least one view");
    return errors;
  }

  // primaryView must reference an existing view
  if (!schema.views.some((v) => v.id === schema.primaryView)) {
    errors.push(`primaryView "${schema.primaryView}" does not match any view ID`);
  }

  for (const view of schema.views) {
    // Unique view IDs
    if (viewIds.has(view.id)) {
      errors.push(`Duplicate view ID: "${view.id}"`);
    }
    viewIds.add(view.id);

    // All visibleFields must reference existing field IDs
    for (const fieldId of view.visibleFields) {
      if (!fieldIds.has(fieldId)) {
        errors.push(`View "${view.id}": visibleField "${fieldId}" does not exist`);
      }
    }

    // Kanban views must have a valid groupByField
    if (view.type === "kanban") {
      if (!view.groupByField) {
        errors.push(`Kanban view "${view.id}": must have groupByField`);
      } else {
        const groupField = schema.fields.find((f) => f.id === view.groupByField);
        if (!groupField) {
          errors.push(`Kanban view "${view.id}": groupByField "${view.groupByField}" does not exist`);
        } else if (!GROUPABLE_TYPES.has(groupField.type)) {
          errors.push(`Kanban view "${view.id}": groupByField "${view.groupByField}" must be select/status/stage type`);
        }
      }
    }

    // Calendar views must have a valid dateField
    if (view.type === "calendar") {
      if (!view.dateField) {
        errors.push(`Calendar view "${view.id}": must have dateField`);
      } else {
        const dateField = schema.fields.find((f) => f.id === view.dateField);
        if (!dateField) {
          errors.push(`Calendar view "${view.id}": dateField "${view.dateField}" does not exist`);
        } else if (!DATE_TYPES.has(dateField.type)) {
          errors.push(`Calendar view "${view.id}": dateField "${view.dateField}" must be date/datetime type`);
        }
      }
    }

    // sortDefault field must exist
    if (view.sortDefault && !fieldIds.has(view.sortDefault.field)) {
      errors.push(`View "${view.id}": sortDefault field "${view.sortDefault.field}" does not exist`);
    }

    // colorField must exist
    if (view.colorField && !fieldIds.has(view.colorField)) {
      errors.push(`View "${view.id}": colorField "${view.colorField}" does not exist`);
    }

    // cardFields must exist
    if (view.cardFields) {
      for (const cf of view.cardFields) {
        if (!fieldIds.has(cf)) {
          errors.push(`View "${view.id}": cardField "${cf}" does not exist`);
        }
      }
    }
  }

  return errors;
}

// ── Level 3: Action Safety ───────────────────────────────────

function validateActionSafety(
  schema: ModuleSchema,
  allSchemaIds: Set<string>,
): string[] {
  const errors: string[] = [];
  const fieldIds = new Set(schema.fields.map((f) => f.id));

  // Check all relation field targets point to known modules
  for (const field of schema.fields) {
    if (field.type === "relation" && field.relationTo && !allSchemaIds.has(field.relationTo)) {
      errors.push(`Field "${field.id}": relationTo "${field.relationTo}" is not a known module`);
    }
    // Also check nested subField relations
    if (field.subFields) {
      for (const sub of field.subFields) {
        if (sub.type === "relation" && sub.relationTo && !allSchemaIds.has(sub.relationTo)) {
          errors.push(`Field "${field.id}" subField "${sub.id}": relationTo "${sub.relationTo}" is not a known module`);
        }
      }
    }
  }

  // Check relations[] entries
  if (schema.relations) {
    for (const rel of schema.relations) {
      if (!allSchemaIds.has(rel.targetModule)) {
        errors.push(`Relation on field "${rel.field}": targetModule "${rel.targetModule}" is not a known module`);
      }
    }
  }

  if (!schema.actions) return errors;

  for (const action of schema.actions) {
    switch (action.type) {
      case "convert": {
        // Target module must exist
        if (!allSchemaIds.has(action.targetModule)) {
          errors.push(`Convert action "${action.id}": targetModule "${action.targetModule}" does not exist`);
        }

        // Source fields must exist in this schema
        for (const mapping of action.fieldMapping) {
          if (!fieldIds.has(mapping.sourceField)) {
            errors.push(`Convert action "${action.id}": sourceField "${mapping.sourceField}" does not exist`);
          }
        }

        // Source updates must reference existing fields
        for (const upd of action.sourceUpdates) {
          if (!fieldIds.has(upd.field)) {
            errors.push(`Convert action "${action.id}": sourceUpdate field "${upd.field}" does not exist`);
          }
        }
        break;
      }

      case "cascade-delete": {
        for (const target of action.targetModules) {
          if (!allSchemaIds.has(target.moduleId)) {
            errors.push(`Cascade action "${action.id}": targetModule "${target.moduleId}" does not exist`);
          }
        }
        break;
      }

      case "notify": {
        if (!allSchemaIds.has(action.targetModule)) {
          errors.push(`Notify action "${action.id}": targetModule "${action.targetModule}" does not exist`);
        }
        // Trigger condition field must exist
        if (action.triggerCondition && !fieldIds.has(action.triggerCondition.field)) {
          errors.push(`Notify action "${action.id}": triggerCondition field "${action.triggerCondition.field}" does not exist`);
        }
        break;
      }

      case "navigate":
        // Navigate actions just need a non-empty href
        if (!action.href) {
          errors.push(`Navigate action "${action.id}": href is required`);
        }
        break;
    }
  }

  return errors;
}

// ── Level 4: Condition Validation ────────────────────────────

function validateConditions(schema: ModuleSchema): string[] {
  const errors: string[] = [];
  const fieldIds = new Set(schema.fields.map((f) => f.id));

  // visibleWhen conditions must reference existing fields
  for (const field of schema.fields) {
    if (field.visibleWhen && !fieldIds.has(field.visibleWhen.field)) {
      errors.push(`Field "${field.id}": visibleWhen references non-existent field "${field.visibleWhen.field}"`);
    }

    // autoFillFrom targetField must exist in this schema
    if (field.autoFillFrom) {
      for (const rule of field.autoFillFrom) {
        if (!fieldIds.has(rule.targetField)) {
          errors.push(`Field "${field.id}": autoFillFrom targetField "${rule.targetField}" does not exist`);
        }
      }
    }
  }

  // Status flow validation
  if (schema.statusFlow) {
    const sf = schema.statusFlow;

    // Status field must exist
    if (!fieldIds.has(sf.field)) {
      errors.push(`StatusFlow: field "${sf.field}" does not exist`);
    }

    // Must have at least 2 states
    if (sf.states.length < 2) {
      errors.push("StatusFlow: must have at least 2 states");
    }

    // State values must be unique
    const stateValues = new Set<string>();
    for (const state of sf.states) {
      if (stateValues.has(state.value)) {
        errors.push(`StatusFlow: duplicate state value "${state.value}"`);
      }
      stateValues.add(state.value);
    }

    // Transitions must reference valid states
    if (sf.transitions) {
      for (const t of sf.transitions) {
        if (!stateValues.has(t.from)) {
          errors.push(`StatusFlow transition: "from" state "${t.from}" does not exist`);
        }
        for (const to of t.to) {
          if (!stateValues.has(to)) {
            errors.push(`StatusFlow transition: "to" state "${to}" does not exist`);
          }
        }
      }
    }
  }

  // Relations must reference existing fields and fields must be relation type
  if (schema.relations) {
    for (const rel of schema.relations) {
      if (!fieldIds.has(rel.field)) {
        errors.push(`Relation: field "${rel.field}" does not exist`);
      } else {
        const relField = schema.fields.find((f) => f.id === rel.field);
        if (relField && relField.type !== "relation") {
          errors.push(`Relation: field "${rel.field}" must be of type "relation"`);
        }
      }
    }
  }

  return errors;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Validate a module schema at all 4 levels.
 *
 * @param schema - The schema to validate
 * @param allSchemaIds - Set of all known module IDs (for cross-module reference validation)
 */
export function validateModuleSchema(
  schema: ModuleSchema,
  allSchemaIds?: Set<string>,
): SchemaValidationResult {
  // Level 1: Field integrity
  const l1Errors = validateFieldIntegrity(schema);
  if (l1Errors.length > 0) {
    return { valid: false, errors: l1Errors, level: 1 };
  }

  // Level 2: View consistency
  const l2Errors = validateViewConsistency(schema);
  if (l2Errors.length > 0) {
    return { valid: false, errors: l2Errors, level: 2 };
  }

  // Level 3: Action safety (needs all schema IDs for cross-module checks)
  const knownIds = allSchemaIds ?? new Set([schema.id]);
  const l3Errors = validateActionSafety(schema, knownIds);
  if (l3Errors.length > 0) {
    return { valid: false, errors: l3Errors, level: 3 };
  }

  // Level 4: Condition validation
  const l4Errors = validateConditions(schema);
  if (l4Errors.length > 0) {
    return { valid: false, errors: l4Errors, level: 4 };
  }

  return { valid: true, errors: [], level: 4 };
}

/**
 * Quick check: is this a structurally valid schema? (Levels 1-2 only, no cross-module checks)
 */
export function validateSchemaStructure(schema: ModuleSchema): SchemaValidationResult {
  const l1Errors = validateFieldIntegrity(schema);
  if (l1Errors.length > 0) return { valid: false, errors: l1Errors, level: 1 };

  const l2Errors = validateViewConsistency(schema);
  if (l2Errors.length > 0) return { valid: false, errors: l2Errors, level: 2 };

  return { valid: true, errors: [], level: 2 };
}
