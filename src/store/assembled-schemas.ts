// ── Assembled Schema Store ───────────────────────────────────
//
// Persists the assembled module schemas after the onboarding
// assembly pipeline runs. The dashboard, sidebar, and route
// all read from this store.
//
// If this store is empty (no assembly has run), the system
// falls back to legacy hardcoded modules.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModuleSchema } from "@/types/module-schema";

interface AssembledSchemasState {
  /** The assembled schemas, keyed by module ID */
  schemas: Record<string, ModuleSchema>;
  /** Whether the assembly pipeline has run for this workspace */
  assembled: boolean;
  /** Timestamp of last assembly */
  assembledAt: string | null;
  /** Any modules that fell back during assembly */
  fallbacks: { moduleId: string; reason: string }[];
  /** Assembly timing info */
  durationMs: number | null;

  // Actions
  setAssemblyResult: (
    schemas: ModuleSchema[],
    fallbacks: { moduleId: string; reason: string }[],
    durationMs: number,
  ) => void;
  getSchema: (moduleId: string) => ModuleSchema | undefined;
  getSchemaBySlug: (slug: string) => ModuleSchema | undefined;
  getAllSchemas: () => ModuleSchema[];
  clearAssembly: () => void;
}

export const useAssembledSchemasStore = create<AssembledSchemasState>()(
  persist(
    (set, get) => ({
      schemas: {},
      assembled: false,
      assembledAt: null,
      fallbacks: [],
      durationMs: null,

      setAssemblyResult: (schemas, fallbacks, durationMs) => {
        const schemaMap: Record<string, ModuleSchema> = {};
        for (const schema of schemas) {
          schemaMap[schema.id] = schema;
        }
        set({
          schemas: schemaMap,
          assembled: true,
          assembledAt: new Date().toISOString(),
          fallbacks,
          durationMs,
        });
      },

      getSchema: (moduleId) => {
        return get().schemas[moduleId];
      },

      getSchemaBySlug: (slug) => {
        return Object.values(get().schemas).find((s) => s.slug === slug);
      },

      getAllSchemas: () => {
        return Object.values(get().schemas);
      },

      clearAssembly: () => {
        set({
          schemas: {},
          assembled: false,
          assembledAt: null,
          fallbacks: [],
          durationMs: null,
        });
      },
    }),
    {
      name: "magic-crm-assembled-schemas",
      version: 1,
    },
  ),
);
