import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Reminder } from "@/types/models";
import { generateId } from "@/lib/id";

interface RemindersStore {
  reminders: Reminder[];
  addReminder: (data: Omit<Reminder, "id" | "completed" | "createdAt">) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  getRemindersForEntity: (entityType: Reminder["entityType"], entityId: string) => Reminder[];
  getUpcomingReminders: () => Reminder[];
}

export const useRemindersStore = create<RemindersStore>()(
  persist(
    (set, get) => ({
      reminders: [],

      addReminder: (data) => {
        const reminder: Reminder = {
          ...data,
          id: generateId(),
          completed: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ reminders: [...s.reminders, reminder] }));
      },

      toggleReminder: (id) => {
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id ? { ...r, completed: !r.completed } : r
          ),
        }));
      },

      deleteReminder: (id) => {
        set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
      },

      getRemindersForEntity: (entityType, entityId) =>
        get().reminders.filter(
          (r) => r.entityType === entityType && r.entityId === entityId
        ),

      getUpcomingReminders: () =>
        get()
          .reminders.filter((r) => !r.completed && new Date(r.dueDate) >= new Date())
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    }),
    { name: "magic-crm-reminders" }
  )
);
