import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Proposal, ProposalTemplate, ProposalSection, ProposalSignature, ProposalVersion, LineItem } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateClientRef } from "@/lib/validate-refs";
import { useInvoicesStore } from "@/store/invoices";
import {
  fetchProposals,
  fetchProposalTemplates,
  dbCreateProposal,
  dbUpdateProposal,
  dbDeleteProposal,
  dbUpsertProposals,
  dbCreateTemplate,
  dbUpdateTemplate as dbUpdateTemplateRow,
  dbDeleteTemplate as dbDeleteTemplateRow,
  dbUpsertTemplates,
  dbRecordProposalView,
  dbAcceptProposal,
  dbUpdateShareToken,
} from "@/lib/db/proposals";

interface ProposalsStore {
  proposals: Proposal[];
  templates: ProposalTemplate[];
  nextProposalNum: number;

  addProposal: (data: Omit<Proposal, "id" | "number" | "createdAt" | "updatedAt" | "viewCount" | "version">, workspaceId?: string) => Proposal | null;
  updateProposal: (id: string, data: Partial<Proposal>, workspaceId?: string) => void;
  deleteProposal: (id: string, workspaceId?: string) => void;

  addTemplate: (data: Omit<ProposalTemplate, "id" | "createdAt" | "updatedAt">, workspaceId?: string) => ProposalTemplate;
  updateTemplate: (id: string, data: Partial<ProposalTemplate>, workspaceId?: string) => void;
  deleteTemplate: (id: string, workspaceId?: string) => void;

