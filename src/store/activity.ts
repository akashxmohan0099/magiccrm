import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ActivityEntry } from "@/types/models";
import { generateId } from "@/lib/id";
import {
  fetchActivityLog,
  dbCreateActivity,
  dbUpsertActivityLog,
  dbClearActivityLog,
  mapActivityFromDB,
} from "@/lib/db/activity";

interface ActivityStore {
  entries: ActivityEntry[];
  addEntry: (entry: Omit<ActivityEntry, "id" | "timestamp">, workspaceId?: string) => void;
  clearEntries: (workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entry, workspaceId?) => {
        const newEntry: ActivityEntry = {
          ...entry,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };
        set((s) => ({
          entries: [newEntry, ...s.entries].slice(0, 500),
        }));

        if (workspaceId) {
          dbCreateActivity(workspaceId, newEntry).catch((err) =>
            console.error("[activity] dbCreateActivity failed:", err)
          );
        }
      },
      clearEntries: (workspaceId?) => {
        set({ entries: [] });

        if (workspaceId) {
          dbClearActivityLog(workspaceId).catch((err) =>
            console.error("[activity] dbClearActivityLog failed:", err)
          );
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { entries } = get();
          await dbUpsertActivityLog(workspaceId, entries);
        } catch (err) {
          console.error("[activity] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchActivityLog(workspaceId);
          const mapped = (rows ?? []).map((row: Record<string, unknown>) =>
            mapActivityFromDB(row)
          );
          set({ entries: mapped });
        } catch (err) {
          console.error("[activity] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-activity" }
  )
);
