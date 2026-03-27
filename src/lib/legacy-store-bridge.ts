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

/** Stable empty array to avoid re-renders on non-matching selectors */
const EMPTY: RecordData[] = [];

/**
 * Hook version — subscribes ONLY to the legacy store matching the moduleId.
 * Non-matching stores return a stable empty reference (no re-render).
 */
export function useLegacyRecords(moduleId: string): RecordData[] {
  const clients = useClientsStore((s) => moduleId === "client-database" ? s.clients : EMPTY) as unknown as RecordData[];
  const leads = useLeadsStore((s) => moduleId === "leads-pipeline" ? s.leads : EMPTY) as unknown as RecordData[];
  const jobs = useJobsStore((s) => moduleId === "jobs-projects" ? s.jobs : EMPTY) as unknown as RecordData[];
  const bookings = useBookingsStore((s) => moduleId === "bookings-calendar" ? s.bookings : EMPTY) as unknown as RecordData[];
  const invoices = useInvoicesStore((s) => moduleId === "quotes-invoicing" ? s.invoices : EMPTY) as unknown as RecordData[];
  const products = useProductsStore((s) => moduleId === "products" ? s.products : EMPTY) as unknown as RecordData[];
  const conversations = useCommunicationStore((s) => moduleId === "communication" ? s.conversations : EMPTY) as unknown as RecordData[];

  switch (moduleId) {
    case "client-database": return clients;
    case "leads-pipeline": return leads;
    case "jobs-projects": return jobs;
    case "bookings-calendar": return bookings;
    case "quotes-invoicing": return invoices;
    case "products": return products;
    case "communication": return conversations;
    default: return EMPTY;
  }
}
