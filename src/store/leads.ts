import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Lead } from "@/types/models";
type LeadStage = string;
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { useClientsStore } from "./clients";
import {
  fetchLeads,
  dbCreateLead,
  dbUpdateLead,
  dbDeleteLead,
  dbUpsertLeads,
  mapLeadFromDB,
} from "@/lib/db/leads";

interface LeadsStore {
  leads: Lead[];
  addLead: (
    data: Omit<Lead, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => Lead;
  updateLead: (id: string, data: Partial<Lead>, workspaceId?: string) => void;
  deleteLead: (id: string, workspaceId?: string) => void;
  moveLead: (id: string, stage: LeadStage, workspaceId?: string) => void;
  convertToClient: (id: string, workspaceId?: string) => string | null;
  getLeadsByStage: (stage: LeadStage) => Lead[];

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useLeadsStore = create<LeadsStore>()(
  persist(
    (set, get) => ({
      leads: [],

      addLead: (data, workspaceId?) => {
        const lead: Lead = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ leads: [...s.leads, lead] }));
        logActivity("create", "leads", `New lead "${lead.name}"`);
        toast(`Created lead "${lead.name}"`);

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateLead(workspaceId, lead).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving lead" }));
          });
        }

        return lead;
      },

      updateLead: (id, data, workspaceId?) => {
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, ...updatedData } : l
          ),
        }));
        logActivity("update", "leads", "Updated lead");
        toast("Lead updated");

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateLead(workspaceId, id, updatedData).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving lead" }));
          });
        }
      },

      deleteLead: (id, workspaceId?) => {
        const lead = get().leads.find((l) => l.id === id);
        set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
        if (lead) {
          logActivity("delete", "leads", `Deleted lead "${lead.name}"`);
          toast(`Lead "${lead.name}" deleted`, "info");

          // Sync to Supabase if workspaceId available
          if (workspaceId) {
            dbDeleteLead(workspaceId, id).catch((err) => {
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting lead" }));
            });
          }
        }
      },

      moveLead: (id, stage, workspaceId?) => {
        const updatedData = { stage, updatedAt: new Date().toISOString() };
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, ...updatedData } : l
          ),
        }));
        const lead = get().leads.find((l) => l.id === id);
        if (lead) {
          logActivity("update", "leads", `Moved "${lead.name}" to ${stage}`);
          toast(`Moved "${lead.name}" to ${stage}`);
        }

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateLead(workspaceId, id, updatedData).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving lead" }));
          });
        }
      },

      convertToClient: (id, workspaceId?) => {
        const lead = get().leads.find((l) => l.id === id);
        if (!lead) return null;
        const client = useClientsStore.getState().addClient(
          {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            tags: [],
            notes: lead.notes,
            source: lead.source as "referral" | "website" | "social" | "other" | undefined,
            status: "active",
          },
          workspaceId
        );
        const updatedData = {
          stage: "won" as LeadStage,
          clientId: client.id,
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, ...updatedData } : l
          ),
        }));
        logActivity("convert", "leads", `Converted "${lead.name}" to client`);
        toast(`Converted "${lead.name}" to client`);

        // Sync the lead update to Supabase
        if (workspaceId) {
          dbUpdateLead(workspaceId, id, updatedData).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving lead" }));
          });
        }

        return client.id;
      },

      getLeadsByStage: (stage) => get().leads.filter((l) => l.stage === stage),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { leads } = get();
          await dbUpsertLeads(workspaceId, leads);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing leads" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchLeads(workspaceId);
          const mappedLeads = (rows ?? []).map((row: Record<string, unknown>) =>
            mapLeadFromDB(row)
          );
          set({ leads: mappedLeads });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing leads" }));
        }
      },
    }),
    { name: "magic-crm-leads" }
  )
);
