import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Payment } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface PaymentsStore {
  payments: Payment[];
  addPayment: (data: Omit<Payment, "id" | "createdAt">) => Payment;
  deletePayment: (id: string) => void;
  getTotalRevenue: () => number;
  getPaymentsByClient: (clientId: string) => Payment[];
}

export const usePaymentsStore = create<PaymentsStore>()(
  persist(
    (set, get) => ({
      payments: [],

      addPayment: (data) => {
        const payment: Payment = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ payments: [...s.payments, payment] }));
        logActivity("create", "payments", `Recorded payment of $${data.amount.toFixed(2)}`);
        toast(`Created payment of $${data.amount.toFixed(2)}`);
        return payment;
      },

      deletePayment: (id) => {
        set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }));
        logActivity("delete", "payments", "Deleted payment record");
      },

      getTotalRevenue: () =>
        get().payments.reduce((sum, p) => sum + p.amount, 0),

      getPaymentsByClient: (clientId) =>
        get().payments.filter((p) => p.clientId === clientId),
    }),
    { name: "magic-crm-payments" }
  )
);
