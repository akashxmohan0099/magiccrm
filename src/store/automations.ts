import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AutomationRule } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface AutomationsStore {
  rules: AutomationRule[];
  addRule: (data: Omit<AutomationRule, "id" | "createdAt">) => void;
  updateRule: (id: string, data: Partial<AutomationRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
}

export const useAutomationsStore = create<AutomationsStore>()(
  persist(
    (set, get) => ({
      rules: [],

      addRule: (data) => {
        const rule: AutomationRule = { ...data, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ rules: [...s.rules, rule] }));
        logActivity("create", "automations", `Created automation "${rule.name}"`);
        toast(`Created automation "${rule.name}"`);
      },

      updateRule: (id, data) => {
        set((s) => ({
          rules: s.rules.map((r) => (r.id === id ? { ...r, ...data } : r)),
        }));
      },

      deleteRule: (id) => {
        set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }));
        toast("Automation deleted", "info");
      },

      toggleRule: (id) => {
        set((s) => ({
          rules: s.rules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
          ),
        }));
        const rule = get().rules.find((r) => r.id === id);
        if (rule) toast(`Automation "${rule.name}" ${rule.enabled ? "enabled" : "disabled"}`);
      },
    }),
    { name: "magic-crm-automations" }
  )
);
