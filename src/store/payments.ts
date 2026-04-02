import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Payment } from "@/types/models";
import { useInvoicesStore, calculateInvoiceTotal } from "@/store/invoices";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchPayments,
  dbCreatePayment,
  dbUpdatePayment,
  dbDeletePayment,
  dbUpsertPayments,
  mapPaymentFromDB,
} from "@/lib/db/payments";

interface PaymentsStore {
  payments: Payment[];
  addPayment: (data: Omit<Payment, "id" | "createdAt">, workspaceId?: string) => Payment;
  updatePayment: (id: string, data: Partial<Payment>, workspaceId?: string) => void;
  deletePayment: (id: string, workspaceId?: string) => void;
  getTotalRevenue: () => number;
  getPaymentsByClient: (clientId: string) => Payment[];

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const usePaymentsStore = create<PaymentsStore>()(
  persist(
    (set, get) => ({
      payments: [],

      addPayment: (data, workspaceId?) => {
        const payment: Payment = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ payments: [...s.payments, payment] }));
        logActivity("create", "payments", `Recorded payment of $${data.amount.toFixed(2)}`);
        toast(`Created payment of $${data.amount.toFixed(2)}`);

        // Payment → Invoice status cascade
        if (data.invoiceId) {
          const invoiceStore = useInvoicesStore.getState();
          const invoice = invoiceStore.invoices.find((inv) => inv.id === data.invoiceId);
          if (invoice) {
            const totalPaid = get().payments
              .filter((p) => p.invoiceId === data.invoiceId && !p.isRefund && !p.isWriteOff)
              .reduce((sum, p) => sum + p.amount, 0);
            const { total: invoiceTotal } = calculateInvoiceTotal(invoice);
            if (totalPaid >= invoiceTotal) {
              invoiceStore.updateInvoice(invoice.id, { paidAmount: totalPaid, status: "paid" }, workspaceId);
            } else {
              invoiceStore.updateInvoice(invoice.id, { paidAmount: totalPaid }, workspaceId);
            }
          }
        }

        if (workspaceId) {
          dbCreatePayment(workspaceId, payment).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving payment" }));
          });
        }

        return payment;
      },

      updatePayment: (id, data, workspaceId?) => {
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          payments: s.payments.map((p) => (p.id === id ? { ...p, ...updatedData } : p)),
        }));
        toast("Payment updated");

        if (workspaceId) {
          dbUpdatePayment(workspaceId, id, updatedData).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating payment" }));
          });
        }
      },

      deletePayment: (id, workspaceId?) => {
        set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }));
        logActivity("delete", "payments", "Deleted payment record");
        toast("Payment deleted", "info");

        if (workspaceId) {
          dbDeletePayment(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting payment" }));
          });
        }
      },

      getTotalRevenue: () =>
        get().payments.reduce((sum, p) => sum + p.amount, 0),

      getPaymentsByClient: (clientId) =>
        get().payments.filter((p) => p.clientId === clientId),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { payments } = get();
          await dbUpsertPayments(workspaceId, payments);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing payments to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchPayments(workspaceId);
          const mappedPayments = (rows ?? []).map((row: Record<string, unknown>) =>
            mapPaymentFromDB(row)
          );
          set({ payments: mappedPayments });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading payments from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-payments" }
  )
);
