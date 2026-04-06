import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Lead } from "@/types/models";
type LeadStage = string;
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateLead, sanitize, sanitizeEmail } from "@/lib/validation";
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
        // Validate
        const validation = validateLead({ name: data.name, email: data.email, source: data.source });
        if (!validation.valid) {
          toast(validation.errors[0], "error");
          return { id: "", name: data.name || "", createdAt: "", updatedAt: "" } as Lead;
        }

        const lead: Lead = {
          ...data,
          id: generateId(),
          name: sanitize(data.name, 200),
          email: sanitizeEmail(data.email),
          phone: sanitize(data.phone, 30),
          company: sanitize(data.company, 200),
          notes: sanitize(data.notes, 5000),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const prevLeads = get().leads;
        set((s) => ({ leads: [...s.leads, lead] }));
        logActivity("create", "leads", `New lead "${lead.name}"`);
        toast(`Created lead "${lead.name}"`);

        if (workspaceId) {
          dbCreateLead(workspaceId, lead).catch((err) => {
            set({ leads: prevLeads }); // rollback
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving lead" }));
          });
        }

        return lead;
      },

      updateLead: (id, data, workspaceId?) => {
        // Validate name/email if being updated
        if (data.name !== undefined || data.email !== undefined) {
          const existing = get().leads.find((l) => l.id === id);
          const validation = validateLead({
            name: data.name ?? existing?.name,
            email: data.email ?? existing?.email,
          });
          if (!validation.valid) {
            toast(validation.errors[0], "error");
            return;
          }
        }

        const sanitized: Partial<Lead> = { ...data, updatedAt: new Date().toISOString() };
        if (data.name !== undefined) sanitized.name = sanitize(data.name, 200);
        if (data.email !== undefined) sanitized.email = sanitizeEmail(data.email);
        if (data.phone !== undefined) sanitized.phone = sanitize(data.phone, 30);
        if (data.notes !== undefined) sanitized.notes = sanitize(data.notes, 5000);

        const prevLeads = get().leads;
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, ...sanitized } : l
          ),
        }));
        logActivity("update", "leads", "Updated lead");
        toast("Lead updated");

        if (workspaceId) {
          dbUpdateLead(workspaceId, id, sanitized).catch((err) => {
            set({ leads: prevLeads }); // rollback
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving lead" }));
          });
        }
      },

      deleteLead: (id, workspaceId?) => {
        const lead = get().leads.find((l) => l.id === id);
        const prevLeads = get().leads;
        set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
        if (lead) {
          logActivity("delete", "leads", `Deleted lead "${lead.name}"`);
          toast(`Lead "${lead.name}" deleted`, "info");

          if (workspaceId) {
            dbDeleteLead(workspaceId, id).catch((err) => {
              set({ leads: prevLeads }); // rollback
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting lead" }));
            });
          }
        }
      },

      moveLead: (id, stage, workspaceId?) => {
        const updatedData = { stage, updatedAt: new Date().toISOString() };
        const previousLeads = get().leads;
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
            set({ leads: previousLeads }); // rollback
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
        if (!client || !client.id) {
          toast("Failed to create client — please try again.");
          return null;
        }
        const updatedData = {
          stage: "won" as LeadStage,
          clientId: client.id,
          updatedAt: new Date().toISOString(),
        };
        const previousLeads = get().leads;
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
            set({ leads: previousLeads }); // rollback
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
