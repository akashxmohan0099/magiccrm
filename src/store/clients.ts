import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Client } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { cleanupClientRecords } from "@/lib/cascade-delete";
import {
  fetchClients,
  fetchClientsPage,
  fetchDuplicateClients,
  dbCreateClient,
  dbUpdateClient,
  dbDeleteClient,
  dbUpsertClients,
  mapClientFromDB,
} from "@/lib/db/clients";

export interface DuplicateMatch {
  client: Client;
  matchedOn: ("name" | "email" | "phone")[];
}

interface ClientsStore {
  clients: Client[];

  // Pagination
  page: number;
  pageSize: number;
  totalCount: number;
  setPage: (n: number) => void;
  setPageSize: (n: number) => void;
  loadPage: (workspaceId: string, page?: number, pageSize?: number) => Promise<void>;

  // Duplicate detection
  checkDuplicates: (
    name: string,
    email: string,
    phone: string,
    workspaceId?: string
  ) => Promise<DuplicateMatch[]>;

  // CSV export
  exportCSV: () => string;

  addClient: (
    data: Omit<Client, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => Client;
  updateClient: (
    id: string,
    data: Partial<Client>,
    workspaceId?: string
  ) => void;
  deleteClient: (id: string, workspaceId?: string) => void;
  getClient: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  getClientsByTag: (tag: string) => Client[];
  getClientsByStatus: (status: Client["status"]) => Client[];

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useClientsStore = create<ClientsStore>()(
  persist(
    (set, get) => ({
      clients: [],

      // ---------------------------------------------------------------
      // Pagination state
      // ---------------------------------------------------------------
      page: 1,
      pageSize: 20,
      totalCount: 0,

      setPage: (n: number) => set({ page: n }),
      setPageSize: (n: number) => set({ pageSize: n, page: 1 }),

      loadPage: async (workspaceId: string, page?: number, pageSize?: number) => {
        const currentPage = page ?? get().page;
        const currentPageSize = pageSize ?? get().pageSize;
        try {
          const { data, totalCount } = await fetchClientsPage(
            workspaceId,
            currentPage,
            currentPageSize
          );
          const mappedClients = data.map((row) => mapClientFromDB(row));
          set({
            clients: mappedClients,
            page: currentPage,
            pageSize: currentPageSize,
            totalCount,
          });
        } catch (err) {
          import("@/lib/sync-error-handler").then((m) =>
            m.handleSyncError(err, { context: "loading clients page" })
          );
        }
      },

      // ---------------------------------------------------------------
      // Duplicate detection
      // ---------------------------------------------------------------
      checkDuplicates: async (
        name: string,
        email: string,
        phone: string,
        workspaceId?: string
      ): Promise<DuplicateMatch[]> => {
        // First check in-memory (local store)
        const localClients = get().clients;
        const matches: DuplicateMatch[] = [];

        const normName = name.trim().toLowerCase();
        const normEmail = email.trim().toLowerCase();
        const normPhone = phone.trim();

        for (const c of localClients) {
          const matchedOn: ("name" | "email" | "phone")[] = [];
          if (normEmail && c.email.toLowerCase() === normEmail) matchedOn.push("email");
          if (normName && c.name.toLowerCase() === normName) matchedOn.push("name");
          if (normPhone && c.phone && c.phone === normPhone) matchedOn.push("phone");
          if (matchedOn.length > 0) {
            matches.push({ client: c, matchedOn });
          }
        }

        // If we have a workspaceId, also check the DB for matches not yet in local store
        if (workspaceId) {
          try {
            const dbRows = await fetchDuplicateClients(workspaceId, name, email, phone);
            const localIds = new Set(localClients.map((c) => c.id));
            for (const row of dbRows) {
              const client = mapClientFromDB(row);
              if (localIds.has(client.id)) continue; // already matched locally
              const matchedOn: ("name" | "email" | "phone")[] = [];
              if (normEmail && client.email.toLowerCase() === normEmail) matchedOn.push("email");
              if (normName && client.name.toLowerCase() === normName) matchedOn.push("name");
              if (normPhone && client.phone && client.phone === normPhone) matchedOn.push("phone");
              if (matchedOn.length > 0) {
                matches.push({ client, matchedOn });
              }
            }
          } catch {
            // Silently fall back to local-only duplicate check
          }
        }

        return matches;
      },

      // ---------------------------------------------------------------
      // CSV export
      // ---------------------------------------------------------------
      exportCSV: (): string => {
        const clients = get().clients;
        const headers = [
          "Name",
          "Email",
          "Phone",
          "Company",
          "Address",
          "Status",
          "Source",
          "Tags",
          "Notes",
          "Created At",
          "Updated At",
        ];

        const escapeCSV = (value: string): string => {
          if (
            value.includes(",") ||
            value.includes('"') ||
            value.includes("\n")
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };

        const rows = clients.map((c) =>
          [
            escapeCSV(c.name),
            escapeCSV(c.email),
            escapeCSV(c.phone || ""),
            escapeCSV(c.company || ""),
            escapeCSV(c.address || ""),
            escapeCSV(c.status),
            escapeCSV(c.source || ""),
            escapeCSV(c.tags.join("; ")),
            escapeCSV(c.notes || ""),
            escapeCSV(c.createdAt),
            escapeCSV(c.updatedAt),
          ].join(",")
        );

        return [headers.join(","), ...rows].join("\n");
      },

      addClient: (data, workspaceId?) => {
        const client: Client = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ clients: [...s.clients, client] }));
        logActivity("create", "clients", `Added client "${client.name}"`);
        toast(`Client "${client.name}" added`);

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateClient(workspaceId, client).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving client" }));
          });
        }

        return client;
      },

      updateClient: (id, data, workspaceId?) => {
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === id ? { ...c, ...updatedData } : c
          ),
        }));
        logActivity("update", "clients", `Updated client`);
        toast("Client updated");

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateClient(workspaceId, id, updatedData).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving client" }));
          });
        }
      },

      deleteClient: (id, workspaceId?) => {
        const client = get().clients.find((c) => c.id === id);
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
        if (client) {
          // Clean up all related records across stores
          cleanupClientRecords(id);
          logActivity("delete", "clients", `Deleted client "${client.name}"`);
          toast(`Client "${client.name}" deleted`, "info");

          // Sync to Supabase if workspaceId available
          if (workspaceId) {
            dbDeleteClient(workspaceId, id).catch((err) => {
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting client" }));
            });
          }
        }
      },

      getClient: (id) => get().clients.find((c) => c.id === id),

      searchClients: (query) => {
        const q = query.toLowerCase();
        return get().clients.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.company?.toLowerCase().includes(q) ||
            c.phone.includes(q)
        );
      },

      getClientsByTag: (tag) =>
        get().clients.filter((c) => c.tags.includes(tag)),

      getClientsByStatus: (status) =>
        get().clients.filter((c) => c.status === status),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { clients } = get();
          await dbUpsertClients(workspaceId, clients);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing clients" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchClients(workspaceId);
          const mappedClients = (rows ?? []).map((row: Record<string, unknown>) =>
            mapClientFromDB(row)
          );
          set({ clients: mappedClients });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing clients" }));
        }
      },
    }),
    {
      name: "magic-crm-clients",
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persisted as Record<string, any>;
        if (version < 2) {
          // Add customData and relationships to existing clients
          return {
            ...state,
            clients: (state.clients ?? []).map((c: Record<string, unknown>) => ({
              ...c,
              customData: c.customData ?? {},
              relationships: c.relationships ?? [],
            })),
          };
        }
        return state;
      },
    }
  )
);
