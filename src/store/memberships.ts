import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MembershipPlan, ClientMembership } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";

interface MembershipsStore {
  plans: MembershipPlan[];
  memberships: ClientMembership[];
  addPlan: (data: Omit<MembershipPlan, "id" | "createdAt" | "updatedAt">) => MembershipPlan;
  updatePlan: (id: string, data: Partial<MembershipPlan>) => void;
  deletePlan: (id: string) => void;
  addMembership: (data: Omit<ClientMembership, "id" | "createdAt" | "updatedAt">) => ClientMembership;
  updateMembership: (id: string, data: Partial<ClientMembership>) => void;
  recordSession: (membershipId: string) => void;
}

export const useMembershipsStore = create<MembershipsStore>()(
  persist(
    (set, get) => ({
      plans: [],
      memberships: [],

      addPlan: (data) => {
        const now = new Date().toISOString();
        const plan: MembershipPlan = {
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        set((s) => ({ plans: [plan, ...s.plans] }));
        toast(`Plan "${plan.name}" created`);
        return plan;
      },

      updatePlan: (id, data) => {
        const now = new Date().toISOString();
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: now } : p
          ),
        }));
      },

      deletePlan: (id) => {
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }));
        toast("Plan deleted");
      },

      addMembership: (data) => {
        const now = new Date().toISOString();
        const membership: ClientMembership = {
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        set((s) => ({ memberships: [membership, ...s.memberships] }));
        toast("Membership added");
        return membership;
      },

      updateMembership: (id, data) => {
        const now = new Date().toISOString();
        set((s) => ({
          memberships: s.memberships.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: now } : m
          ),
        }));
      },

      recordSession: (membershipId) => {
        const membership = get().memberships.find((m) => m.id === membershipId);
        if (!membership) return;
        const now = new Date().toISOString();
        set((s) => ({
          memberships: s.memberships.map((m) =>
            m.id === membershipId
              ? { ...m, sessionsUsed: m.sessionsUsed + 1, updatedAt: now }
              : m
          ),
        }));
        toast("Session recorded");
      },
    }),
    { name: "magic-crm-memberships", version: 1 }
  )
);
