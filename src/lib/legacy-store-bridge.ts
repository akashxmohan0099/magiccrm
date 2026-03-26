// ── Legacy Store Bridge ──────────────────────────────────────
//
// Maps schema module IDs to legacy Zustand stores so the
// ModuleRenderer can display existing data.
//
// When the schema renderer is active, it reads records from
// the legacy store and writes back to it — ensuring data
// consistency between schema and legacy views.

import { useClientsStore } from "@/store/clients";
import { useLeadsStore } from "@/store/leads";
import { useJobsStore } from "@/store/jobs";
import { useBookingsStore } from "@/store/bookings";
import { useInvoicesStore } from "@/store/invoices";
import { useProductsStore } from "@/store/products";
import { useCommunicationStore } from "@/store/communication";
import type { RecordData } from "@/store/createModuleStore";

// ── Types ────────────────────────────────────────────────────

interface LegacyStoreAccessor {
  getRecords: () => RecordData[];
  addRecord: (data: Record<string, unknown>) => RecordData;
  updateRecord: (id: string, data: Record<string, unknown>) => void;
  deleteRecord: (id: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any;

// ── Bridge Registry ──────────────────────────────────────────

export function getLegacyStoreAccessor(moduleId: string): LegacyStoreAccessor | undefined {
  switch (moduleId) {
    case "client-database":
      return {
        getRecords: () => useClientsStore.getState().clients as unknown as RecordData[],
        addRecord: (data) => useClientsStore.getState().addClient(data as AnyData) as unknown as RecordData,
        updateRecord: (id, data) => useClientsStore.getState().updateClient(id, data as AnyData),
        deleteRecord: (id) => useClientsStore.getState().deleteClient(id),
      };

    case "leads-pipeline":
      return {
        getRecords: () => useLeadsStore.getState().leads as unknown as RecordData[],
        addRecord: (data) => useLeadsStore.getState().addLead(data as AnyData) as unknown as RecordData,
        updateRecord: (id, data) => useLeadsStore.getState().updateLead(id, data as AnyData),
        deleteRecord: (id) => useLeadsStore.getState().deleteLead(id),
      };

    case "jobs-projects":
      return {
        getRecords: () => useJobsStore.getState().jobs as unknown as RecordData[],
        addRecord: (data) => useJobsStore.getState().addJob(data as AnyData) as unknown as RecordData,
        updateRecord: (id, data) => useJobsStore.getState().updateJob(id, data as AnyData),
        deleteRecord: (id) => useJobsStore.getState().deleteJob(id),
      };

    case "bookings-calendar":
      return {
        getRecords: () => useBookingsStore.getState().bookings as unknown as RecordData[],
        addRecord: (data) => useBookingsStore.getState().addBooking(data as AnyData) as unknown as RecordData,
        updateRecord: (id, data) => useBookingsStore.getState().updateBooking(id, data as AnyData),
        deleteRecord: (id) => useBookingsStore.getState().deleteBooking(id),
      };

    case "quotes-invoicing":
      return {
        getRecords: () => useInvoicesStore.getState().invoices as unknown as RecordData[],
        addRecord: (data) => useInvoicesStore.getState().addInvoice(data as AnyData) as unknown as RecordData,
        updateRecord: (id, data) => useInvoicesStore.getState().updateInvoice(id, data as AnyData),
        deleteRecord: (id) => useInvoicesStore.getState().deleteInvoice(id),
      };

    case "products":
      return {
        getRecords: () => useProductsStore.getState().products as unknown as RecordData[],
        addRecord: (data) => useProductsStore.getState().addProduct(data as AnyData) as unknown as RecordData,
        updateRecord: (id, data) => useProductsStore.getState().updateProduct(id, data as AnyData),
        deleteRecord: (id) => useProductsStore.getState().deleteProduct(id),
      };

    case "communication":
      return {
        getRecords: () => useCommunicationStore.getState().conversations as unknown as RecordData[],
        addRecord: (data) => useCommunicationStore.getState().addConversation(data as AnyData) as unknown as RecordData,
        updateRecord: (id, data) => useCommunicationStore.getState().updateConversation(id, data as AnyData),
        deleteRecord: (id) => useCommunicationStore.getState().deleteConversation(id),
      };

    default:
      return undefined;
  }
}

/** Hook version — subscribes to the legacy store's record array reactively */
export function useLegacyRecords(moduleId: string): RecordData[] {
  // Each case uses the Zustand hook directly for reactive subscriptions.
  // This ensures the component re-renders when legacy data changes.
  const clients = useClientsStore((s) => s.clients);
  const leads = useLeadsStore((s) => s.leads);
  const jobs = useJobsStore((s) => s.jobs);
  const bookings = useBookingsStore((s) => s.bookings);
  const invoices = useInvoicesStore((s) => s.invoices);
  const products = useProductsStore((s) => s.products);
  const conversations = useCommunicationStore((s) => s.conversations);

  switch (moduleId) {
    case "client-database": return clients as unknown as RecordData[];
    case "leads-pipeline": return leads as unknown as RecordData[];
    case "jobs-projects": return jobs as unknown as RecordData[];
    case "bookings-calendar": return bookings as unknown as RecordData[];
    case "quotes-invoicing": return invoices as unknown as RecordData[];
    case "products": return products as unknown as RecordData[];
    case "communication": return conversations as unknown as RecordData[];
    default: return [];
  }
}
