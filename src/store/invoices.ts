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

  // Invoice actions
  sendInvoice: (id: string, workspaceId: string) => Promise<{ success: boolean; error?: string }>;
  generateRecurringInvoices: (workspaceId: string) => void;

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

/** Calculate the total for an invoice, including tax. */
export function calculateInvoiceTotal(invoice: Invoice): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = invoice.lineItems.reduce((sum, li) => {
    const lineTotal = li.quantity * li.unitPrice - (li.discount ?? 0);
    return sum + lineTotal;
  }, 0);
  const taxRate = invoice.taxRate ?? 0;
  const taxAmount = taxRate > 0 ? subtotal * (taxRate / 100) : 0;
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

/** Compute the next due date for a recurring invoice schedule. */
function getNextRecurringDate(
  fromDate: string,
  schedule: NonNullable<Invoice["recurringSchedule"]>
): string {
  const d = new Date(fromDate);
  switch (schedule) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "fortnightly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
  }
  return d.toISOString();
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
          dbCreateInvoice(workspaceId, invoice).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving invoice" }));
          });
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
          dbUpdateInvoice(workspaceId, id, updatedData).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving invoice" }));
          });
        }
      },

      deleteInvoice: (id, workspaceId?) => {
        const inv = get().invoices.find((i) => i.id === id);
        set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) }));
        if (inv) {
          logActivity("delete", "invoicing", `Deleted invoice ${inv.number}`);
          toast(`Invoice ${inv.number} deleted`, "info");

          if (workspaceId) {
            dbDeleteInvoice(workspaceId, id).catch((err) => {
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting invoice" }));
            });
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
          dbCreateQuote(workspaceId, quote).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving invoice" }));
          });
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
          dbUpdateQuote(workspaceId, id, updatedData).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving invoice" }));
          });
        }
      },

      deleteQuote: (id, workspaceId?) => {
        const quote = get().quotes.find((q) => q.id === id);
        set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) }));
        if (quote) {
          logActivity("delete", "invoicing", `Deleted quote ${quote.number}`);
          toast(`Quote ${quote.number} deleted`, "info");

          if (workspaceId) {
            dbDeleteQuote(workspaceId, id).catch((err) => {
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting invoice" }));
            });
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
          dbUpdateQuote(workspaceId, quoteId, updatedData).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving invoice" }));
          });
        }

        if (invoice) {
          logActivity("convert", "invoicing", `Converted ${quote.number} to ${invoice.number}`);
          toast(`Converted ${quote.number} to invoice ${invoice.number}`);
        }
        return invoice;
      },

      // ---------------------------------------------------------------
      // Invoice actions
      // ---------------------------------------------------------------

      sendInvoice: async (id: string, workspaceId: string) => {
        const invoice = get().invoices.find((inv) => inv.id === id);
        if (!invoice) return { success: false, error: "Invoice not found" };

        try {
          const res = await fetch("/api/invoices/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId, invoiceId: id }),
          });

          const data = await res.json();

          if (!res.ok) {
            toast(data.error || "Failed to send invoice", "error");
            return { success: false, error: data.error };
          }

          // Update local state to "sent"
          set((s) => ({
            invoices: s.invoices.map((inv) =>
              inv.id === id ? { ...inv, status: "sent" as const, updatedAt: new Date().toISOString() } : inv
            ),
          }));

          logActivity("send", "invoicing", `Sent invoice ${invoice.number} to ${data.sentTo}`);
          toast(`Invoice ${invoice.number} sent${data.emailSent ? ` to ${data.sentTo}` : " (logged)"}`);
          return { success: true };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Network error";
          toast(`Failed to send invoice: ${message}`, "error");
          return { success: false, error: message };
        }
      },

      generateRecurringInvoices: (workspaceId: string) => {
        const now = new Date();
        const { invoices } = get();

        const recurringInvoices = invoices.filter(
          (inv) => inv.recurringSchedule && inv.status !== "cancelled"
        );

        let created = 0;

        for (const source of recurringInvoices) {
          // Determine the reference date for when the next invoice should be created
          const lastDate = source.lastRecurringDate || source.createdAt;
          const nextDate = getNextRecurringDate(lastDate, source.recurringSchedule!);

          if (new Date(nextDate) > now) continue; // Not due yet

          // Compute new due date relative to the original interval
          let newDueDate: string | undefined;
          if (source.dueDate) {
            const originalCreated = new Date(source.createdAt).getTime();
            const originalDue = new Date(source.dueDate).getTime();
            const daysBetween = Math.round((originalDue - originalCreated) / (1000 * 60 * 60 * 24));
            const due = new Date(now);
            due.setDate(due.getDate() + daysBetween);
            newDueDate = due.toISOString().split("T")[0];
          }

          // Create the new invoice copy
          const newInvoice = get().addInvoice(
            {
              clientId: source.clientId,
              jobId: source.jobId,
              lineItems: source.lineItems.map((li) => ({ ...li, id: generateId() })),
              status: "draft",
              dueDate: newDueDate,
              notes: source.notes,
              taxRate: source.taxRate,
              paymentSchedule: source.paymentSchedule,
              depositPercent: source.depositPercent,
              recurringSchedule: source.recurringSchedule,
            },
            workspaceId
          );

          if (newInvoice) {
            created++;
            // Mark the source invoice with the latest recurring date
            get().updateInvoice(
              source.id,
              { lastRecurringDate: now.toISOString() },
              workspaceId
            );
          }
        }

        if (created > 0) {
          logActivity("create", "invoicing", `Generated ${created} recurring invoice${created > 1 ? "s" : ""}`);
          toast(`Generated ${created} recurring invoice${created > 1 ? "s" : ""}`);
        }
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
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing invoices" }));
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
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing invoices" }));
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
