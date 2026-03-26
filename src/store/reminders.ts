import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Reminder } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchReminders,
  dbCreateReminder,
  dbUpdateReminder,
  dbDeleteReminder,
  dbUpsertReminders,
  mapReminderFromDB,
} from "@/lib/db/reminders";

interface RemindersStore {
  reminders: Reminder[];
  addReminder: (data: Omit<Reminder, "id" | "completed" | "createdAt">, workspaceId?: string) => void;
  toggleReminder: (id: string, workspaceId?: string) => void;
  deleteReminder: (id: string, workspaceId?: string) => void;
  getRemindersForEntity: (entityType: Reminder["entityType"], entityId: string) => Reminder[];
  getUpcomingReminders: () => Reminder[];

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useRemindersStore = create<RemindersStore>()(
  persist(
    (set, get) => ({
      reminders: [],

      addReminder: (data, workspaceId?) => {
        const reminder: Reminder = {
          ...data,
          id: generateId(),
          completed: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ reminders: [...s.reminders, reminder] }));
        toast("Reminder added");

        if (workspaceId) {
          dbCreateReminder(workspaceId, reminder).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving reminder" }));
          });
        }
      },

      toggleReminder: (id, workspaceId?) => {
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id ? { ...r, completed: !r.completed } : r
          ),
        }));
        const reminder = get().reminders.find((r) => r.id === id);
        if (reminder) toast(reminder.completed ? "Reminder completed" : "Reminder reopened");

        if (workspaceId && reminder) {
          dbUpdateReminder(workspaceId, id, { completed: reminder.completed }).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "toggling reminder" }));
          });
        }
      },

      deleteReminder: (id, workspaceId?) => {
        set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
        toast("Reminder deleted", "info");

        if (workspaceId) {
          dbDeleteReminder(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting reminder" }));
          });
        }
      },

      getRemindersForEntity: (entityType, entityId) =>
        get().reminders.filter(
          (r) => r.entityType === entityType && r.entityId === entityId
        ),

      getUpcomingReminders: () =>
        get()
          .reminders.filter((r) => !r.completed && new Date(r.dueDate) >= new Date())
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { reminders } = get();
          await dbUpsertReminders(workspaceId, reminders);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing reminders to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchReminders(workspaceId);
          if (!rows || rows.length === 0) return;

          const mapped = rows.map((row: Record<string, unknown>) =>
            mapReminderFromDB(row)
          );
          set({ reminders: mapped });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading reminders from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-reminders" }
  )
);
