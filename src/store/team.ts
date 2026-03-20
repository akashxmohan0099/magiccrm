import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TeamMember } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface TeamStore {
  members: TeamMember[];
  addMember: (data: Omit<TeamMember, "id" | "createdAt" | "updatedAt">) => TeamMember;
  updateMember: (id: string, data: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      members: [],

      addMember: (data) => {
        const now = new Date().toISOString();
        const member: TeamMember = { ...data, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ members: [...s.members, member] }));
        logActivity("create", "team", `Added team member "${data.name}"`);
        toast(`${data.name} added to team`);
        return member;
      },

      updateMember: (id, data) => {
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
          ),
        }));
      },

      deleteMember: (id) => {
        const member = get().members.find((m) => m.id === id);
        set((s) => ({ members: s.members.filter((m) => m.id !== id) }));
        if (member) {
          logActivity("delete", "team", `Removed "${member.name}" from team`);
        }
      },
    }),
    { name: "magic-crm-team" }
  )
);
