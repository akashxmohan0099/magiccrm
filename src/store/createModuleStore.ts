// ── Generic Module Store Factory ─────────────────────────────
//
// Creates a Zustand store for any module from its ModuleSchema.
// Handles CRUD, validation, activity logging, and extension hooks
// for the 5% of logic that's module-specific.
//
// Replaces 3000+ lines of duplicated per-module store code with
// one generic factory + per-module extension configs.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import type { ModuleSchema } from "@/types/module-schema";

export type RecordData = { id: string; createdAt: string; updatedAt: string; [key: string]: unknown };

// ── Extension Hooks ──────────────────────────────────────────

export interface StoreExtensions {
  /** Runs AFTER a record is created. Use for cross-module side effects. */
  afterCreate?: (record: RecordData, getState: () => GenericModuleState) => void;
  /** Runs AFTER a record is updated. Use for status-change triggers. */
  afterUpdate?: (id: string, changes: Record<string, unknown>, getState: () => GenericModuleState) => void;
  /** Runs AFTER a record is deleted. Use for cascade deletes. */
  afterDelete?: (id: string, deletedRecord: RecordData, getState: () => GenericModuleState) => void;
}

// ── Store Interface ──────────────────────────────────────────

export interface GenericModuleState {
  records: RecordData[];
  /** Schema this store was created from */
  moduleId: string;

  // CRUD
  addRecord: (data: Record<string, unknown>, silent?: boolean) => RecordData;
  updateRecord: (id: string, data: Record<string, unknown>, silent?: boolean) => void;
  deleteRecord: (id: string, silent?: boolean) => void;
  getRecord: (id: string) => RecordData | undefined;

  // Bulk
  setRecords: (records: RecordData[]) => void;

  // Validation
  validateRecord: (data: Record<string, unknown>) => string[];
}

// ── Validation ───────────────────────────────────────────────

function validateRecordAgainstSchema(
  data: Record<string, unknown>,
  schema: ModuleSchema,
): string[] {
  const errors: string[] = [];

  for (const field of schema.fields) {
    // Skip fields not in forms
    if (field.showInForm === false) continue;
    // Skip timestamp fields
    if (field.id === "createdAt" || field.id === "updatedAt") continue;

    const val = data[field.id];

    if (field.required && (val === undefined || val === null || val === "")) {
      errors.push(`${field.label} is required`);
    }

    if (field.min != null && typeof val === "number" && val < field.min) {
      errors.push(`${field.label} must be at least ${field.min}`);
    }

    if (field.max != null && typeof val === "number" && val > field.max) {
      errors.push(`${field.label} must be at most ${field.max}`);
    }
  }

  return errors;
}

// ── Factory ──────────────────────────────────────────────────

/**
 * Creates a fully functional Zustand store for any module.
 *
 * @param schema   - The module's schema (fields, status flow, etc.)
 * @param extensions - Optional hooks for module-specific cross-module logic
 */
export function createModuleStore(
  schema: ModuleSchema,
  extensions?: StoreExtensions,
) {
  const moduleId = schema.id;
  const moduleName = schema.label;

  return create<GenericModuleState>()(
    persist(
      (set, get) => ({
        records: [],
        moduleId,

        addRecord: (data, silent) => {
          const now = new Date().toISOString();
          const record: RecordData = {
            id: generateId(),
            createdAt: now,
            updatedAt: now,
            ...data,
          };

          // Apply defaults from schema for missing fields
          for (const field of schema.fields) {
            if (record[field.id] === undefined && field.defaultValue !== undefined) {
              record[field.id] = field.defaultValue;
            }
          }

          set((s) => ({ records: [...s.records, record] }));

          if (!silent) {
            const nameField = record.name || record.title || "";
            logActivity("create", moduleId, `Created ${moduleName.replace(/s$/, "")}${nameField ? `: ${nameField}` : ""}`, record.id);
            toast(`${moduleName.replace(/s$/, "")} created`);
          }

          // Run extension
          extensions?.afterCreate?.(record, get);

          return record;
        },

        updateRecord: (id, data, silent) => {
          const before = get().records.find((r) => r.id === id);
          if (!before) return;

          const now = new Date().toISOString();
          set((s) => ({
            records: s.records.map((r) =>
              r.id === id ? { ...r, ...data, updatedAt: now } : r,
            ),
          }));

          if (!silent) {
            logActivity("update", moduleId, `Updated ${moduleName.replace(/s$/, "")}`, id);
          }

          // Run extension
          extensions?.afterUpdate?.(id, data, get);
        },

        deleteRecord: (id, silent) => {
          const deleted = get().records.find((r) => r.id === id);
          if (!deleted) return;

          set((s) => ({ records: s.records.filter((r) => r.id !== id) }));

          if (!silent) {
            const nameField = deleted.name || deleted.title || "";
            logActivity("delete", moduleId, `Deleted ${moduleName.replace(/s$/, "")}${nameField ? `: ${nameField}` : ""}`, id);
            toast(`${moduleName.replace(/s$/, "")} deleted`);
          }

          // Run extension (cascade deletes, notifications, etc.)
          extensions?.afterDelete?.(id, deleted, get);
        },

        getRecord: (id) => {
          return get().records.find((r) => r.id === id);
        },

        setRecords: (records) => set({ records }),

        validateRecord: (data) => {
          return validateRecordAgainstSchema(data, schema);
        },
      }),
      {
        name: `magic-crm-schema-${moduleId}`,
        version: 1,
      },
    ),
  );
}

// ── Store Registry ───────────────────────────────────────────
// Keeps track of created stores so they can be looked up by module ID
// (needed by the action executor for cross-module operations)

const storeRegistry = new Map<string, ReturnType<typeof createModuleStore>>();

/** Get a registered module store by ID */
export function getModuleStore(
  moduleId: string,
): ReturnType<typeof createModuleStore> | undefined {
  return storeRegistry.get(moduleId);
}
