import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Location } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchLocations,
  dbCreateLocation,
  dbUpdateLocation,
  dbDeleteLocation,
} from "@/lib/db/locations";
import { surfaceDbError } from "./_db-error";

interface LocationsStore {
  locations: Location[];
  addLocation: (
    data: Omit<Location, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string,
  ) => Location;
  updateLocation: (id: string, data: Partial<Location>, workspaceId?: string) => void;
  deleteLocation: (id: string, workspaceId?: string) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useLocationsStore = create<LocationsStore>()(
  persist(
    (set) => ({
      locations: [],

      addLocation: (data, workspaceId) => {
        const now = new Date().toISOString();
        const loc: Location = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ locations: [...s.locations, loc] }));
        toast(`Added "${loc.name}"`);
        if (workspaceId) {
          dbCreateLocation(
            workspaceId,
            loc as unknown as Record<string, unknown>,
          ).catch(surfaceDbError("locations"));
        }
        return loc;
      },

      updateLocation: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          locations: s.locations.map((l) =>
            l.id === id ? { ...l, ...data, updatedAt: now } : l,
          ),
        }));
        if (workspaceId) {
          dbUpdateLocation(workspaceId, id, data as Record<string, unknown>).catch(
            surfaceDbError("locations"),
          );
        }
      },

      deleteLocation: (id, workspaceId) => {
        set((s) => ({ locations: s.locations.filter((l) => l.id !== id) }));
        toast("Location deleted");
        if (workspaceId) {
          dbDeleteLocation(workspaceId, id).catch(surfaceDbError("locations"));
        }
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const locations = await fetchLocations(workspaceId);
          set({ locations });
        } catch (err) {
          console.debug("[store] locations load skipped:", err);
        }
      },
    }),
    { name: "magic-crm-locations", version: 1 },
  ),
);
