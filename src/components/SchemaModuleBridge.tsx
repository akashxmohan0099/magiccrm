"use client";

import { useMemo, useCallback } from "react";
import { ModuleRenderer } from "@/components/ModuleRenderer";
import { getModuleStore, type RecordData } from "@/store/createModuleStore";
import { getLegacyStoreAccessor, useLegacyRecords } from "@/lib/legacy-store-bridge";
import { executeSchemaAction } from "@/lib/action-executor";
import type { ModuleSchema } from "@/types/module-schema";

// ── Bridge Component ─────────────────────────────────────────

interface SchemaModuleBridgeProps {
  schema: ModuleSchema;
}

/**
 * Bridges a ModuleSchema to the ModuleRenderer.
 *
 * Reads/writes from the LEGACY Zustand stores so existing data
 * shows up in schema-rendered modules. If no legacy store exists
 * for this module, falls back to the generic schema store.
 */
export function SchemaModuleBridge({ schema }: SchemaModuleBridgeProps) {
  const legacyAccessor = useMemo(() => getLegacyStoreAccessor(schema.id), [schema.id]);

  // Subscribe to legacy store reactively for records
  const legacyRecords = useLegacyRecords(schema.id);

  // Use legacy records if available, otherwise empty
  const records = legacyRecords.length > 0 || legacyAccessor
    ? legacyRecords
    : [];

  // CRUD delegates to legacy store if available
  const handleCreate = useCallback((data: Record<string, unknown>) => {
    if (legacyAccessor) {
      legacyAccessor.addRecord(data);
    }
  }, [legacyAccessor]);

  const handleUpdate = useCallback((id: string, data: Record<string, unknown>) => {
    if (legacyAccessor) {
      legacyAccessor.updateRecord(id, data);
    }
  }, [legacyAccessor]);

  const handleDelete = useCallback((id: string) => {
    if (legacyAccessor) {
      legacyAccessor.deleteRecord(id);
    }
  }, [legacyAccessor]);

  // Action execution
  const handleExecuteAction = useCallback((actionId: string, recordId: string) => {
    if (!schema.actions) return;
    executeSchemaAction(schema.actions, actionId, recordId, schema.id);
  }, [schema]);

  // Relation options resolver — looks up from legacy stores first, then generic stores
  const resolveRelationOptions = useCallback((targetModuleId: string) => {
    // Try legacy store
    const targetLegacy = getLegacyStoreAccessor(targetModuleId);
    if (targetLegacy) {
      return targetLegacy.getRecords().map((r) => ({
        value: r.id,
        label: (r.name as string) || (r.title as string) || r.id.slice(0, 8),
      }));
    }
    // Fall back to generic store
    const targetStore = getModuleStore(targetModuleId);
    if (!targetStore) return [];
    return targetStore.getState().records.map((r: RecordData) => ({
      value: r.id,
      label: (r.name as string) || (r.title as string) || r.id.slice(0, 8),
    }));
  }, []);

  return (
    <ModuleRenderer
      schema={schema}
      records={records}
      onRecordCreate={handleCreate}
      onRecordUpdate={handleUpdate}
      onRecordDelete={handleDelete}
      onExecuteAction={handleExecuteAction}
      resolveRelationOptions={resolveRelationOptions}
    />
  );
}
