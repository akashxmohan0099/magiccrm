import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TeamMember, TeamShift, AvailabilitySlot } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchTeamMembers,
  fetchShifts,
  dbCreateMember,
  dbUpdateMember,
  dbDeleteMember,
  dbUpsertMembers,
  dbSetMemberAvailability,
  dbCreateShift,
  dbUpdateShift as dbUpdateShiftRow,
  dbDeleteShift as dbDeleteShiftRow,
  dbUpsertShifts,
  mapTeamMemberFromDB,
  mapShiftFromDB,
} from "@/lib/db/team";

interface TeamStore {
  members: TeamMember[];
  shifts: TeamShift[];
  addMember: (data: Omit<TeamMember, "id" | "createdAt" | "updatedAt">, workspaceId?: string) => TeamMember;
  updateMember: (id: string, data: Partial<TeamMember>, workspaceId?: string) => void;
  deleteMember: (id: string, workspaceId?: string) => void;
  setMemberAvailability: (memberId: string, availability: AvailabilitySlot[], workspaceId?: string) => void;
  addShift: (data: Omit<TeamShift, "id">, workspaceId?: string) => void;
  updateShift: (id: string, data: Partial<TeamShift>, workspaceId?: string) => void;
  deleteShift: (id: string, workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      members: [],
      shifts: [],

      addMember: (data, workspaceId?) => {
        const now = new Date().toISOString();
        const member: TeamMember = { ...data, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ members: [...s.members, member] }));
        logActivity("create", "team", `Added team member "${data.name}"`);
        toast(`${data.name} added to team`);

        if (workspaceId) {
          dbCreateMember(workspaceId, member).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving team member" }));
          });
        }

        return member;
      },

      updateMember: (id, data, workspaceId?) => {
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id ? { ...m, ...updatedData } : m
          ),
        }));
        logActivity("update", "team", "Updated team member");
        toast("Team member updated");

        if (workspaceId) {
          dbUpdateMember(workspaceId, id, updatedData).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating team member" }));
          });
        }
      },

      deleteMember: (id, workspaceId?) => {
        const member = get().members.find((m) => m.id === id);
        const removedShifts = get().shifts.filter((sh) => sh.memberId === id);
        set((s) => ({
          members: s.members.filter((m) => m.id !== id),
          shifts: s.shifts.filter((sh) => sh.memberId !== id),
        }));
        if (member) {
          logActivity("delete", "team", `Removed "${member.name}" from team`);
          toast(`"${member.name}" removed from team`, "info");

          if (workspaceId) {
            dbDeleteMember(workspaceId, id).catch((err) => {
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting team member" }));
            });
            // Cascade-delete associated shifts from DB
            for (const shift of removedShifts) {
              dbDeleteShiftRow(workspaceId, shift.id).catch((err) => {
                import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting team member shift (cascade)" }));
              });
            }
          }
        }
      },

      setMemberAvailability: (memberId, availability, workspaceId?) => {
        set((s) => ({
          members: s.members.map((m) =>
            m.id === memberId ? { ...m, availability, updatedAt: new Date().toISOString() } : m
          ),
        }));
        toast("Availability updated");

        if (workspaceId) {
          dbSetMemberAvailability(workspaceId, memberId, availability).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating team member availability" }));
          });
        }
      },

      addShift: (data, workspaceId?) => {
        const shift: TeamShift = { ...data, id: generateId() };
        set((s) => ({ shifts: [...s.shifts, shift] }));
        logActivity("create", "team", `Added shift for ${data.memberName}`);
        toast("Shift added");

        if (workspaceId) {
          dbCreateShift(workspaceId, shift).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving shift" }));
          });
        }
      },

      updateShift: (id, data, workspaceId?) => {
        set((s) => ({
          shifts: s.shifts.map((sh) => (sh.id === id ? { ...sh, ...data } : sh)),
        }));
        toast("Shift updated");

        if (workspaceId) {
          dbUpdateShiftRow(workspaceId, id, data).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating shift" }));
          });
        }
      },

      deleteShift: (id, workspaceId?) => {
        set((s) => ({ shifts: s.shifts.filter((sh) => sh.id !== id) }));
        toast("Shift removed", "info");

        if (workspaceId) {
          dbDeleteShiftRow(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting shift" }));
          });
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { members, shifts } = get();
          await Promise.all([
            dbUpsertMembers(workspaceId, members),
            dbUpsertShifts(workspaceId, shifts),
          ]);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing team data to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [memberRows, shiftRows] = await Promise.all([
            fetchTeamMembers(workspaceId),
            fetchShifts(workspaceId),
          ]);

          const mappedMembers = (memberRows ?? []).map((row: Record<string, unknown>) =>
            mapTeamMemberFromDB(row)
          );
          const mappedShifts = (shiftRows ?? []).map((row: Record<string, unknown>) =>
            mapShiftFromDB(row)
          );
          set({ members: mappedMembers, shifts: mappedShifts });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading team data from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-team" }
  )
);
