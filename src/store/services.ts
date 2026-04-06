import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ServiceDefinition, ServiceVariant } from "@/types/industry-config";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateService, sanitize } from "@/lib/validation";
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
        const validation = validateService({ name: data.name, price: data.price, duration: data.duration });
        if (!validation.valid) {
          toast(validation.errors[0], "error");
          return { id: "", name: data.name || "" } as ServiceDefinition;
        }

        const service: ServiceDefinition = {
          ...data,
          id: generateId(),
          name: sanitize(data.name, 200),
        };

        const prevServices = get().services;
        set((s) => ({ services: [...s.services, service] }));
        logActivity("create", "services", `Added service "${service.name}"`);
        toast(`Service "${service.name}" added`);

        if (workspaceId) {
          dbCreateService(workspaceId, service).catch((err) => {
            set({ services: prevServices }); // rollback
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving service" }));
          });
        }

        return service;
      },

      updateService: (id, data, workspaceId?) => {
        if (data.name !== undefined) {
          const validation = validateService({
            name: data.name,
            price: data.price ?? get().services.find((s) => s.id === id)?.price,
          });
          if (!validation.valid) {
            toast(validation.errors[0], "error");
            return;
          }
        }

        const sanitized = { ...data };
        if (data.name !== undefined) sanitized.name = sanitize(data.name, 200);

        const prevServices = get().services;
        set((s) => ({
          services: s.services.map((svc) =>
            svc.id === id ? { ...svc, ...sanitized } : svc
          ),
        }));
        logActivity("update", "services", "Updated service");
        toast("Service updated");

        if (workspaceId) {
          dbUpdateService(workspaceId, id, sanitized).catch((err) => {
            set({ services: prevServices }); // rollback
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating service" }));
          });
        }
      },

      deleteService: (id, workspaceId?) => {
        const service = get().services.find((svc) => svc.id === id);
        const prevServices = get().services;
        set((s) => ({ services: s.services.filter((svc) => svc.id !== id) }));
        if (service) {
          logActivity("delete", "services", `Deleted service "${service.name}"`);
          toast(`Service "${service.name}" deleted`, "info");

          if (workspaceId) {
            dbDeleteService(workspaceId, id).catch((err) => {
              set({ services: prevServices }); // rollback
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting service" }));
            });
          }
        }
      },

      addVariant: (serviceId, variant, workspaceId?) => {
        const newVariant: ServiceVariant = { ...variant, id: generateId() };
        const previousServices = get().services;
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
              set({ services: previousServices }); // rollback
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving service variant" }));
            });
          }
        }
      },

      updateVariant: (serviceId, variantId, data, workspaceId?) => {
        const previousServices = get().services;
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
              set({ services: previousServices }); // rollback
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating service variant" }));
            });
          }
        }
      },

      deleteVariant: (serviceId, variantId, workspaceId?) => {
        const service = get().services.find((svc) => svc.id === serviceId);
        const variant = service?.variants?.find((v) => v.id === variantId);
        const previousServices = get().services;
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
              set({ services: previousServices }); // rollback
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
