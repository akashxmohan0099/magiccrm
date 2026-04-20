import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Client } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchClients,
  dbCreateClient,
  dbUpdateClient,
  dbDeleteClient,
} from "@/lib/db/clients";

interface ClientsStore {
  clients: Client[];
  addClient: (
    data: Omit<Client, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => Client;
  bulkImportClients: (
    items: Omit<Client, "id" | "workspaceId" | "createdAt" | "updatedAt">[],
    workspaceId: string
  ) => number;
  updateClient: (
    id: string,
    data: Partial<Client>,
    workspaceId?: string
  ) => void;
  deleteClient: (id: string, workspaceId?: string) => void;
  getClient: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useClientsStore = create<ClientsStore>()(
  persist(
    (set, get) => ({
      clients: [],

      bulkImportClients: (items, workspaceId) => {
        const now = new Date().toISOString();
        const newClients: Client[] = items.map((item) => ({
          id: generateId(),
          workspaceId,
          ...item,
          createdAt: now,
          updatedAt: now,
        }));

        set((s) => ({ clients: [...newClients, ...s.clients] }));
        toast(`Imported ${newClients.length} clients`);

        // Async batch sync to Supabase (fire-and-forget, 10 at a time)
        const batch = async () => {
          for (let i = 0; i < newClients.length; i += 10) {
            const chunk = newClients.slice(i, i + 10);
            await Promise.allSettled(
              chunk.map((c) =>
                dbCreateClient(workspaceId, c as unknown as Record<string, unknown>)
              )
            );
          }
        };
        batch().catch(console.error);

        return newClients.length;
      },

      addClient: (data, workspaceId) => {
        const now = new Date().toISOString();
        const client: Client = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ clients: [client, ...s.clients] }));
        toast("Client created");
        if (workspaceId) {
          dbCreateClient(
            workspaceId,
            client as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        return client;
      },

      updateClient: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: now } : c
          ),
        }));
        if (workspaceId) {
          dbUpdateClient(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(console.error);
        }
      },

      deleteClient: (id, workspaceId) => {
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
        toast("Client deleted");
        if (workspaceId) {
          dbDeleteClient(workspaceId, id).catch(console.error);
        }
      },

      getClient: (id) => get().clients.find((c) => c.id === id),

      searchClients: (query) => {
        const q = query.toLowerCase();
        return get().clients.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.phone.includes(q)
        );
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const clients = await fetchClients(workspaceId);
          set({ clients });
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-clients", version: 2 }
  )
);
