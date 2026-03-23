import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WinBackRule, LapsedClient } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
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
        const rule: WinBackRule = { ...data, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ rules: [...s.rules, rule] }));
        logActivity("create", "win-back", `Created rule "${data.name}"`);
        toast(`Rule "${data.name}" created`);

        if (workspaceId) {
          dbCreateWinBackRule(workspaceId, rule).catch((err) =>
            console.error("[win-back] dbCreateWinBackRule failed:", err)
          );
        }
        return rule;
      },
      updateRule: (id, data, workspaceId?) => {
        set((s) => ({ rules: s.rules.map((r) => r.id === id ? { ...r, ...data } : r) }));
        logActivity("update", "win-back", "Updated win-back rule");
        toast("Win-back rule updated");

        if (workspaceId) {
          dbUpdateWinBackRule(workspaceId, id, data).catch((err) =>
            console.error("[win-back] dbUpdateWinBackRule failed:", err)
          );
        }
      },
      deleteRule: (id, workspaceId?) => {
        const rule = get().rules.find((r) => r.id === id);
        set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }));
        if (rule) {
          logActivity("delete", "win-back", `Removed rule "${rule.name}"`);
          toast(`Rule "${rule.name}" deleted`, "info");
        }

        if (workspaceId) {
          dbDeleteWinBackRule(workspaceId, id).catch((err) =>
            console.error("[win-back] dbDeleteWinBackRule failed:", err)
          );
        }
      },
      addLapsedClient: (data, workspaceId?) => {
        const entry: LapsedClient = { ...data, id: generateId(), detectedAt: new Date().toISOString() };
        set((s) => ({ lapsedClients: [...s.lapsedClients, entry] }));
        toast(`Lapsed client "${data.clientName}" detected`, "info");

        if (workspaceId) {
          dbCreateLapsedClient(workspaceId, entry).catch((err) =>
            console.error("[win-back] dbCreateLapsedClient failed:", err)
          );
        }
      },
      updateLapsedStatus: (id, status, workspaceId?) => {
        set((s) => ({ lapsedClients: s.lapsedClients.map((c) => c.id === id ? { ...c, status } : c) }));

        if (workspaceId) {
          dbUpdateLapsedClient(workspaceId, id, status).catch((err) =>
            console.error("[win-back] dbUpdateLapsedClient failed:", err)
          );
        }
      },
      dismissLapsed: (id, workspaceId?) => {
        set((s) => ({ lapsedClients: s.lapsedClients.map((c) => c.id === id ? { ...c, status: "dismissed" as const } : c) }));

        if (workspaceId) {
          dbUpdateLapsedClient(workspaceId, id, "dismissed").catch((err) =>
            console.error("[win-back] dbUpdateLapsedClient failed:", err)
          );
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
          console.error("[win-back] syncToSupabase failed:", err);
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
          console.error("[win-back] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-win-back" }
  )
);
