import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Lead, LeadStage } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { useClientsStore } from "./clients";

interface LeadsStore {
  leads: Lead[];
  addLead: (data: Omit<Lead, "id" | "createdAt" | "updatedAt">) => Lead;
  updateLead: (id: string, data: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  moveLead: (id: string, stage: LeadStage) => void;
  convertToClient: (id: string) => string | null;
  getLeadsByStage: (stage: LeadStage) => Lead[];
}

export const useLeadsStore = create<LeadsStore>()(
  persist(
    (set, get) => ({
      leads: [],

      addLead: (data) => {
        const lead: Lead = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ leads: [...s.leads, lead] }));
        logActivity("create", "leads", `New lead "${lead.name}"`);
        toast(`Created lead "${lead.name}"`);
        return lead;
      },

      updateLead: (id, data) => {
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l
          ),
        }));
      },

      deleteLead: (id) => {
        const lead = get().leads.find((l) => l.id === id);
        set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
        if (lead) {
          logActivity("delete", "leads", `Deleted lead "${lead.name}"`);
          toast(`Lead "${lead.name}" deleted`, "info");
        }
      },

      moveLead: (id, stage) => {
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, stage, updatedAt: new Date().toISOString() } : l
          ),
        }));
        const lead = get().leads.find((l) => l.id === id);
        if (lead) {
          logActivity("update", "leads", `Moved "${lead.name}" to ${stage}`);
          toast(`Moved "${lead.name}" to ${stage}`);
        }
      },

      convertToClient: (id) => {
        const lead = get().leads.find((l) => l.id === id);
        if (!lead) return null;
        const client = useClientsStore.getState().addClient({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          tags: [],
          notes: lead.notes,
          source: lead.source as "referral" | "website" | "social" | "other" | undefined,
          status: "active",
        });
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, stage: "won" as LeadStage, clientId: client.id, updatedAt: new Date().toISOString() } : l
          ),
        }));
        logActivity("convert", "leads", `Converted "${lead.name}" to client`);
        toast(`Converted "${lead.name}" to client`);
        return client.id;
      },

      getLeadsByStage: (stage) => get().leads.filter((l) => l.stage === stage),
    }),
    { name: "magic-crm-leads" }
  )
);
