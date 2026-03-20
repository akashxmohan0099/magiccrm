import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ServiceDefinition } from "@/types/industry-config";
import { generateId } from "@/lib/id";

interface ServicesStore {
  services: ServiceDefinition[];
  initialized: boolean;
  initializeFromConfig: (defaults: ServiceDefinition[]) => void;
  addService: (data: Omit<ServiceDefinition, "id">) => ServiceDefinition;
  updateService: (id: string, data: Partial<ServiceDefinition>) => void;
  deleteService: (id: string) => void;
}

export const useServicesStore = create<ServicesStore>()(
  persist(
    (set, get) => ({
      services: [],
      initialized: false,

      initializeFromConfig: (defaults) => {
        if (get().initialized) return;
        set({ services: defaults, initialized: true });
      },

      addService: (data) => {
        const service: ServiceDefinition = { ...data, id: generateId() };
        set((s) => ({ services: [...s.services, service] }));
        return service;
      },

      updateService: (id, data) => {
        set((s) => ({
          services: s.services.map((svc) =>
            svc.id === id ? { ...svc, ...data } : svc
          ),
        }));
      },

      deleteService: (id) => {
        set((s) => ({ services: s.services.filter((svc) => svc.id !== id) }));
      },
    }),
    { name: "magic-crm-services" }
  )
);
