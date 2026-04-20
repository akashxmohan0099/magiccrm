import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaymentDocument, PaymentLineItem } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchPaymentDocuments,
  dbCreatePaymentDocument,
  dbUpdatePaymentDocument,
  dbDeletePaymentDocument,
  fetchPaymentLineItems,
  dbCreatePaymentLineItem,
  dbUpdatePaymentLineItem,
  dbDeletePaymentLineItem,
} from "@/lib/db/payments";
import { fireAutomationForInvoiceSent } from "@/lib/automation-trigger";

interface PaymentsStore {
  documents: PaymentDocument[];
  lineItems: Record<string, PaymentLineItem[]>;
  addDocument: (
    data: Omit<PaymentDocument, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => PaymentDocument;
  updateDocument: (
    id: string,
    data: Partial<PaymentDocument>,
    workspaceId?: string
  ) => void;
  deleteDocument: (id: string, workspaceId?: string) => void;
  addLineItem: (
    documentId: string,
    data: Omit<PaymentLineItem, "id">,
    workspaceId?: string
  ) => PaymentLineItem;
  updateLineItem: (
    id: string,
    documentId: string,
    data: Partial<PaymentLineItem>,
    workspaceId?: string
  ) => void;
  deleteLineItem: (
    id: string,
    documentId: string,
    workspaceId?: string
  ) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const usePaymentsStore = create<PaymentsStore>()(
  persist(
    (set, get) => ({
      documents: [],
      lineItems: {},

      addDocument: (data, workspaceId) => {
        const now = new Date().toISOString();
        const doc: PaymentDocument = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ documents: [doc, ...s.documents] }));
        toast("Payment document created");
        if (workspaceId) {
          dbCreatePaymentDocument(
            workspaceId,
            doc as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        // Fire invoice_auto_send if the invoice is created in the "sent" state.
        if (doc.status === "sent") {
          fireAutomationForInvoiceSent(doc);
        }
        return doc;
      },

      updateDocument: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        const prev = get().documents.find((d) => d.id === id);
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id ? { ...d, ...data, updatedAt: now } : d
          ),
        }));
        if (workspaceId) {
          dbUpdatePaymentDocument(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(console.error);
        }
        // Fire invoice_auto_send on draft → sent transition.
        if (prev && data.status === "sent" && prev.status !== "sent") {
          fireAutomationForInvoiceSent({ ...prev, ...data });
        }
      },

      deleteDocument: (id, workspaceId) => {
        set((s) => ({
          documents: s.documents.filter((d) => d.id !== id),
          lineItems: Object.fromEntries(
            Object.entries(s.lineItems).filter(([key]) => key !== id)
          ),
        }));
        toast("Payment document deleted");
        if (workspaceId) {
          dbDeletePaymentDocument(workspaceId, id).catch(console.error);
        }
      },

      addLineItem: (documentId, data, workspaceId) => {
        const item: PaymentLineItem = {
          id: generateId(),
          ...data,
          paymentDocumentId: documentId,
        };
        set((s) => ({
          lineItems: {
            ...s.lineItems,
            [documentId]: [
              ...(s.lineItems[documentId] || []),
              item,
            ],
          },
        }));
        if (workspaceId) {
          dbCreatePaymentLineItem(
            workspaceId,
            item as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        return item;
      },

      updateLineItem: (id, documentId, data, workspaceId) => {
        set((s) => ({
          lineItems: {
            ...s.lineItems,
            [documentId]: (s.lineItems[documentId] || []).map((li) =>
              li.id === id ? { ...li, ...data } : li
            ),
          },
        }));
        if (workspaceId) {
          dbUpdatePaymentLineItem(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(console.error);
        }
      },

      deleteLineItem: (id, documentId, workspaceId) => {
        set((s) => ({
          lineItems: {
            ...s.lineItems,
            [documentId]: (s.lineItems[documentId] || []).filter(
              (li) => li.id !== id
            ),
          },
        }));
        if (workspaceId) {
          dbDeletePaymentLineItem(workspaceId, id).catch(console.error);
        }
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const [documents, allLineItems] = await Promise.all([
            fetchPaymentDocuments(workspaceId),
            fetchPaymentLineItems(workspaceId),
          ]);
          // Group line items by paymentDocumentId
          const lineItems: Record<string, PaymentLineItem[]> = {};
          for (const item of allLineItems) {
            if (!lineItems[item.paymentDocumentId]) {
              lineItems[item.paymentDocumentId] = [];
            }
            lineItems[item.paymentDocumentId].push(item);
          }
          set({ documents, lineItems });
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-payments", version: 2 }
  )
);

/** Generate the next sequential document number (e.g. INV-001, QT-002). */
export function nextDocNumber(label: "invoice" | "quote"): string {
  const documents = usePaymentsStore.getState().documents;
  const prefix = label === "quote" ? "QT" : "INV";
  const existingNumbers = documents
    .filter((d) => d.label === label)
    .map((d) => {
      const num = parseInt(d.documentNumber.replace(/\D/g, ""), 10);
      return isNaN(num) ? 0 : num;
    });
  const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${prefix}-${String(nextNum).padStart(3, "0")}`;
}
