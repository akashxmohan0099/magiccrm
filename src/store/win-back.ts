import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WinBackRule, LapsedClient } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface WinBackStore {
  rules: WinBackRule[];
  lapsedClients: LapsedClient[];
  addRule: (data: Omit<WinBackRule, "id" | "createdAt">) => WinBackRule;
  updateRule: (id: string, data: Partial<WinBackRule>) => void;
  deleteRule: (id: string) => void;
  addLapsedClient: (data: Omit<LapsedClient, "id" | "detectedAt">) => void;
  updateLapsedStatus: (id: string, status: LapsedClient["status"]) => void;
  dismissLapsed: (id: string) => void;
}

export const useWinBackStore = create<WinBackStore>()(
  persist(
    (set, get) => ({
      rules: [],
      lapsedClients: [],
      addRule: (data) => {
        const rule: WinBackRule = { ...data, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ rules: [...s.rules, rule] }));
        logActivity("create", "win-back", `Created rule "${data.name}"`);
        toast(`Rule "${data.name}" created`);
        return rule;
      },
      updateRule: (id, data) => {
        set((s) => ({ rules: s.rules.map((r) => r.id === id ? { ...r, ...data } : r) }));
      },
      deleteRule: (id) => {
        const rule = get().rules.find((r) => r.id === id);
        set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }));
        if (rule) logActivity("delete", "win-back", `Removed rule "${rule.name}"`);
      },
      addLapsedClient: (data) => {
        const entry: LapsedClient = { ...data, id: generateId(), detectedAt: new Date().toISOString() };
        set((s) => ({ lapsedClients: [...s.lapsedClients, entry] }));
      },
      updateLapsedStatus: (id, status) => {
        set((s) => ({ lapsedClients: s.lapsedClients.map((c) => c.id === id ? { ...c, status } : c) }));
      },
      dismissLapsed: (id) => {
        set((s) => ({ lapsedClients: s.lapsedClients.map((c) => c.id === id ? { ...c, status: "dismissed" as const } : c) }));
      },
    }),
    { name: "magic-crm-win-back" }
  )
);
