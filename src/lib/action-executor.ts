// ── Action Executor ──────────────────────────────────────────
//
// Deterministic engine that executes schema-defined actions.
// All 10 cross-module flows (Lead→Client, Quote→Invoice, etc.)
// are handled by this one executor + configuration.
//
// No AI involvement — purely mechanical field mapping.

import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { getModuleStore, type RecordData } from "@/store/createModuleStore";
import type {
  ActionDefinition,
  ConvertAction,
  CascadeDeleteAction,
  NotifyAction,
} from "@/types/module-schema";

// ── Public API ───────────────────────────────────────────────

/**
 * Execute an action from a module schema.
 *
 * @param action - The action definition from the schema
 * @param sourceRecordId - The record to act on
 * @param sourceModuleId - The module that owns the source record
 * @returns The result of the action (e.g., created record ID for conversions)
 */
export function executeAction(
  action: ActionDefinition,
  sourceRecordId: string,
  sourceModuleId: string,
): { success: boolean; targetRecordId?: string; error?: string } {
  switch (action.type) {
    case "convert":
      return executeConvert(action, sourceRecordId, sourceModuleId);

    case "cascade-delete":
      return executeCascadeDelete(action, sourceRecordId, sourceModuleId);

    case "notify":
      return executeNotify(action, sourceRecordId, sourceModuleId);

    case "navigate":
      // Navigate actions are handled by the UI, not the executor
      return { success: true };

    default:
      return { success: false, error: `Unknown action type` };
  }
}

// ── Convert Action ───────────────────────────────────────────

function executeConvert(
  action: ConvertAction,
  sourceRecordId: string,
  sourceModuleId: string,
): { success: boolean; targetRecordId?: string; error?: string } {
  // Get source store and record
  const sourceStore = getModuleStore(sourceModuleId);
  if (!sourceStore) {
    return { success: false, error: `Source module store "${sourceModuleId}" not found` };
  }

  const source = sourceStore.getState().getRecord(sourceRecordId);
  if (!source) {
    return { success: false, error: `Source record "${sourceRecordId}" not found` };
  }

  // Get target store
  const targetStore = getModuleStore(action.targetModule);
  if (!targetStore) {
    return { success: false, error: `Target module store "${action.targetModule}" not found` };
  }

  // Build target record from field mapping
  const targetData: Record<string, unknown> = {};

  for (const mapping of action.fieldMapping) {
    const sourceValue = source[mapping.sourceField];

    switch (mapping.transform) {
      case "clone-line-items": {
        // Deep clone line items with new IDs
        const items = sourceValue as Record<string, unknown>[];
        if (Array.isArray(items)) {
          targetData[mapping.targetField] = items.map((item) => ({
            ...item,
            id: generateId(),
          }));
        }
        break;
      }

      case "generate-id":
        targetData[mapping.targetField] = generateId();
        break;

      case "copy":
      default:
        targetData[mapping.targetField] = sourceValue;
        break;
    }
  }

  // Apply target defaults
  for (const def of action.targetDefaults) {
    targetData[def.field] = def.value;
  }

  // Create the target record
  const created = targetStore.getState().addRecord(targetData);

  // Update the source record
  const sourceUpdates: Record<string, unknown> = {};
  for (const upd of action.sourceUpdates) {
    sourceUpdates[upd.field] = upd.value === "$targetId" ? created.id : upd.value;
  }
  sourceStore.getState().updateRecord(sourceRecordId, sourceUpdates, true);

  // Log the conversion
  const sourceName = (source.name as string) || (source.title as string) || sourceRecordId.slice(0, 8);
  logActivity(
    "convert",
    sourceModuleId,
    `Converted ${sourceName} → ${action.targetModule}`,
    sourceRecordId,
  );
  toast(`${action.label} complete`);

  return { success: true, targetRecordId: created.id };
}

// ── Cascade Delete Action ────────────────────────────────────

function executeCascadeDelete(
  action: CascadeDeleteAction,
  sourceRecordId: string,
  sourceModuleId: string,
): { success: boolean; error?: string } {
  let totalDeleted = 0;

  for (const target of action.targetModules) {
    const targetStore = getModuleStore(target.moduleId);
    if (!targetStore) continue;

    const state = targetStore.getState();
    const toDelete = state.records.filter(
      (r) => r[target.foreignKey] === sourceRecordId,
    );

    for (const record of toDelete) {
      state.deleteRecord(record.id, true); // silent — don't toast each one
      totalDeleted++;
    }
  }

  if (totalDeleted > 0) {
    logActivity(
      "cascade-delete",
      sourceModuleId,
      `Cascade deleted ${totalDeleted} related record${totalDeleted === 1 ? "" : "s"}`,
      sourceRecordId,
    );
  }

  return { success: true };
}

// ── Notify Action ────────────────────────────────────────────

function executeNotify(
  action: NotifyAction,
  sourceRecordId: string,
  sourceModuleId: string,
): { success: boolean; error?: string } {
  const sourceStore = getModuleStore(sourceModuleId);
  if (!sourceStore) {
    return { success: false, error: `Source module store "${sourceModuleId}" not found` };
  }

  const source = sourceStore.getState().getRecord(sourceRecordId);
  if (!source) {
    return { success: false, error: `Source record "${sourceRecordId}" not found` };
  }

  const targetStore = getModuleStore(action.targetModule);
  if (!targetStore) {
    return { success: false, error: `Target module store "${action.targetModule}" not found` };
  }

  // Build notification data from mapping
  const notifyData: Record<string, unknown> = {};
  for (const mapping of action.dataMapping) {
    notifyData[mapping.targetField] = source[mapping.sourceField];
  }

  // Create a record in the target module (e.g., a waitlist notification)
  targetStore.getState().addRecord(notifyData, true);

  logActivity(
    "notify",
    sourceModuleId,
    `Notified ${action.targetModule}`,
    sourceRecordId,
  );

  return { success: true };
}

// ── Helper: Find and execute an action by ID ─────────────────

/**
 * Look up an action by ID in a schema's action list and execute it.
 */
export function executeSchemaAction(
  actions: ActionDefinition[],
  actionId: string,
  sourceRecordId: string,
  sourceModuleId: string,
): { success: boolean; targetRecordId?: string; error?: string } {
  const action = actions.find((a) => a.id === actionId);
  if (!action) {
    return { success: false, error: `Action "${actionId}" not found in schema` };
  }
  return executeAction(action, sourceRecordId, sourceModuleId);
}
