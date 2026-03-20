import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Client } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface ClientsStore {
  clients: Client[];
  addClient: (data: Omit<Client, "id" | "createdAt" | "updatedAt">) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  getClientsByTag: (tag: string) => Client[];
  getClientsByStatus: (status: Client["status"]) => Client[];
}

export const useClientsStore = create<ClientsStore>()(
  persist(
    (set, get) => ({
      clients: [],

      addClient: (data) => {
        const client: Client = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ clients: [...s.clients, client] }));
        logActivity("create", "clients", `Added client "${client.name}"`);
        toast(`Client "${client.name}" added`);
        return client;
      },

      updateClient: (id, data) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
          ),
        }));
        logActivity("update", "clients", `Updated client`);
        toast("Client updated");
      },

      deleteClient: (id) => {
        const client = get().clients.find((c) => c.id === id);
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
        if (client) {
          logActivity("delete", "clients", `Deleted client "${client.name}"`);
          toast(`Client "${client.name}" deleted`, "info");
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
    }),
    {
      name: "magic-crm-clients",
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          // Add customData and relationships to existing clients
          return {
            ...persisted,
            clients: (persisted.clients ?? []).map((c: any) => ({
              ...c,
              customData: c.customData ?? {},
              relationships: c.relationships ?? [],
            })),
          };
        }
        return persisted;
      },
    }
  )
);
