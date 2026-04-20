import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Service } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchServices,
  dbCreateService,
  dbUpdateService,
  dbDeleteService,
} from "@/lib/db/services";

interface ServicesStore {
  services: Service[];
  addService: (
    data: Omit<Service, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => Service;
  bulkImportServices: (
    items: { name: string; description: string; price: number; duration: number; category: string }[],
    workspaceId: string
  ) => number;
  updateService: (
    id: string,
    data: Partial<Service>,
    workspaceId?: string
  ) => void;
  deleteService: (id: string, workspaceId?: string) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useServicesStore = create<ServicesStore>()(
  persist(
    (set, get) => ({
      services: [],

      bulkImportServices: (items, workspaceId) => {
        const now = new Date().toISOString();
        const existing = get().services;
        const startOrder = existing.length > 0 ? Math.max(...existing.map((s) => s.sortOrder)) + 1 : 0;

        const newServices: Service[] = items.map((item, i) => ({
          id: generateId(),
          workspaceId,
          name: item.name,
          description: item.description || "",
          duration: item.duration,
          price: item.price,
          category: item.category || undefined,
          enabled: true,
          sortOrder: startOrder + i,
          bufferMinutes: 0,
          requiresConfirmation: false,
          depositType: "none" as const,
          depositAmount: 0,
          locationType: "studio" as const,
          createdAt: now,
          updatedAt: now,
        }));

        set((s) => ({ services: [...s.services, ...newServices] }));
        toast(`Imported ${newServices.length} services`);

        // Async batch sync
        const batch = async () => {
          for (let i = 0; i < newServices.length; i += 10) {
            const chunk = newServices.slice(i, i + 10);
            await Promise.allSettled(
              chunk.map((svc) =>
                dbCreateService(workspaceId, svc as unknown as Record<string, unknown>)
              )
            );
          }
        };
        batch().catch(console.error);

        return newServices.length;
      },

      addService: (data, workspaceId) => {
        const now = new Date().toISOString();
        const service: Service = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ services: [service, ...s.services] }));
        toast("Service created");
        if (workspaceId) {
          dbCreateService(
            workspaceId,
            service as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        return service;
      },

      updateService: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          services: s.services.map((svc) =>
            svc.id === id ? { ...svc, ...data, updatedAt: now } : svc
          ),
        }));
        if (workspaceId) {
          dbUpdateService(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(console.error);
        }
      },

      deleteService: (id, workspaceId) => {
        set((s) => ({ services: s.services.filter((svc) => svc.id !== id) }));
        toast("Service deleted");
        if (workspaceId) {
          dbDeleteService(workspaceId, id).catch(console.error);
        }
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const services = await fetchServices(workspaceId);
          set({ services });
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-services", version: 2 }
  )
);
