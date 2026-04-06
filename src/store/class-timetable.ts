import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ClassDefinition } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateClassDefinition, sanitize } from "@/lib/validation";
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
        // Validate input
        const validation = validateClassDefinition(data);
        if (!validation.valid) {
          toast(validation.errors[0], "error");
          throw new Error(validation.errors[0]);
        }

        const cls: ClassDefinition = {
          ...data,
          id: generateId(),
          enrolled: 0,
          createdAt: new Date().toISOString(),
          name: sanitize(data.name),
          instructor: sanitize(data.instructor),
        };
        set((s) => ({ classes: [...s.classes, cls] }));
        logActivity("create", "class-timetable", `Class "${cls.name}" added`);
        toast(`Class "${cls.name}" added`);

        if (workspaceId) {
          dbCreateClass(workspaceId, cls).catch((err) =>
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "dbCreateClass" }))
          );
        }
        return cls;
      },
      updateClass: (id, data, workspaceId?) => {
        const cls = get().classes.find((c) => c.id === id);
        if (!cls) return;

        // Validate changed fields
        const validation = validateClassDefinition({ ...cls, ...data });
        if (!validation.valid) {
          toast(validation.errors[0], "error");
          return;
        }

        // Sanitize string fields
        const sanitizedData = { ...data };
        if (data.name) sanitizedData.name = sanitize(data.name);
        if (data.instructor) sanitizedData.instructor = sanitize(data.instructor);

        // Capture previous state for rollback
        const previousClasses = get().classes;

        set((s) => ({
          classes: s.classes.map((c) => (c.id === id ? { ...c, ...sanitizedData } : c)),
        }));
        logActivity("update", "class-timetable", `Class "${cls.name}" updated`);
        toast(`Class "${cls.name}" updated`);

        if (workspaceId) {
          dbUpdateClass(workspaceId, id, sanitizedData).catch((err) => {
            set({ classes: previousClasses });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "dbUpdateClass" }));
          });
        }
      },
      deleteClass: (id, workspaceId?) => {
        const cls = get().classes.find((c) => c.id === id);
        const previousClasses = get().classes;

        set((s) => ({ classes: s.classes.filter((c) => c.id !== id) }));
        if (cls) {
          logActivity("delete", "class-timetable", `Class "${cls.name}" deleted`);
          toast(`Class "${cls.name}" deleted`);
        }

        if (workspaceId) {
          dbDeleteClass(workspaceId, id).catch((err) => {
            set({ classes: previousClasses });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "dbDeleteClass" }));
          });
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
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncToSupabase" }));
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
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loadFromSupabase" }));
        }
      },
    }),
    { name: "magic-crm-class-timetable" }
  )
);
