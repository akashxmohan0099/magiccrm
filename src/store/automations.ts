import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AutomationRule, RecurringTaskTemplate } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateAutomationRule, sanitize } from "@/lib/validation";
import { useRemindersStore } from "@/store/reminders";
import {
  fetchAutomationRules,
  dbCreateRule,
  dbUpdateRule,
  dbDeleteRule,
  dbUpsertRules,
  mapRuleFromDB,
  fetchRecurringTemplates,
  dbCreateTemplate,
  dbDeleteTemplate,
  dbUpsertTemplates,
  mapTemplateFromDB,
} from "@/lib/db/automations";

const BUILT_IN_TEMPLATES: Omit<RecurringTaskTemplate, "id" | "createdAt">[] = [
  { name: "Weekly Report", description: "Send a weekly activity summary", frequency: "weekly", category: "reporting", taskTitle: "Send weekly report", isBuiltIn: true },
  { name: "Monthly Review", description: "Review monthly performance", frequency: "monthly", category: "reviews", taskTitle: "Monthly business review", isBuiltIn: true },
  { name: "Quarterly Check-In", description: "Check in with key clients", frequency: "quarterly", category: "reviews", taskTitle: "Quarterly client check-in", isBuiltIn: true },
  { name: "Daily Inbox Clear", description: "Clear and respond to all messages", frequency: "daily", category: "admin", taskTitle: "Clear inbox", isBuiltIn: true },
];

function initBuiltInTemplates(): RecurringTaskTemplate[] {
  return BUILT_IN_TEMPLATES.map((t) => ({
    ...t,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }));
}

