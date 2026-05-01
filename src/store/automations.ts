import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AutomationRule, AutomationType } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchAutomationRules,
  dbCreateAutomationRule,
  dbUpdateAutomationRule,
} from "@/lib/db/automations";
import { surfaceDbError } from "./_db-error";

const DEFAULT_RULES: {
  type: AutomationType;
  messageTemplate: string;
  timingValue?: number;
  timingUnit?: "minutes" | "hours" | "days";
}[] = [
  {
    type: "booking_confirmation",
    messageTemplate:
      "Hi {clientName}, your appointment on {date} at {time} has been confirmed!",
  },
  {
    type: "appointment_reminder",
    messageTemplate:
      "Reminder: You have an appointment tomorrow at {time}. See you then!",
    timingValue: 24,
    timingUnit: "hours",
  },
  {
    type: "post_service_followup",
    messageTemplate:
      "Thanks for visiting us, {clientName}! We hope you enjoyed your experience.",
    timingValue: 2,
    timingUnit: "hours",
  },
  {
    type: "review_request",
    messageTemplate:
      "Hi {clientName}, we'd love to hear your feedback! Please leave us a review.",
    timingValue: 1,
    timingUnit: "days",
  },
  {
    type: "rebooking_nudge",
    messageTemplate:
      "Hi {clientName}, it's been {daysSince} days since your last visit to {businessName}. Ready to book your next appointment?",
    timingValue: 30,
    timingUnit: "days",
  },
  {
    type: "no_show_followup",
    messageTemplate:
      "Hi {clientName}, we missed you today. Would you like to reschedule?",
    timingValue: 1,
    timingUnit: "hours",
  },
  {
    type: "invoice_auto_send",
    messageTemplate:
      "Hi {clientName}, your invoice #{invoiceNumber} is ready. Total: {total}.",
  },
  {
    type: "cancellation_confirmation",
    messageTemplate:
      "Your appointment on {date} has been cancelled. Contact us to reschedule anytime.",
  },
];

interface AutomationsStore {
  rules: AutomationRule[];
  updateRule: (
    id: string,
    data: Partial<AutomationRule>,
    workspaceId?: string
  ) => void;
  toggleRule: (id: string, workspaceId?: string) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
  initDefaults: (workspaceId?: string) => void;
}

export const useAutomationsStore = create<AutomationsStore>()(
  persist(
    (set, get) => ({
      rules: [],

      updateRule: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          rules: s.rules.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: now } : r
          ),
        }));
        toast("Automation updated");
        if (workspaceId) {
          dbUpdateAutomationRule(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(surfaceDbError("automations"));
        }
      },

      toggleRule: (id, workspaceId) => {
        const rule = get().rules.find((r) => r.id === id);
        if (!rule) return;
        const now = new Date().toISOString();
        const newEnabled = !rule.enabled;
        set((s) => ({
          rules: s.rules.map((r) =>
            r.id === id ? { ...r, enabled: newEnabled, updatedAt: now } : r
          ),
        }));
        toast(
          `Automation ${newEnabled ? "enabled" : "disabled"}`
        );
        if (workspaceId) {
          dbUpdateAutomationRule(workspaceId, id, {
            enabled: newEnabled,
          } as unknown as Record<string, unknown>).catch(surfaceDbError("automations"));
        }
      },

      initDefaults: (workspaceId) => {
        const existing = get().rules;
        const existingTypes = new Set(existing.map((r) => r.type));
        const now = new Date().toISOString();

        const newRules: AutomationRule[] = [];
        for (const def of DEFAULT_RULES) {
          if (!existingTypes.has(def.type)) {
            const rule: AutomationRule = {
              id: generateId(),
              workspaceId: workspaceId || "",
              type: def.type,
              enabled: false,
              channel: "email",
              messageTemplate: def.messageTemplate,
              timingValue: def.timingValue,
              timingUnit: def.timingUnit,
              createdAt: now,
              updatedAt: now,
            };
            newRules.push(rule);
          }
        }

        if (newRules.length > 0) {
          set((s) => ({ rules: [...s.rules, ...newRules] }));
          if (workspaceId) {
            for (const rule of newRules) {
              dbCreateAutomationRule(
                workspaceId,
                rule as unknown as Record<string, unknown>
              ).catch(surfaceDbError("automations"));
            }
          }
        }
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const rules = await fetchAutomationRules(workspaceId);
          set({ rules });
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-automations", version: 2 }
  )
);