  createFromTemplate: (templateId: string, clientId?: string, clientName?: string, workspaceId?: string) => Proposal | null;
  generateShareToken: (proposalId: string, workspaceId?: string) => string;
  recordView: (proposalId: string, workspaceId?: string) => void;
  acceptProposal: (proposalId: string, signature: ProposalSignature, workspaceId?: string) => void;
  saveVersion: (proposalId: string, notes?: string, workspaceId?: string) => void;
  convertToInvoice: (proposalId: string, workspaceId?: string) => string | null;
  convertToQuote: (proposalId: string, workspaceId?: string) => string | null;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useProposalsStore = create<ProposalsStore>()(
  persist(
    (set, get) => ({
      proposals: [],
      templates: [],
      nextProposalNum: 1,

      addProposal: (data, workspaceId?) => {
        if (!validateClientRef(data.clientId)) {
          toast("Cannot create proposal: client not found", "error");
          return null;
        }
        const num = get().nextProposalNum;
        const proposal: Proposal = {
          ...data,
          id: generateId(),
          number: `PROP-${num}`,
          viewCount: 0,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          proposals: [...s.proposals, proposal],
          nextProposalNum: s.nextProposalNum + 1,
        }));
        logActivity("create", "proposals", `Created proposal ${proposal.number}`);
        toast(`Created proposal ${proposal.number}`);

        if (workspaceId) {
          dbCreateProposal(workspaceId, proposal).catch((err) =>
            console.error("[proposals] dbCreateProposal failed:", err)
          );
        }

        return proposal;
      },

      updateProposal: (id, data, workspaceId?) => {
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === id ? { ...p, ...updatedData } : p
          ),
        }));
        logActivity("update", "proposals", "Updated proposal");
        toast("Proposal updated");

        if (workspaceId) {
          dbUpdateProposal(workspaceId, id, updatedData).catch((err) =>
            console.error("[proposals] dbUpdateProposal failed:", err)
          );
        }
      },

      deleteProposal: (id, workspaceId?) => {
        const proposal = get().proposals.find((p) => p.id === id);
        set((s) => ({ proposals: s.proposals.filter((p) => p.id !== id) }));
        if (proposal) {
          logActivity("delete", "proposals", `Deleted proposal ${proposal.number}`);
          toast(`Proposal ${proposal.number} deleted`, "info");

          if (workspaceId) {
            dbDeleteProposal(workspaceId, id).catch((err) =>
              console.error("[proposals] dbDeleteProposal failed:", err)
            );
          }
        }
      },

      addTemplate: (data, workspaceId?) => {
        const template: ProposalTemplate = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          templates: [...s.templates, template],
        }));
        logActivity("create", "proposals", `Created proposal template "${template.name}"`);
        toast(`Created template "${template.name}"`);

        if (workspaceId) {
          dbCreateTemplate(workspaceId, template).catch((err) =>
            console.error("[proposals] dbCreateTemplate failed:", err)
          );
        }

        return template;
      },

      updateTemplate: (id, data, workspaceId?) => {
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id ? { ...t, ...updatedData } : t
          ),
        }));
        logActivity("update", "proposals", "Updated proposal template");
        toast("Template updated");

        if (workspaceId) {
          dbUpdateTemplateRow(workspaceId, id, updatedData).catch((err) =>
            console.error("[proposals] dbUpdateTemplate failed:", err)
          );
        }
      },

      deleteTemplate: (id, workspaceId?) => {
        const template = get().templates.find((t) => t.id === id);
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
        if (template) {
          logActivity("delete", "proposals", `Deleted template "${template.name}"`);
          toast(`Template "${template.name}" deleted`, "info");

          if (workspaceId) {
            dbDeleteTemplateRow(workspaceId, id).catch((err) =>
              console.error("[proposals] dbDeleteTemplate failed:", err)
            );
          }
        }
      },

      createFromTemplate: (templateId, clientId?, clientName?, workspaceId?) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) {
          toast("Template not found", "error");
          return null;
        }

        const sections: ProposalSection[] = template.sections.map((s) => ({
          ...s,
          id: generateId(),
        }));

        const proposal = get().addProposal(
          {
            title: template.name,
            clientId,
            clientName,
            templateId,
            sections,
            status: "draft",
            branding: {},
            notes: "",
          },
          workspaceId
        );

        logActivity("create", "proposals", `Created proposal from template "${template.name}"`);
        return proposal;
      },

      generateShareToken: (proposalId, workspaceId?) => {
        const proposal = get().proposals.find((p) => p.id === proposalId);
        const token = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
        const updatedAt = new Date().toISOString();
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === proposalId ? { ...p, shareToken: token, updatedAt } : p
          ),
        }));
        logActivity("update", "proposals", "Generated share link for proposal");
        toast("Share link generated");

        if (workspaceId && proposal) {
          dbUpsertProposals(workspaceId, [
            {
              ...proposal,
              shareToken: token,
              updatedAt,
            },
          ]).catch((err) =>
            console.error("[proposals] dbUpsertProposals (generateShareToken) failed:", err)
          );
        } else if (workspaceId) {
          dbUpdateShareToken(workspaceId, proposalId, token).catch((err) =>
            console.error("[proposals] dbUpdateShareToken failed:", err)
          );
        }

        return token;
      },

      recordView: (proposalId, workspaceId?) => {
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === proposalId
              ? {
                  ...p,
                  viewCount: p.viewCount + 1,
                  lastViewedAt: new Date().toISOString(),
                  status: p.status === "sent" ? "viewed" : p.status,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
        logActivity("view", "proposals", "Proposal viewed by client");

        if (workspaceId) {
          dbRecordProposalView(workspaceId, proposalId).catch((err) =>
            console.error("[proposals] dbRecordProposalView failed:", err)
          );
        }
      },

      acceptProposal: (proposalId, signature, workspaceId?) => {
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === proposalId
              ? {
                  ...p,
                  status: "accepted" as const,
                  signature,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
        logActivity("update", "proposals", "Proposal accepted");
        toast("Proposal accepted");

        if (workspaceId) {
          dbAcceptProposal(workspaceId, proposalId, signature).catch((err) =>
            console.error("[proposals] dbAcceptProposal failed:", err)
          );
        }
      },

      saveVersion: (proposalId, notes?, workspaceId?) => {
        const proposal = get().proposals.find((p) => p.id === proposalId);
        if (!proposal) return;

        const snapshot: ProposalVersion = {
          version: proposal.version,
          sections: [...proposal.sections],
          savedAt: new Date().toISOString(),
          notes,
        };

        const updatedData: Partial<Proposal> = {
          previousVersions: [...(proposal.previousVersions ?? []), snapshot],
          version: proposal.version + 1,
          updatedAt: new Date().toISOString(),
        };

        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === proposalId ? { ...p, ...updatedData } : p
          ),
        }));
        logActivity("update", "proposals", `Saved proposal version ${proposal.version}`);
        toast(`Version ${proposal.version} saved`);

        if (workspaceId) {
          dbUpdateProposal(workspaceId, proposalId, updatedData).catch((err) =>
            console.error("[proposals] dbUpdateProposal (saveVersion) failed:", err)
          );
        }
      },

      convertToInvoice: (proposalId, workspaceId?) => {
        const proposal = get().proposals.find((p) => p.id === proposalId);
        if (!proposal) return null;

        const allLineItems: LineItem[] = proposal.sections
          .filter((s) => s.type === "pricing-table" || s.type === "services")
          .flatMap((s) => s.lineItems ?? []);

        const invoiceStore = useInvoicesStore.getState();
        const invoice = invoiceStore.addInvoice({
          clientId: proposal.clientId,
          lineItems: allLineItems.map((li) => ({ ...li, id: generateId() })),
          status: "draft",
          notes: proposal.notes || "",
        });

        if (invoice) {
          const updatedData: Partial<Proposal> = {
            convertedToInvoiceId: invoice.id,
            updatedAt: new Date().toISOString(),
          };
          set((s) => ({
            proposals: s.proposals.map((p) =>
              p.id === proposalId ? { ...p, ...updatedData } : p
            ),
          }));
          logActivity("convert", "proposals", `Converted ${proposal.number} to invoice ${invoice.number}`);
          toast(`Converted to invoice ${invoice.number}`);

          if (workspaceId) {
            dbUpdateProposal(workspaceId, proposalId, updatedData).catch((err) =>
              console.error("[proposals] dbUpdateProposal (convertToInvoice) failed:", err)
            );
          }

          return invoice.id;
        }
        return null;
      },

      convertToQuote: (proposalId, workspaceId?) => {
        const proposal = get().proposals.find((p) => p.id === proposalId);
        if (!proposal) return null;

        const allLineItems: LineItem[] = proposal.sections
          .filter((s) => s.type === "pricing-table" || s.type === "services")
          .flatMap((s) => s.lineItems ?? []);

        const invoiceStore = useInvoicesStore.getState();
        const quote = invoiceStore.addQuote({
          clientId: proposal.clientId,
          lineItems: allLineItems.map((li) => ({ ...li, id: generateId() })),
          status: "draft",
          notes: proposal.notes || "",
          validUntil: proposal.validUntil,
        });

        if (quote) {
          const updatedData: Partial<Proposal> = {
            convertedToQuoteId: quote.id,
            updatedAt: new Date().toISOString(),
          };
          set((s) => ({
            proposals: s.proposals.map((p) =>
              p.id === proposalId ? { ...p, ...updatedData } : p
            ),
          }));
          logActivity("convert", "proposals", `Converted ${proposal.number} to quote ${quote.number}`);
          toast(`Converted to quote ${quote.number}`);

          if (workspaceId) {
            dbUpdateProposal(workspaceId, proposalId, updatedData).catch((err) =>
              console.error("[proposals] dbUpdateProposal (convertToQuote) failed:", err)
            );
          }

          return quote.id;
        }
        return null;
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { proposals, templates } = get();
          await Promise.all([
            dbUpsertProposals(workspaceId, proposals),
            dbUpsertTemplates(workspaceId, templates),
          ]);
        } catch (err) {
          console.error("[proposals] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [proposalData, templateData] = await Promise.all([
            fetchProposals(workspaceId),
            fetchProposalTemplates(workspaceId),
          ]);

          const mappedProposals = (proposalData ?? []) as unknown as Proposal[];
          const mappedTemplates = (templateData ?? []) as unknown as ProposalTemplate[];

          // Derive nextProposalNum from existing proposal numbers
          const nums = mappedProposals
            .map((p) => {
              const num = (p.number || "").replace("PROP-", "");
              return parseInt(num, 10);
            })
            .filter((n) => !isNaN(n));
          const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : get().nextProposalNum;

          set({
            proposals: mappedProposals,
            templates: mappedTemplates,
            nextProposalNum: nextNum,
          });
        } catch (err) {
          console.error("[proposals] loadFromSupabase failed:", err);
        }
      },
    }),
    {
      name: "magic-crm-proposals",
    }
  )
);
