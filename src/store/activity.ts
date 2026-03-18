import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ActivityEntry } from "@/types/models";
import { generateId } from "@/lib/id";

interface ActivityStore {
  entries: ActivityEntry[];
  addEntry: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
  clearEntries: () => void;
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((s) => ({
          entries: [
            {
              ...entry,
              id: generateId(),
              timestamp: new Date().toISOString(),
            },
            ...s.entries,
          ].slice(0, 500),
        })),
      clearEntries: () => set({ entries: [] }),
    }),
    { name: "magic-crm-activity" }
  )
);
