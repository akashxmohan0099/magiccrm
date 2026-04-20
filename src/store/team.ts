import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TeamMember } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchTeamMembers,
  dbCreateTeamMember,
  dbUpdateTeamMember,
  dbDeleteTeamMember,
} from "@/lib/db/team";

interface TeamStore {
  members: TeamMember[];
  addMember: (
    data: Omit<TeamMember, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => TeamMember;
  updateMember: (
    id: string,
    data: Partial<TeamMember>,
    workspaceId?: string
  ) => void;
  deleteMember: (id: string, workspaceId?: string) => void;
  getMember: (id: string) => TeamMember | undefined;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      members: [],

      addMember: (data, workspaceId) => {
        const now = new Date().toISOString();
        const member: TeamMember = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ members: [member, ...s.members] }));
        toast("Team member added");
        if (workspaceId) {
          dbCreateTeamMember(
            workspaceId,
            member as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        return member;
      },

      updateMember: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: now } : m
          ),
        }));
        if (workspaceId) {
          dbUpdateTeamMember(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(console.error);
        }
      },

      deleteMember: (id, workspaceId) => {
        set((s) => ({ members: s.members.filter((m) => m.id !== id) }));
        toast("Team member removed");
        if (workspaceId) {
          dbDeleteTeamMember(workspaceId, id).catch(console.error);
        }
      },

      getMember: (id) => get().members.find((m) => m.id === id),

      loadFromSupabase: async (workspaceId) => {
        try {
          const members = await fetchTeamMembers(workspaceId);
          set({ members });
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-team", version: 2 }
  )
);
