import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MembershipPlan, Membership } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface MembershipsStore {
  plans: MembershipPlan[];
  memberships: Membership[];
  addPlan: (data: Omit<MembershipPlan, "id" | "createdAt">) => MembershipPlan;
  updatePlan: (id: string, data: Partial<MembershipPlan>) => void;
  deletePlan: (id: string) => void;
  addMembership: (data: Omit<Membership, "id" | "createdAt" | "updatedAt">) => Membership;
  updateMembership: (id: string, data: Partial<Membership>) => void;
  deleteMembership: (id: string) => void;
}

export const useMembershipsStore = create<MembershipsStore>()(
  persist(
    (set, get) => ({
      plans: [],
      memberships: [],
      addPlan: (data) => {
        const plan: MembershipPlan = { ...data, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ plans: [...s.plans, plan] }));
        logActivity("create", "memberships", `Created plan "${data.name}"`);
        toast(`Plan "${data.name}" created`);
        return plan;
      },
      updatePlan: (id, data) => {
        set((s) => ({ plans: s.plans.map((p) => p.id === id ? { ...p, ...data } : p) }));
      },
      deletePlan: (id) => {
        const plan = get().plans.find((p) => p.id === id);
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }));
        if (plan) logActivity("delete", "memberships", `Removed plan "${plan.name}"`);
      },
      addMembership: (data) => {
        const now = new Date().toISOString();
        const membership: Membership = { ...data, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ memberships: [...s.memberships, membership] }));
        logActivity("create", "memberships", `${data.clientName} joined "${data.planName}"`);
        toast(`${data.clientName} added to ${data.planName}`);
        return membership;
      },
      updateMembership: (id, data) => {
        set((s) => ({ memberships: s.memberships.map((m) => m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m) }));
      },
      deleteMembership: (id) => {
        const m = get().memberships.find((m) => m.id === id);
        set((s) => ({ memberships: s.memberships.filter((m) => m.id !== id) }));
        if (m) logActivity("delete", "memberships", `Removed ${m.clientName} from ${m.planName}`);
      },
    }),
    { name: "magic-crm-memberships" }
  )
);
