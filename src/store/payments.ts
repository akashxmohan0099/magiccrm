import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Payment } from "@/types/models";
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

        if (workspaceId) {
          dbCreatePayment(workspaceId, payment).catch((err) =>
            console.error("[payments] dbCreatePayment failed:", err)
          );
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
          dbUpdatePayment(workspaceId, id, updatedData).catch((err) =>
            console.error("[payments] dbUpdatePayment failed:", err)
          );
        }
      },

      deletePayment: (id, workspaceId?) => {
        set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }));
        logActivity("delete", "payments", "Deleted payment record");
        toast("Payment deleted", "info");

        if (workspaceId) {
          dbDeletePayment(workspaceId, id).catch((err) =>
            console.error("[payments] dbDeletePayment failed:", err)
          );
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
          console.error("[payments] syncToSupabase failed:", err);
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
          console.error("[payments] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-payments" }
  )
);
