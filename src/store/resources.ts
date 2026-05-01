import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Resource } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchResources,
  dbCreateResource,
  dbUpdateResource,
  dbDeleteResource,
} from "@/lib/db/resources";
import { surfaceDbError } from "./_db-error";

interface ResourcesStore {
  resources: Resource[];
  addResource: (
    data: Omit<Resource, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string,
  ) => Resource;
  updateResource: (id: string, data: Partial<Resource>, workspaceId?: string) => void;
  deleteResource: (id: string, workspaceId?: string) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useResourcesStore = create<ResourcesStore>()(
  persist(
    (set) => ({
      resources: [],

      addResource: (data, workspaceId) => {
        const now = new Date().toISOString();
        const r: Resource = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ resources: [...s.resources, r] }));
        toast(`Added "${r.name}"`);
        if (workspaceId) {
          dbCreateResource(workspaceId, r as unknown as Record<string, unknown>).catch(
            surfaceDbError("resources"),
          );
        }
        return r;
      },
      updateResource: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          resources: s.resources.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: now } : r,
          ),
        }));
        if (workspaceId) {
          dbUpdateResource(workspaceId, id, data as Record<string, unknown>).catch(
            surfaceDbError("resources"),
          );
        }
      },
      deleteResource: (id, workspaceId) => {
        set((s) => ({ resources: s.resources.filter((r) => r.id !== id) }));
        toast("Resource deleted");
        if (workspaceId) {
          dbDeleteResource(workspaceId, id).catch(surfaceDbError("resources"));
        }
      },
      loadFromSupabase: async (workspaceId) => {
        try {
          const resources = await fetchResources(workspaceId);
          set({ resources });
        } catch (err) {
          console.debug("[store] resources load skipped:", err);
        }
      },
    }),
    { name: "magic-crm-resources", version: 1 },
  ),
);
