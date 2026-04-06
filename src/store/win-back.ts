import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WinBackRule, LapsedClient } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateWinBackRule, sanitize } from "@/lib/validation";
import {
  fetchWinBackRules, dbCreateWinBackRule, dbUpdateWinBackRule, dbDeleteWinBackRule, dbUpsertWinBackRules, mapWinBackRuleFromDB,
  fetchLapsedClients, dbCreateLapsedClient, dbUpdateLapsedClient, dbUpsertLapsedClients, mapLapsedClientFromDB,
} from "@/lib/db/win-back";

interface WinBackStore {
  rules: WinBackRule[];
  lapsedClients: LapsedClient[];
  addRule: (data: Omit<WinBackRule, "id" | "createdAt">, workspaceId?: string) => WinBackRule;
  updateRule: (id: string, data: Partial<WinBackRule>, workspaceId?: string) => void;
  deleteRule: (id: string, workspaceId?: string) => void;
  addLapsedClient: (data: Omit<LapsedClient, "id" | "detectedAt">, workspaceId?: string) => void;
  updateLapsedStatus: (id: string, status: LapsedClient["status"], workspaceId?: string) => void;
  dismissLapsed: (id: string, workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useWinBackStore = create<WinBackStore>()(
  persist(
    (set, get) => ({
      rules: [],
      lapsedClients: [],
      addRule: (data, workspaceId?) => {
        // Validate input
        const validation = validateWinBackRule(data);
        if (!validation.valid) {
          toast(validation.errors[0], "error");
          return {} as WinBackRule;
        }

        // Sanitize string fields
        const sanitizedData = {
          ...data,
          name: sanitize(data.name),
          messageTemplate: sanitize(data.messageTemplate),
        };

        const rule: WinBackRule = { ...sanitizedData, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ rules: [...s.rules, rule] }));
        logActivity("create", "win-back", `Created rule "${sanitizedData.name}"`);
        toast(`Rule "${sanitizedData.name}" created`);

        if (workspaceId) {
          dbCreateWinBackRule(workspaceId, rule).catch((err) => {
            set((s) => ({ rules: s.rules.filter((r) => r.id !== rule.id) }));
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving win-back rule" }));
          });
        }
        return rule;
      },
      updateRule: (id, data, workspaceId?) => {
        // Capture previous state for rollback
        const previousRules = get().rules;

        // Sanitize string fields if they are being updated
        const sanitizedData: Partial<WinBackRule> = { ...data };
        if (data.name) {
          sanitizedData.name = sanitize(data.name);
        }
        if (data.messageTemplate) {
          sanitizedData.messageTemplate = sanitize(data.messageTemplate);
        }

        set((s) => ({ rules: s.rules.map((r) => r.id === id ? { ...r, ...sanitizedData } : r) }));
        logActivity("update", "win-back", "Updated win-back rule");
        toast("Win-back rule updated");

        if (workspaceId) {
          dbUpdateWinBackRule(workspaceId, id, sanitizedData).catch((err) => {
            set({ rules: previousRules });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating win-back rule" }));
          });
        }
      },
      deleteRule: (id, workspaceId?) => {
        // Capture previous state for rollback
        const previousRules = get().rules;
        const rule = previousRules.find((r) => r.id === id);
        set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }));
        if (rule) {
          logActivity("delete", "win-back", `Removed rule "${rule.name}"`);
          toast(`Rule "${rule.name}" deleted`, "info");
        }

        if (workspaceId) {
          dbDeleteWinBackRule(workspaceId, id).catch((err) => {
            set({ rules: previousRules });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting win-back rule" }));
          });
        }
      },
      addLapsedClient: (data, workspaceId?) => {
        const entry: LapsedClient = { ...data, id: generateId(), detectedAt: new Date().toISOString() };
        set((s) => ({ lapsedClients: [...s.lapsedClients, entry] }));
        toast(`Lapsed client "${data.clientName}" detected`, "info");

        if (workspaceId) {
          dbCreateLapsedClient(workspaceId, entry).catch((err) => {
            set((s) => ({ lapsedClients: s.lapsedClients.filter((c) => c.id !== entry.id) }));
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving lapsed client" }));
          });
        }
      },
      updateLapsedStatus: (id, status, workspaceId?) => {
        // Capture previous state for rollback
        const previousClients = get().lapsedClients;
        set((s) => ({ lapsedClients: s.lapsedClients.map((c) => c.id === id ? { ...c, status } : c) }));

        if (workspaceId) {
          dbUpdateLapsedClient(workspaceId, id, status).catch((err) => {
            set({ lapsedClients: previousClients });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating lapsed client status" }));
          });
        }
      },
      dismissLapsed: (id, workspaceId?) => {
        // Capture previous state for rollback
        const previousClients = get().lapsedClients;
        set((s) => ({ lapsedClients: s.lapsedClients.map((c) => c.id === id ? { ...c, status: "dismissed" as const } : c) }));

        if (workspaceId) {
          dbUpdateLapsedClient(workspaceId, id, "dismissed").catch((err) => {
            set({ lapsedClients: previousClients });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "dismissing lapsed client" }));
          });
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { rules, lapsedClients } = get();
          await Promise.all([
            dbUpsertWinBackRules(workspaceId, rules),
            dbUpsertLapsedClients(workspaceId, lapsedClients),
          ]);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing win-back data to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [ruleRows, lapsedRows] = await Promise.all([
            fetchWinBackRules(workspaceId),
            fetchLapsedClients(workspaceId),
          ]);

          const updates: Record<string, unknown> = {};

          if (ruleRows && ruleRows.length > 0) {
            updates.rules = ruleRows.map((r: Record<string, unknown>) => mapWinBackRuleFromDB(r));
          }
          if (lapsedRows && lapsedRows.length > 0) {
            updates.lapsedClients = lapsedRows.map((r: Record<string, unknown>) => mapLapsedClientFromDB(r));
          }

          if (Object.keys(updates).length > 0) {
            set(updates as Partial<WinBackStore>);
          }
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading win-back data from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-win-back" }
  )
);
