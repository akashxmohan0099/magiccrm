import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MembershipPlan, Membership } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchMembershipPlans, dbCreatePlan, dbUpdatePlan, dbDeletePlan, dbUpsertPlans, mapPlanFromDB,
  fetchMemberships, dbCreateMembership, dbUpdateMembership, dbDeleteMembership, dbUpsertMemberships, mapMembershipFromDB,
} from "@/lib/db/memberships";

interface MembershipsStore {
  plans: MembershipPlan[];
  memberships: Membership[];
  addPlan: (data: Omit<MembershipPlan, "id" | "createdAt">, workspaceId?: string) => MembershipPlan;
  updatePlan: (id: string, data: Partial<MembershipPlan>, workspaceId?: string) => void;
  deletePlan: (id: string, workspaceId?: string) => void;
  addMembership: (data: Omit<Membership, "id" | "createdAt" | "updatedAt">, workspaceId?: string) => Membership;
  updateMembership: (id: string, data: Partial<Membership>, workspaceId?: string) => void;
  deleteMembership: (id: string, workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useMembershipsStore = create<MembershipsStore>()(
  persist(
    (set, get) => ({
      plans: [],
      memberships: [],
      addPlan: (data, workspaceId?) => {
        const plan: MembershipPlan = { ...data, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ plans: [...s.plans, plan] }));
        logActivity("create", "memberships", `Created plan "${data.name}"`);
        toast(`Plan "${data.name}" created`);

        if (workspaceId) {
          dbCreatePlan(workspaceId, plan).catch((err) =>
            console.error("[memberships] dbCreatePlan failed:", err)
          );
        }
        return plan;
      },
      updatePlan: (id, data, workspaceId?) => {
        set((s) => ({ plans: s.plans.map((p) => p.id === id ? { ...p, ...data } : p) }));
        logActivity("update", "memberships", "Updated membership plan");
        toast("Membership plan updated");

        if (workspaceId) {
          dbUpdatePlan(workspaceId, id, data).catch((err) =>
            console.error("[memberships] dbUpdatePlan failed:", err)
          );
        }
      },
      deletePlan: (id, workspaceId?) => {
        const plan = get().plans.find((p) => p.id === id);
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }));
        if (plan) {
          logActivity("delete", "memberships", `Removed plan "${plan.name}"`);
          toast(`Plan "${plan.name}" deleted`, "info");
        }

        if (workspaceId) {
          dbDeletePlan(workspaceId, id).catch((err) =>
            console.error("[memberships] dbDeletePlan failed:", err)
          );
        }
      },
      addMembership: (data, workspaceId?) => {
        const now = new Date().toISOString();
        const membership: Membership = { ...data, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ memberships: [...s.memberships, membership] }));
        logActivity("create", "memberships", `${data.clientName} joined "${data.planName}"`);
        toast(`${data.clientName} added to ${data.planName}`);

        if (workspaceId) {
          dbCreateMembership(workspaceId, membership).catch((err) =>
            console.error("[memberships] dbCreateMembership failed:", err)
          );
        }
        return membership;
      },
      updateMembership: (id, data, workspaceId?) => {
        const updatedAt = new Date().toISOString();
        set((s) => ({ memberships: s.memberships.map((m) => m.id === id ? { ...m, ...data, updatedAt } : m) }));
        logActivity("update", "memberships", "Updated membership");
        toast("Membership updated");

        if (workspaceId) {
          dbUpdateMembership(workspaceId, id, data).catch((err) =>
            console.error("[memberships] dbUpdateMembership failed:", err)
          );
        }
      },
      deleteMembership: (id, workspaceId?) => {
        const m = get().memberships.find((m) => m.id === id);
        set((s) => ({ memberships: s.memberships.filter((m) => m.id !== id) }));
        if (m) {
          logActivity("delete", "memberships", `Removed ${m.clientName} from ${m.planName}`);
          toast(`${m.clientName} removed from ${m.planName}`, "info");
        }

        if (workspaceId) {
          dbDeleteMembership(workspaceId, id).catch((err) =>
            console.error("[memberships] dbDeleteMembership failed:", err)
          );
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { plans, memberships } = get();
          await Promise.all([
            dbUpsertPlans(workspaceId, plans),
            dbUpsertMemberships(workspaceId, memberships),
          ]);
        } catch (err) {
          console.error("[memberships] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [planRows, membershipRows] = await Promise.all([
            fetchMembershipPlans(workspaceId),
            fetchMemberships(workspaceId),
          ]);

          const updates: Record<string, unknown> = {};

          if (planRows && planRows.length > 0) {
            updates.plans = planRows.map((r: Record<string, unknown>) => mapPlanFromDB(r));
          }
          if (membershipRows && membershipRows.length > 0) {
            updates.memberships = membershipRows.map((r: Record<string, unknown>) => mapMembershipFromDB(r));
          }

          if (Object.keys(updates).length > 0) {
            set(updates as Partial<MembershipsStore>);
          }
        } catch (err) {
          console.error("[memberships] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-memberships" }
  )
);