interface AutomationsStore {
  rules: AutomationRule[];
  recurringTemplates: RecurringTaskTemplate[];
  addRule: (data: Omit<AutomationRule, "id" | "createdAt">, workspaceId?: string) => void;
  updateRule: (id: string, data: Partial<AutomationRule>, workspaceId?: string) => void;
  deleteRule: (id: string, workspaceId?: string) => void;
  toggleRule: (id: string, workspaceId?: string) => void;
  addRecurringTemplate: (data: Omit<RecurringTaskTemplate, "id" | "createdAt">, workspaceId?: string) => void;
  deleteRecurringTemplate: (id: string, workspaceId?: string) => void;
  createTaskFromTemplate: (templateId: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useAutomationsStore = create<AutomationsStore>()(
  persist(
    (set, get) => ({
      rules: [],
      recurringTemplates: initBuiltInTemplates(),

      addRule: (data, workspaceId?) => {
        // Validate
        const validation = validateAutomationRule({
          name: data.name,
          trigger: data.trigger,
          action: data.action,
        });
        if (!validation.valid) {
          validation.errors.forEach(error => toast(error, "error"));
          return;
        }

        const sanitizedData = {
          ...data,
          name: sanitize(data.name, 200),
        };

        const rule: AutomationRule = { ...sanitizedData, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ rules: [...s.rules, rule] }));
        logActivity("create", "automations", `Created automation "${rule.name}"`);
        toast(`Created automation "${rule.name}"`);

        if (workspaceId) {
          dbCreateRule(workspaceId, rule).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving automation rule" }));
          });
        }
      },

      updateRule: (id, data, workspaceId?) => {
        // Validate if name changed
        if (data.name !== undefined) {
          const validation = validateAutomationRule({
            name: data.name,
            trigger: data.trigger,
            action: data.action,
          });
          if (!validation.valid) {
            validation.errors.forEach(error => toast(error, "error"));
            return;
          }
        }

        const previousRules = get().rules;
        const sanitizedData = {
          ...data,
          ...(data.name !== undefined && { name: sanitize(data.name, 200) }),
        };

        set((s) => ({
          rules: s.rules.map((r) => (r.id === id ? { ...r, ...sanitizedData } : r)),
        }));
        logActivity("update", "automations", "Updated automation");
        toast("Automation updated");

        if (workspaceId) {
          dbUpdateRule(workspaceId, id, sanitizedData).catch((err) => {
            set({ rules: previousRules });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating automation rule" }));
          });
        }
      },

      deleteRule: (id, workspaceId?) => {
        const previousRules = get().rules;
        set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }));
        toast("Automation deleted", "info");

        if (workspaceId) {
          dbDeleteRule(workspaceId, id).catch((err) => {
            set({ rules: previousRules });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting automation rule" }));
          });
        }
      },

      toggleRule: (id, workspaceId?) => {
        set((s) => ({
          rules: s.rules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
          ),
        }));
        const rule = get().rules.find((r) => r.id === id);
        if (rule) toast(`Automation "${rule.name}" ${rule.enabled ? "enabled" : "disabled"}`);

        if (workspaceId && rule) {
          dbUpdateRule(workspaceId, id, { enabled: rule.enabled }).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "toggling automation rule" }));
          });
        }
      },

      addRecurringTemplate: (data, workspaceId?) => {
        const template: RecurringTaskTemplate = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ recurringTemplates: [...s.recurringTemplates, template] }));
        logActivity("create", "automations", `Created recurring template "${template.name}"`);
        toast(`Template "${template.name}" created`);

        if (workspaceId) {
          dbCreateTemplate(workspaceId, template).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving recurring template" }));
          });
        }
      },

      deleteRecurringTemplate: (id, workspaceId?) => {
        const template = get().recurringTemplates.find((t) => t.id === id);
        if (template?.isBuiltIn) {
          toast("Built-in templates cannot be deleted", "error");
          return;
        }
        const previousRecurringTemplates = get().recurringTemplates;
        set((s) => ({ recurringTemplates: s.recurringTemplates.filter((t) => t.id !== id) }));
        logActivity("delete", "automations", "Deleted recurring template");
        toast("Template deleted", "info");

        if (workspaceId) {
          dbDeleteTemplate(workspaceId, id).catch((err) => {
            set({ recurringTemplates: previousRecurringTemplates });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting recurring template" }));
          });
        }
      },

      createTaskFromTemplate: (templateId) => {
        const template = get().recurringTemplates.find((t) => t.id === templateId);
        if (!template) return;

        const dueDate = new Date();
        switch (template.frequency) {
          case "daily":
            dueDate.setDate(dueDate.getDate() + 1);
            break;
          case "weekly":
            dueDate.setDate(dueDate.getDate() + 7);
            break;
          case "biweekly":
            dueDate.setDate(dueDate.getDate() + 14);
            break;
          case "monthly":
            dueDate.setMonth(dueDate.getMonth() + 1);
            break;
          case "quarterly":
            dueDate.setMonth(dueDate.getMonth() + 3);
            break;
        }

        useRemindersStore.getState().addReminder({
          title: template.taskTitle,
          entityType: "job",
          entityId: templateId,
          dueDate: dueDate.toISOString(),
        });

        logActivity("create", "automations", `Created task from template "${template.name}"`);
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { rules, recurringTemplates } = get();
          await Promise.all([
            dbUpsertRules(workspaceId, rules),
            dbUpsertTemplates(workspaceId, recurringTemplates),
          ]);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing automations to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [ruleRows, templateRows] = await Promise.all([
            fetchAutomationRules(workspaceId),
            fetchRecurringTemplates(workspaceId),
          ]);

          const updates: Record<string, unknown> = {};

          if (ruleRows && ruleRows.length > 0) {
            updates.rules = ruleRows.map((row: Record<string, unknown>) =>
              mapRuleFromDB(row)
            );
          }

          if (templateRows && templateRows.length > 0) {
            updates.recurringTemplates = templateRows.map((row: Record<string, unknown>) =>
              mapTemplateFromDB(row)
            );
          }

          if (Object.keys(updates).length > 0) {
            set(updates as Partial<AutomationsStore>);
          }
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading automations from Supabase" }));
        }
      },
    }),
    {
      name: "magic-crm-automations",
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version === 0) {
          return {
            ...state,
            recurringTemplates: initBuiltInTemplates(),
          };
        }
        return state;
      },
    }
  )
);
