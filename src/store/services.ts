import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Service, MemberService, ServiceCategory, LibraryAddon } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchServices,
  dbCreateService,
  dbUpdateService,
  dbDeleteService,
  fetchMemberServices,
  dbCreateMemberService,
  dbUpdateMemberService,
  dbDeleteMemberService,
  fetchServiceCategories,
  dbCreateServiceCategory,
  dbUpdateServiceCategory,
  dbDeleteServiceCategory,
  fetchLibraryAddons,
  dbCreateLibraryAddon,
  dbUpdateLibraryAddon,
  dbDeleteLibraryAddon,
} from "@/lib/db/services";
import { surfaceDbError } from "./_db-error";

interface ServicesStore {
  services: Service[];
  memberServices: MemberService[];
  categories: ServiceCategory[];
  addCategory: (
    data: Omit<ServiceCategory, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string,
  ) => ServiceCategory;
  updateCategory: (id: string, data: Partial<ServiceCategory>, workspaceId?: string) => void;
  deleteCategory: (id: string, workspaceId?: string) => void;
  reorderCategories: (orderedIds: string[], workspaceId?: string) => void;
  libraryAddons: LibraryAddon[];
  addLibraryAddon: (
    data: Omit<LibraryAddon, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string,
  ) => LibraryAddon;
  updateLibraryAddon: (id: string, data: Partial<LibraryAddon>, workspaceId?: string) => void;
  deleteLibraryAddon: (id: string, workspaceId?: string) => void;
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
  /** Replace the set of members assigned to a service. Empty array = anyone. */
  setServiceMembers: (serviceId: string, memberIds: string[], workspaceId?: string) => void;
  /** Returns the member ids currently assigned to a service. Empty = anyone. */
  getServiceMembers: (serviceId: string) => string[];
  /** Returns the per-staff price override for a member on a service, if any. */
  getMemberPriceOverride: (serviceId: string, memberId: string) => number | undefined;
  /**
   * Set a per-staff price override on a service. Pass `undefined` to clear.
   * Creates the member_services row if it doesn't exist yet.
   */
  setMemberPriceOverride: (
    serviceId: string,
    memberId: string,
    price: number | undefined,
    workspaceId?: string,
  ) => void;
  /** Returns the per-staff duration override (minutes) for a member on a service. */
  getMemberDurationOverride: (serviceId: string, memberId: string) => number | undefined;
  /** Set/clear the per-staff duration override. Same row semantics as price override. */
  setMemberDurationOverride: (
    serviceId: string,
    memberId: string,
    duration: number | undefined,
    workspaceId?: string,
  ) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useServicesStore = create<ServicesStore>()(
  persist(
    (set, get) => ({
      services: [],
      memberServices: [],
      categories: [],
      libraryAddons: [],

      addLibraryAddon: (data, workspaceId) => {
        const now = new Date().toISOString();
        const item: LibraryAddon = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ libraryAddons: [...s.libraryAddons, item] }));
        if (workspaceId) {
          dbCreateLibraryAddon(
            workspaceId,
            item as unknown as Record<string, unknown>,
          ).catch(surfaceDbError("services"));
        }
        return item;
      },
      updateLibraryAddon: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          libraryAddons: s.libraryAddons.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: now } : a,
          ),
        }));
        if (workspaceId) {
          dbUpdateLibraryAddon(workspaceId, id, data as Record<string, unknown>).catch(
            surfaceDbError("services"),
          );
        }
      },
      deleteLibraryAddon: (id, workspaceId) => {
        set((s) => ({ libraryAddons: s.libraryAddons.filter((a) => a.id !== id) }));
        if (workspaceId) {
          dbDeleteLibraryAddon(workspaceId, id).catch(surfaceDbError("services"));
        }
      },

      addCategory: (data, workspaceId) => {
        const now = new Date().toISOString();
        const cat: ServiceCategory = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ categories: [...s.categories, cat] }));
        if (workspaceId) {
          dbCreateServiceCategory(
            workspaceId,
            cat as unknown as Record<string, unknown>,
          ).catch(surfaceDbError("services"));
        }
        return cat;
      },

      updateCategory: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: now } : c,
          ),
        }));
        if (workspaceId) {
          dbUpdateServiceCategory(
            workspaceId,
            id,
            data as Record<string, unknown>,
          ).catch(surfaceDbError("services"));
        }
      },

      deleteCategory: (id, workspaceId) => {
        // Clear category link on services that reference this category;
        // they fall back to "Uncategorized" rather than vanishing.
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          services: s.services.map((svc) =>
            svc.categoryId === id ? { ...svc, categoryId: undefined } : svc,
          ),
        }));
        if (workspaceId) {
          dbDeleteServiceCategory(workspaceId, id).catch(surfaceDbError("services"));
        }
      },

      reorderCategories: (orderedIds, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => {
          const indexById = new Map(orderedIds.map((id, i) => [id, i]));
          const next = s.categories
            .map((c) => {
              const sortOrder = indexById.get(c.id);
              return sortOrder == null ? c : { ...c, sortOrder, updatedAt: now };
            })
            .sort((a, b) => a.sortOrder - b.sortOrder);
          return { categories: next };
        });
        if (workspaceId) {
          orderedIds.forEach((id, i) => {
            dbUpdateServiceCategory(workspaceId, id, { sortOrder: i }).catch(
              surfaceDbError("services"),
            );
          });
        }
      },

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
        batch().catch(surfaceDbError("services"));

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
          ).catch(surfaceDbError("services"));
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
          ).catch(surfaceDbError("services"));
        }
      },

      deleteService: (id, workspaceId) => {
        set((s) => ({
          services: s.services.filter((svc) => svc.id !== id),
          memberServices: s.memberServices.filter((ms) => ms.serviceId !== id),
        }));
        toast("Service deleted");
        if (workspaceId) {
          dbDeleteService(workspaceId, id).catch(surfaceDbError("services"));
        }
      },

      setServiceMembers: (serviceId, memberIds, workspaceId) => {
        const current = get().memberServices.filter((ms) => ms.serviceId === serviceId);
        const currentIds = new Set(current.map((ms) => ms.memberId));
        const nextIds = new Set(memberIds);

        const toAdd = memberIds.filter((id) => !currentIds.has(id));
        const toRemove = current.filter((ms) => !nextIds.has(ms.memberId));

        const newRows: MemberService[] = toAdd.map((memberId) => ({
          id: generateId(),
          memberId,
          serviceId,
          workspaceId: workspaceId ?? "",
        }));

        set((s) => ({
          memberServices: [
            ...s.memberServices.filter((ms) => !toRemove.some((r) => r.id === ms.id)),
            ...newRows,
          ],
        }));

        if (workspaceId) {
          for (const row of newRows) {
            dbCreateMemberService(workspaceId, row as unknown as Record<string, unknown>).catch(
              surfaceDbError("services"),
            );
          }
          for (const row of toRemove) {
            dbDeleteMemberService(workspaceId, row.id).catch(surfaceDbError("services"));
          }
        }
      },

      getServiceMembers: (serviceId) => {
        return get()
          .memberServices.filter((ms) => ms.serviceId === serviceId)
          .map((ms) => ms.memberId);
      },

      getMemberPriceOverride: (serviceId, memberId) => {
        const row = get().memberServices.find(
          (ms) => ms.serviceId === serviceId && ms.memberId === memberId,
        );
        return row?.priceOverride;
      },

      getMemberDurationOverride: (serviceId, memberId) => {
        const row = get().memberServices.find(
          (ms) => ms.serviceId === serviceId && ms.memberId === memberId,
        );
        return row?.durationOverride;
      },

      setMemberDurationOverride: (serviceId, memberId, duration, workspaceId) => {
        const existing = get().memberServices.find(
          (ms) => ms.serviceId === serviceId && ms.memberId === memberId,
        );
        if (!existing && duration === undefined) return;

        if (!existing) {
          // Refuse to auto-create when the service has no specific
          // assignments at all — that would silently flip an "Anyone"
          // service to single-member mode. Callers must call
          // setServiceMembers() first.
          const hasSpecificAssignments = get().memberServices.some(
            (ms) => ms.serviceId === serviceId,
          );
          if (!hasSpecificAssignments) {
            console.warn(
              "[services] setMemberDurationOverride refused: assign the member to the service first.",
            );
            return;
          }
          const newRow: MemberService = {
            id: generateId(),
            memberId,
            serviceId,
            workspaceId: workspaceId ?? "",
            durationOverride: duration,
          };
          set((s) => ({ memberServices: [...s.memberServices, newRow] }));
          if (workspaceId) {
            dbCreateMemberService(
              workspaceId,
              newRow as unknown as Record<string, unknown>,
            ).catch(surfaceDbError("services"));
          }
          return;
        }

        const updated: MemberService = { ...existing, durationOverride: duration };
        set((s) => ({
          memberServices: s.memberServices.map((ms) =>
            ms.id === existing.id ? updated : ms,
          ),
        }));
        if (workspaceId) {
          dbUpdateMemberService(workspaceId, existing.id, {
            durationOverride: duration ?? null,
          }).catch(surfaceDbError("services"));
        }
      },

      setMemberPriceOverride: (serviceId, memberId, price, workspaceId) => {
        const existing = get().memberServices.find(
          (ms) => ms.serviceId === serviceId && ms.memberId === memberId,
        );

        // Clearing an override on a member that has no row at all → noop.
        if (!existing && price === undefined) return;

        if (!existing) {
          // Refuse to auto-create when the service has no specific
          // assignments at all — that would silently flip an "Anyone"
          // service to single-member mode. Callers must call
          // setServiceMembers() first.
          const hasSpecificAssignments = get().memberServices.some(
            (ms) => ms.serviceId === serviceId,
          );
          if (!hasSpecificAssignments) {
            console.warn(
              "[services] setMemberPriceOverride refused: assign the member to the service first.",
            );
            return;
          }
          const newRow: MemberService = {
            id: generateId(),
            memberId,
            serviceId,
            workspaceId: workspaceId ?? "",
            priceOverride: price,
          };
          set((s) => ({ memberServices: [...s.memberServices, newRow] }));
          if (workspaceId) {
            dbCreateMemberService(
              workspaceId,
              newRow as unknown as Record<string, unknown>,
            ).catch(surfaceDbError("services"));
          }
          return;
        }

        const updated: MemberService = {
          ...existing,
          priceOverride: price,
        };
        set((s) => ({
          memberServices: s.memberServices.map((ms) =>
            ms.id === existing.id ? updated : ms,
          ),
        }));

        if (workspaceId) {
          dbUpdateMemberService(workspaceId, existing.id, {
            priceOverride: price ?? null,
          }).catch(surfaceDbError("services"));
        }
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const [services, memberServices, categories, libraryAddons]: [
            Service[],
            MemberService[],
            ServiceCategory[],
            LibraryAddon[],
          ] = await Promise.all([
            fetchServices(workspaceId),
            fetchMemberServices(workspaceId).catch(() => [] as MemberService[]),
            fetchServiceCategories(workspaceId).catch(() => [] as ServiceCategory[]),
            fetchLibraryAddons(workspaceId).catch(() => [] as LibraryAddon[]),
          ]);

          // Backfill: if there are services with a legacy free-text `category`
          // but no `categoryId`, and the category_categories table doesn't yet
          // have a row for that name, create one and link it. Idempotent —
          // re-runs won't duplicate because we match on name.
          const legacyNames = Array.from(
            new Set(
              services
                .filter((s) => !s.categoryId && s.category)
                .map((s) => s.category as string),
            ),
          );
          const nextCategories = [...categories];
          for (const name of legacyNames) {
            if (nextCategories.some((c) => c.name === name)) continue;
            const now = new Date().toISOString();
            const created: ServiceCategory = {
              id: generateId(),
              workspaceId,
              name,
              sortOrder: nextCategories.length,
              createdAt: now,
              updatedAt: now,
            };
            nextCategories.push(created);
            dbCreateServiceCategory(
              workspaceId,
              created as unknown as Record<string, unknown>,
            ).catch(surfaceDbError("services"));
          }
          // Link services to their freshly-created category rows.
          const idByName = new Map(nextCategories.map((c) => [c.name, c.id]));
          const linkedServices = services.map((s) => {
            if (s.categoryId || !s.category) return s;
            const id = idByName.get(s.category);
            return id ? { ...s, categoryId: id } : s;
          });
          // Persist the categoryId backfills (best-effort, non-blocking).
          for (const s of linkedServices) {
            const orig = services.find((o) => o.id === s.id);
            if (orig && !orig.categoryId && s.categoryId) {
              dbUpdateService(workspaceId, s.id, { categoryId: s.categoryId }).catch(
                surfaceDbError("services"),
              );
            }
          }

          set({
            services: linkedServices,
            memberServices,
            categories: nextCategories.sort((a, b) => a.sortOrder - b.sortOrder),
            libraryAddons,
          });
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-services", version: 9 }
  )
);
