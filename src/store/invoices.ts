import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Invoice, Quote } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateClientRef } from "@/lib/validate-refs";
import {
  fetchInvoices,
  fetchQuotes,
  dbCreateInvoice,
  dbUpdateInvoice,
  dbDeleteInvoice,
  dbUpsertInvoices,
  dbCreateQuote,
  dbUpdateQuote,
  dbDeleteQuote,
  dbUpsertQuotes,
} from "@/lib/db/invoices";

interface InvoicesStore {
  invoices: Invoice[];
  quotes: Quote[];
  nextInvoiceNum: number;
  nextQuoteNum: number;

  addInvoice: (data: Omit<Invoice, "id" | "number" | "createdAt" | "updatedAt">, workspaceId?: string) => Invoice | null;
  updateInvoice: (id: string, data: Partial<Invoice>, workspaceId?: string) => void;
  deleteInvoice: (id: string, workspaceId?: string) => void;

  addQuote: (data: Omit<Quote, "id" | "number" | "createdAt" | "updatedAt">, workspaceId?: string) => Quote;
  updateQuote: (id: string, data: Partial<Quote>, workspaceId?: string) => void;
  deleteQuote: (id: string, workspaceId?: string) => void;
  convertQuoteToInvoice: (quoteId: string, workspaceId?: string) => Invoice | null;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

/** Derive the next auto-increment number from existing records. */
function deriveNextInvoiceNum(invoices: Invoice[]): number {
  let max = 1000;
  for (const inv of invoices) {
    const match = inv.number.match(/^INV-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

function deriveNextQuoteNum(quotes: Quote[]): number {
  let max = 0;
  for (const q of quotes) {
    const match = q.number.match(/^QT-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

export const useInvoicesStore = create<InvoicesStore>()(
  persist(
    (set, get) => ({
      invoices: [],
      quotes: [],
      nextInvoiceNum: 1001,
      nextQuoteNum: 1,

      addInvoice: (data, workspaceId?) => {
        if (!validateClientRef(data.clientId)) {
          toast("Cannot create invoice: client not found", "error");
          return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customNumber = (data as any).customNumber as string | undefined;
        const num = get().nextInvoiceNum;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { customNumber: __removed, ...cleanData } = data as any;
        const invoice: Invoice = {
          ...cleanData,
          id: generateId(),
          number: customNumber || `INV-${num}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          invoices: [...s.invoices, invoice],
          // Only advance counter if we used the auto-generated number
          nextInvoiceNum: customNumber ? s.nextInvoiceNum : s.nextInvoiceNum + 1,
        }));
        logActivity("create", "invoicing", `Created invoice ${invoice.number}`);
        toast(`Created invoice ${invoice.number}`);

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateInvoice(workspaceId, invoice).catch((err) =>
            console.error("[invoices] dbCreateInvoice failed:", err)
          );
        }

        return invoice;
      },

      updateInvoice: (id, data, workspaceId?) => {
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          invoices: s.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...updatedData } : inv
          ),
        }));
        logActivity("update", "invoicing", "Updated invoice");
        toast("Invoice updated");

        if (workspaceId) {
          dbUpdateInvoice(workspaceId, id, updatedData).catch((err) =>
            console.error("[invoices] dbUpdateInvoice failed:", err)
          );
        }
      },

      deleteInvoice: (id, workspaceId?) => {
        const inv = get().invoices.find((i) => i.id === id);
        set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) }));
        if (inv) {
          logActivity("delete", "invoicing", `Deleted invoice ${inv.number}`);
          toast(`Invoice ${inv.number} deleted`, "info");

          if (workspaceId) {
            dbDeleteInvoice(workspaceId, id).catch((err) =>
              console.error("[invoices] dbDeleteInvoice failed:", err)
            );
          }
        }
      },

      addQuote: (data, workspaceId?) => {
        const num = get().nextQuoteNum;
        const quote: Quote = {
          ...data,
          id: generateId(),
          number: `QT-${num}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          quotes: [...s.quotes, quote],
          nextQuoteNum: s.nextQuoteNum + 1,
        }));
        logActivity("create", "invoicing", `Created quote ${quote.number}`);
        toast(`Created quote ${quote.number}`);

        if (workspaceId) {
          dbCreateQuote(workspaceId, quote).catch((err) =>
            console.error("[invoices] dbCreateQuote failed:", err)
          );
        }

        return quote;
      },

      updateQuote: (id, data, workspaceId?) => {
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          quotes: s.quotes.map((q) =>
            q.id === id ? { ...q, ...updatedData } : q
          ),
        }));
        logActivity("update", "invoicing", "Updated quote");
        toast("Quote updated");

        if (workspaceId) {
          dbUpdateQuote(workspaceId, id, updatedData).catch((err) =>
            console.error("[invoices] dbUpdateQuote failed:", err)
          );
        }
      },

      deleteQuote: (id, workspaceId?) => {
        const quote = get().quotes.find((q) => q.id === id);
        set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) }));
        if (quote) {
          logActivity("delete", "invoicing", `Deleted quote ${quote.number}`);
          toast(`Quote ${quote.number} deleted`, "info");

          if (workspaceId) {
            dbDeleteQuote(workspaceId, id).catch((err) =>
              console.error("[invoices] dbDeleteQuote failed:", err)
            );
          }
        }
      },

      convertQuoteToInvoice: (quoteId, workspaceId?) => {
        const quote = get().quotes.find((q) => q.id === quoteId);
        if (!quote) return null;

        const invoice = get().addInvoice(
          {
            clientId: quote.clientId,
            lineItems: [...quote.lineItems],
            status: "draft",
            notes: quote.notes,
          },
          workspaceId
        );

        const updatedData = { status: "accepted" as const, updatedAt: new Date().toISOString() };
        set((s) => ({
          quotes: s.quotes.map((q) =>
            q.id === quoteId ? { ...q, ...updatedData } : q
          ),
        }));

        if (workspaceId) {
          dbUpdateQuote(workspaceId, quoteId, updatedData).catch((err) =>
            console.error("[invoices] dbUpdateQuote (convert) failed:", err)
          );
        }

        if (invoice) {
          logActivity("convert", "invoicing", `Converted ${quote.number} to ${invoice.number}`);
          toast(`Converted ${quote.number} to invoice ${invoice.number}`);
        }
        return invoice;
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { invoices, quotes } = get();
          await Promise.all([
            dbUpsertInvoices(workspaceId, invoices),
            dbUpsertQuotes(workspaceId, quotes),
          ]);
        } catch (err) {
          console.error("[invoices] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [invoices, quotes] = await Promise.all([
            fetchInvoices(workspaceId),
            fetchQuotes(workspaceId),
          ]);

          const mappedInvoices = invoices ?? [];
          const mappedQuotes = quotes ?? [];

          const updates: Partial<InvoicesStore> = {
            invoices: mappedInvoices,
            nextInvoiceNum: mappedInvoices.length > 0 ? deriveNextInvoiceNum(mappedInvoices) : get().nextInvoiceNum,
            quotes: mappedQuotes,
            nextQuoteNum: mappedQuotes.length > 0 ? deriveNextQuoteNum(mappedQuotes) : get().nextQuoteNum,
          };

          set(updates);
        } catch (err) {
          console.error("[invoices] loadFromSupabase failed:", err);
        }
      },
    }),
    {
      name: "magic-crm-invoices",
      version: 2,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          return {
            ...persisted,
            invoices: (persisted.invoices ?? []).map((inv: Record<string, unknown>) => ({
              ...inv,
              paymentSchedule: inv.paymentSchedule,
              depositPercent: inv.depositPercent,
              depositPaid: inv.depositPaid,
              milestones: inv.milestones,
            })),
          };
        }
        return persisted;
      },
    }
  )
);
