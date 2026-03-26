"use client";

import { useEffect, useMemo, useCallback } from "react";
import { ModuleRenderer } from "@/components/ModuleRenderer";
import { createModuleStore, registerModuleStore, getModuleStore, type RecordData } from "@/store/createModuleStore";
import { executeSchemaAction } from "@/lib/action-executor";
import type { ModuleSchema } from "@/types/module-schema";

// ── Store Cache ──────────────────────────────────────────────
// Schema-driven stores are created once and reused.

const storeCache = new Map<string, ReturnType<typeof createModuleStore>>();

function getOrCreateStore(schema: ModuleSchema) {
  if (storeCache.has(schema.id)) {
    return storeCache.get(schema.id)!;
  }
  const store = createModuleStore(schema);
  storeCache.set(schema.id, store);
  registerModuleStore(schema.id, store);
  return store;
}

// ── Bridge Component ─────────────────────────────────────────

interface SchemaModuleBridgeProps {
  schema: ModuleSchema;
}

/**
 * Bridges a ModuleSchema to the ModuleRenderer by creating/connecting
 * the generic Zustand store and wiring up all callbacks.
 */
export function SchemaModuleBridge({ schema }: SchemaModuleBridgeProps) {
  const useStore = useMemo(() => getOrCreateStore(schema), [schema]);
  const records = useStore((s) => s.records);
  const addRecord = useStore((s) => s.addRecord);
  const updateRecord = useStore((s) => s.updateRecord);
  const deleteRecord = useStore((s) => s.deleteRecord);

  // Action execution
  const handleExecuteAction = useCallback((actionId: string, recordId: string) => {
    if (!schema.actions) return;
    executeSchemaAction(schema.actions, actionId, recordId, schema.id);
  }, [schema]);

  // Relation options resolver — looks up records from other module stores
  const resolveRelationOptions = useCallback((targetModuleId: string) => {
    const targetStore = getModuleStore(targetModuleId);
    if (!targetStore) return [];
    const targetRecords = targetStore.getState().records;
    return targetRecords.map((r: RecordData) => ({
      value: r.id,
      label: (r.name as string) || (r.title as string) || r.id.slice(0, 8),
    }));
  }, []);

  return (
    <ModuleRenderer
      schema={schema}
      records={records}
      onRecordCreate={addRecord}
      onRecordUpdate={updateRecord}
      onRecordDelete={deleteRecord}
      onExecuteAction={handleExecuteAction}
      resolveRelationOptions={resolveRelationOptions}
    />
  );
}
