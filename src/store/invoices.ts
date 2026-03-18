import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Invoice, Quote, LineItem } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface InvoicesStore {
  invoices: Invoice[];
  quotes: Quote[];
  nextInvoiceNum: number;
  nextQuoteNum: number;

  addInvoice: (data: Omit<Invoice, "id" | "number" | "createdAt" | "updatedAt">) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  addQuote: (data: Omit<Quote, "id" | "number" | "createdAt" | "updatedAt">) => Quote;
  updateQuote: (id: string, data: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  convertQuoteToInvoice: (quoteId: string) => Invoice | null;
}

export const useInvoicesStore = create<InvoicesStore>()(
  persist(
    (set, get) => ({
      invoices: [],
      quotes: [],
      nextInvoiceNum: 1001,
      nextQuoteNum: 1,

      addInvoice: (data) => {
        const num = get().nextInvoiceNum;
        const invoice: Invoice = {
          ...data,
          id: generateId(),
          number: `INV-${num}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          invoices: [...s.invoices, invoice],
          nextInvoiceNum: s.nextInvoiceNum + 1,
        }));
        logActivity("create", "invoicing", `Created invoice ${invoice.number}`);
        toast(`Created invoice ${invoice.number}`);
        return invoice;
      },

      updateInvoice: (id, data) => {
        set((s) => ({
          invoices: s.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...data, updatedAt: new Date().toISOString() } : inv
          ),
        }));
      },

      deleteInvoice: (id) => {
        const inv = get().invoices.find((i) => i.id === id);
        set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) }));
        if (inv) {
          logActivity("delete", "invoicing", `Deleted invoice ${inv.number}`);
          toast(`Invoice ${inv.number} deleted`, "info");
        }
      },

      addQuote: (data) => {
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
        return quote;
      },

      updateQuote: (id, data) => {
        set((s) => ({
          quotes: s.quotes.map((q) =>
            q.id === id ? { ...q, ...data, updatedAt: new Date().toISOString() } : q
          ),
        }));
      },

      deleteQuote: (id) => {
        const quote = get().quotes.find((q) => q.id === id);
        set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) }));
        if (quote) {
          logActivity("delete", "invoicing", `Deleted quote ${quote.number}`);
          toast(`Quote ${quote.number} deleted`, "info");
        }
      },

      convertQuoteToInvoice: (quoteId) => {
        const quote = get().quotes.find((q) => q.id === quoteId);
        if (!quote) return null;

        const invoice = get().addInvoice({
          clientId: quote.clientId,
          lineItems: [...quote.lineItems],
          status: "draft",
          notes: quote.notes,
        });

        set((s) => ({
          quotes: s.quotes.map((q) =>
            q.id === quoteId ? { ...q, status: "accepted" as const, updatedAt: new Date().toISOString() } : q
          ),
        }));

        logActivity("convert", "invoicing", `Converted ${quote.number} to ${invoice.number}`);
        toast(`Converted ${quote.number} to invoice ${invoice.number}`);
        return invoice;
      },
    }),
    { name: "magic-crm-invoices" }
  )
);
