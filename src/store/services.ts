import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ServiceDefinition, ServiceVariant } from "@/types/industry-config";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchServices,
  dbCreateService,
  dbUpdateService,
  dbDeleteService,
  dbUpsertServices,
  mapServiceFromDB,
} from "@/lib/db/services";

interface ServicesStore {
  services: ServiceDefinition[];
  initialized: boolean;
  initializeFromConfig: (defaults: ServiceDefinition[]) => void;
  addService: (
    data: Omit<ServiceDefinition, "id">,
    workspaceId?: string
  ) => ServiceDefinition;
  updateService: (
    id: string,
    data: Partial<ServiceDefinition>,
    workspaceId?: string
  ) => void;
  deleteService: (id: string, workspaceId?: string) => void;
  addVariant: (
    serviceId: string,
    variant: Omit<ServiceVariant, "id">,
    workspaceId?: string
  ) => void;
  updateVariant: (
    serviceId: string,
    variantId: string,
    data: Partial<ServiceVariant>,
    workspaceId?: string
  ) => void;
  deleteVariant: (
    serviceId: string,
    variantId: string,
    workspaceId?: string
  ) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
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

      addService: (data, workspaceId?) => {
        const service: ServiceDefinition = { ...data, id: generateId() };
        set((s) => ({ services: [...s.services, service] }));
        logActivity("create", "services", `Added service "${service.name}"`);
        toast(`Service "${service.name}" added`);

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateService(workspaceId, service).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving service" }));
          });
        }

        return service;
      },

      updateService: (id, data, workspaceId?) => {
        set((s) => ({
          services: s.services.map((svc) =>
            svc.id === id ? { ...svc, ...data } : svc
          ),
        }));
        logActivity("update", "services", "Updated service");
        toast("Service updated");

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateService(workspaceId, id, data).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating service" }));
          });
        }
      },

      deleteService: (id, workspaceId?) => {
        const service = get().services.find((svc) => svc.id === id);
        set((s) => ({ services: s.services.filter((svc) => svc.id !== id) }));
        if (service) {
          logActivity("delete", "services", `Deleted service "${service.name}"`);
          toast(`Service "${service.name}" deleted`, "info");

          // Sync to Supabase if workspaceId available
          if (workspaceId) {
            dbDeleteService(workspaceId, id).catch((err) => {
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting service" }));
            });
          }
        }
      },

      addVariant: (serviceId, variant, workspaceId?) => {
        const newVariant: ServiceVariant = { ...variant, id: generateId() };
        set((s) => ({
          services: s.services.map((svc) =>
            svc.id === serviceId
              ? { ...svc, variants: [...(svc.variants ?? []), newVariant] }
              : svc
          ),
        }));
        logActivity("create", "services", `Added variant "${newVariant.label}"`);
        toast(`Variant "${newVariant.label}" added`);

        // Sync the updated variants JSONB to Supabase
        if (workspaceId) {
          const updatedService = get().services.find((svc) => svc.id === serviceId);
          if (updatedService) {
            dbUpdateService(workspaceId, serviceId, {
              variants: updatedService.variants,
            }).catch((err) => {
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving service variant" }));
            });
          }
        }
      },

      updateVariant: (serviceId, variantId, data, workspaceId?) => {
        set((s) => ({
          services: s.services.map((svc) =>
            svc.id === serviceId
              ? {
                  ...svc,
                  variants: (svc.variants ?? []).map((v) =>
                    v.id === variantId ? { ...v, ...data } : v
                  ),
                }
              : svc
          ),
        }));
        logActivity("update", "services", "Updated service variant");
        toast("Variant updated");

        // Sync the updated variants JSONB to Supabase
        if (workspaceId) {
          const updatedService = get().services.find((svc) => svc.id === serviceId);
          if (updatedService) {
            dbUpdateService(workspaceId, serviceId, {
              variants: updatedService.variants,
            }).catch((err) => {
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating service variant" }));
            });
          }
        }
      },

      deleteVariant: (serviceId, variantId, workspaceId?) => {
        const service = get().services.find((svc) => svc.id === serviceId);
        const variant = service?.variants?.find((v) => v.id === variantId);
        set((s) => ({
          services: s.services.map((svc) =>
            svc.id === serviceId
              ? { ...svc, variants: (svc.variants ?? []).filter((v) => v.id !== variantId) }
              : svc
          ),
        }));
        if (variant) {
          logActivity("delete", "services", `Deleted variant "${variant.label}"`);
          toast(`Variant "${variant.label}" deleted`, "info");
        }

        // Sync the updated variants JSONB to Supabase
        if (workspaceId) {
          const updatedService = get().services.find((svc) => svc.id === serviceId);
          if (updatedService) {
            dbUpdateService(workspaceId, serviceId, {
              variants: updatedService.variants,
            }).catch((err) => {
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting service variant" }));
            });
          }
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { services } = get();
          await dbUpsertServices(workspaceId, services);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing services to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchServices(workspaceId);
          const mappedServices = (rows ?? []).map((row: Record<string, unknown>) =>
            mapServiceFromDB(row)
          );
          set({ services: mappedServices, initialized: true });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading services from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-services" }
  )
);
