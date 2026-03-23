import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Client } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { cleanupClientRecords } from "@/lib/cascade-delete";
import {
  fetchClients,
  dbCreateClient,
  dbUpdateClient,
  dbDeleteClient,
  dbUpsertClients,
  mapClientFromDB,
} from "@/lib/db/clients";

interface ClientsStore {
  clients: Client[];
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
          dbCreateClient(workspaceId, client).catch((err) =>
            console.error("[clients] dbCreateClient failed:", err)
          );
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
          dbUpdateClient(workspaceId, id, updatedData).catch((err) =>
            console.error("[clients] dbUpdateClient failed:", err)
          );
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
            dbDeleteClient(workspaceId, id).catch((err) =>
              console.error("[clients] dbDeleteClient failed:", err)
            );
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
          console.error("[clients] syncToSupabase failed:", err);
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
          console.error("[clients] loadFromSupabase failed:", err);
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
