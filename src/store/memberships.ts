import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MembershipPlan, ClientMembership } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchMembershipPlans,
  fetchClientMemberships,
  dbCreateMembershipPlan,
  dbUpdateMembershipPlan,
  dbDeleteMembershipPlan,
  dbCreateClientMembership,
  dbUpdateClientMembership,
} from "@/lib/db/memberships";
import { surfaceDbError } from "./_db-error";

interface MembershipsStore {
  plans: MembershipPlan[];
  memberships: ClientMembership[];
  addPlan: (
    data: Omit<MembershipPlan, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string,
  ) => MembershipPlan;
  updatePlan: (id: string, data: Partial<MembershipPlan>, workspaceId?: string) => void;
  deletePlan: (id: string, workspaceId?: string) => void;
  addMembership: (
    data: Omit<ClientMembership, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string,
  ) => ClientMembership;
  updateMembership: (
    id: string,
    data: Partial<ClientMembership>,
    workspaceId?: string,
  ) => void;
  recordSession: (membershipId: string, workspaceId?: string) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useMembershipsStore = create<MembershipsStore>()(
  persist(
    (set, get) => ({
      plans: [],
      memberships: [],

      addPlan: (data, workspaceId) => {
        const now = new Date().toISOString();
        const plan: MembershipPlan = {
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        set((s) => ({ plans: [plan, ...s.plans] }));
        toast(`Plan "${plan.name}" created`);
        if (workspaceId) {
          dbCreateMembershipPlan(
            workspaceId,
            plan as unknown as Record<string, unknown>,
          ).catch(surfaceDbError("memberships"));
        }
        return plan;
      },

      updatePlan: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: now } : p,
          ),
        }));
        if (workspaceId) {
          dbUpdateMembershipPlan(workspaceId, id, data as Record<string, unknown>).catch(
            surfaceDbError("memberships"),
          );
        }
      },

      deletePlan: (id, workspaceId) => {
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }));
        toast("Plan deleted");
        if (workspaceId) {
          dbDeleteMembershipPlan(workspaceId, id).catch(surfaceDbError("memberships"));
        }
      },

      addMembership: (data, workspaceId) => {
        const now = new Date().toISOString();
        const membership: ClientMembership = {
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        set((s) => ({ memberships: [membership, ...s.memberships] }));
        toast("Membership added");
        if (workspaceId) {
          dbCreateClientMembership(
            workspaceId,
            membership as unknown as Record<string, unknown>,
          ).catch(surfaceDbError("memberships"));
        }
        return membership;
      },

      updateMembership: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          memberships: s.memberships.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: now } : m,
          ),
        }));
        if (workspaceId) {
          dbUpdateClientMembership(workspaceId, id, data as Record<string, unknown>).catch(
            surfaceDbError("memberships"),
          );
        }
      },

      recordSession: (membershipId, workspaceId) => {
        const membership = get().memberships.find((m) => m.id === membershipId);
        if (!membership) return;
        const now = new Date().toISOString();
        const next = membership.sessionsUsed + 1;
        set((s) => ({
          memberships: s.memberships.map((m) =>
            m.id === membershipId ? { ...m, sessionsUsed: next, updatedAt: now } : m,
          ),
        }));
        toast("Session recorded");
        if (workspaceId) {
          dbUpdateClientMembership(workspaceId, membershipId, { sessionsUsed: next }).catch(
            surfaceDbError("memberships"),
          );
        }
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const [plans, memberships] = await Promise.all([
            fetchMembershipPlans(workspaceId).catch(() => [] as MembershipPlan[]),
            fetchClientMemberships(workspaceId).catch(() => [] as ClientMembership[]),
          ]);
          set({ plans, memberships });
        } catch (err) {
          console.debug("[store] memberships load skipped:", err);
        }
      },
    }),
    { name: "magic-crm-memberships", version: 2 },
  ),
);
