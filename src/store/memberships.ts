import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MembershipPlan, Membership } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateMembershipPlan, validateMembership, sanitize } from "@/lib/validation";
import {
  fetchMembershipPlans, dbCreatePlan, dbUpdatePlan, dbDeletePlan, dbUpsertPlans, mapPlanFromDB,
  fetchMemberships, dbCreateMembership, dbUpdateMembership, dbDeleteMembership, dbUpsertMemberships, mapMembershipFromDB,
} from "@/lib/db/memberships";

interface MembershipsStore {
  plans: MembershipPlan[];
  memberships: Membership[];
  addPlan: (data: Omit<MembershipPlan, "id" | "createdAt">, workspaceId?: string) => MembershipPlan | undefined;
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
        const validation = validateMembershipPlan(data);
        if (validation.errors.length > 0) {
          toast(validation.errors[0], "error");
          return null as any;
        }

        const sanitizedData = {
          ...data,
          name: sanitize(data.name),
          description: data.description ? sanitize(data.description) : "",
        };
        const plan: MembershipPlan = { ...sanitizedData, id: generateId(), createdAt: new Date().toISOString() };
        const previousPlans = get().plans;
        set((s) => ({ plans: [...s.plans, plan] }));
        logActivity("create", "memberships", `Created plan "${sanitizedData.name}"`);
        toast(`Plan "${sanitizedData.name}" created`);

        if (workspaceId) {
          dbCreatePlan(workspaceId, plan).catch((err) => {
            set({ plans: previousPlans });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving membership plan" }));
          });
        }
        return plan;
      },
      updatePlan: (id, data, workspaceId?) => {
        const plan = get().plans.find((p) => p.id === id);
        if (plan && (data.name || data.description)) {
          const validation = validateMembershipPlan({ ...plan, ...data } as any);
          if (validation.errors.length > 0) {
            toast(validation.errors[0], "error");
            return;
          }
        }

        const sanitizedData: Partial<MembershipPlan> = {
          ...data,
        };
        if (data.name) {
          sanitizedData.name = sanitize(data.name);
        }
        if (data.description) {
          sanitizedData.description = sanitize(data.description);
        }
        const previousPlans = get().plans;
        set((s) => ({ plans: s.plans.map((p) => p.id === id ? { ...p, ...sanitizedData } : p) }));
        logActivity("update", "memberships", "Updated membership plan");
        toast("Membership plan updated");

        if (workspaceId) {
          dbUpdatePlan(workspaceId, id, sanitizedData).catch((err) => {
            set({ plans: previousPlans });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating membership plan" }));
          });
        }
      },
      deletePlan: (id, workspaceId?) => {
        const plan = get().plans.find((p) => p.id === id);
        const previousPlans = get().plans;
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }));
        if (plan) {
          logActivity("delete", "memberships", `Removed plan "${plan.name}"`);
          toast(`Plan "${plan.name}" deleted`, "info");
        }

        if (workspaceId) {
          dbDeletePlan(workspaceId, id).catch((err) => {
            set({ plans: previousPlans });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting membership plan" }));
          });
        }
      },
      addMembership: (data, workspaceId?) => {
        const validation = validateMembership(data);
        if (validation.errors.length > 0) {
          toast(validation.errors[0], "error");
          return null as any;
        }

        const sanitizedData = {
          ...data,
          clientName: sanitize(data.clientName),
          planName: sanitize(data.planName),
        };
        const now = new Date().toISOString();
        const membership: Membership = { ...sanitizedData, id: generateId(), createdAt: now, updatedAt: now };
        const previousMemberships = get().memberships;
        set((s) => ({ memberships: [...s.memberships, membership] }));
        logActivity("create", "memberships", `${sanitizedData.clientName} joined "${sanitizedData.planName}"`);
        toast(`${sanitizedData.clientName} added to ${sanitizedData.planName}`);

        if (workspaceId) {
          dbCreateMembership(workspaceId, membership).catch((err) => {
            set({ memberships: previousMemberships });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving membership" }));
          });
        }
        return membership;
      },
      updateMembership: (id, data, workspaceId?) => {
        const membership = get().memberships.find((m) => m.id === id);
        if (membership && (data.clientName || data.planName)) {
          const validation = validateMembership({ ...membership, ...data } as any);
          if (validation.errors.length > 0) {
            toast(validation.errors[0], "error");
            return;
          }
        }

        const sanitizedData: Partial<Membership> = {
          ...data,
        };
        if (data.clientName) {
          sanitizedData.clientName = sanitize(data.clientName);
        }
        if (data.planName) {
          sanitizedData.planName = sanitize(data.planName);
        }
        const updatedAt = new Date().toISOString();
        const previousMemberships = get().memberships;
        set((s) => ({ memberships: s.memberships.map((m) => m.id === id ? { ...m, ...sanitizedData, updatedAt } : m) }));
        logActivity("update", "memberships", "Updated membership");
        toast("Membership updated");

        if (workspaceId) {
          dbUpdateMembership(workspaceId, id, sanitizedData).catch((err) => {
            set({ memberships: previousMemberships });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating membership" }));
          });
        }
      },
      deleteMembership: (id, workspaceId?) => {
        const m = get().memberships.find((m) => m.id === id);
        const previousMemberships = get().memberships;
        set((s) => ({ memberships: s.memberships.filter((m) => m.id !== id) }));
        if (m) {
          logActivity("delete", "memberships", `Removed ${m.clientName} from ${m.planName}`);
          toast(`${m.clientName} removed from ${m.planName}`, "info");
        }

        if (workspaceId) {
          dbDeleteMembership(workspaceId, id).catch((err) => {
            set({ memberships: previousMemberships });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting membership" }));
          });
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
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing memberships to Supabase" }));
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
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading memberships from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-memberships" }
  )
);
