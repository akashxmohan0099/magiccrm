import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ClassDefinition } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchClasses, dbCreateClass, dbUpdateClass, dbDeleteClass,
  dbUpsertClasses, mapClassFromDB,
} from "@/lib/db/class-timetable";

interface ClassTimetableStore {
  classes: ClassDefinition[];
  addClass: (data: Omit<ClassDefinition, "id" | "enrolled" | "createdAt">, workspaceId?: string) => ClassDefinition;
  updateClass: (id: string, data: Partial<Omit<ClassDefinition, "id" | "createdAt">>, workspaceId?: string) => void;
  deleteClass: (id: string, workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useClassTimetableStore = create<ClassTimetableStore>()(
  persist(
    (set, get) => ({
      classes: [],
      addClass: (data, workspaceId?) => {
        const cls: ClassDefinition = {
          ...data,
          id: generateId(),
          enrolled: 0,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ classes: [...s.classes, cls] }));
        logActivity("create", "class-timetable", `Class "${cls.name}" added`);
        toast(`Class "${cls.name}" added`);

        if (workspaceId) {
          dbCreateClass(workspaceId, cls).catch((err) =>
            console.error("[class-timetable] dbCreateClass failed:", err)
          );
        }
        return cls;
      },
      updateClass: (id, data, workspaceId?) => {
        const cls = get().classes.find((c) => c.id === id);
        set((s) => ({
          classes: s.classes.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
        if (cls) {
          logActivity("update", "class-timetable", `Class "${cls.name}" updated`);
          toast(`Class "${cls.name}" updated`);
        }

        if (workspaceId) {
          dbUpdateClass(workspaceId, id, data).catch((err) =>
            console.error("[class-timetable] dbUpdateClass failed:", err)
          );
        }
      },
      deleteClass: (id, workspaceId?) => {
        const cls = get().classes.find((c) => c.id === id);
        set((s) => ({ classes: s.classes.filter((c) => c.id !== id) }));
        if (cls) {
          logActivity("delete", "class-timetable", `Class "${cls.name}" deleted`);
          toast(`Class "${cls.name}" deleted`);
        }

        if (workspaceId) {
          dbDeleteClass(workspaceId, id).catch((err) =>
            console.error("[class-timetable] dbDeleteClass failed:", err)
          );
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { classes } = get();
          await dbUpsertClasses(workspaceId, classes);
        } catch (err) {
          console.error("[class-timetable] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchClasses(workspaceId);
          if (!rows || rows.length === 0) return;

          const mapped = rows.map((row: Record<string, unknown>) =>
            mapClassFromDB(row)
          );
          set({ classes: mapped });
        } catch (err) {
          console.error("[class-timetable] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-class-timetable" }
  )
);
