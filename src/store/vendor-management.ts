import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Vendor } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchVendors, dbCreateVendor, dbUpdateVendor, dbDeleteVendor,
  dbUpsertVendors, mapVendorFromDB,
} from "@/lib/db/vendor-management";

interface VendorManagementStore {
  vendors: Vendor[];
  addVendor: (data: Omit<Vendor, "id" | "createdAt" | "updatedAt">, workspaceId?: string) => Vendor;
  updateVendor: (id: string, data: Partial<Omit<Vendor, "id" | "createdAt">>, workspaceId?: string) => void;
  deleteVendor: (id: string, workspaceId?: string) => void;
  getVendorsByCategory: (category: string) => Vendor[];

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useVendorManagementStore = create<VendorManagementStore>()(
  persist(
    (set, get) => ({
      vendors: [],
      addVendor: (data, workspaceId?) => {
        const vendor: Vendor = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ vendors: [...s.vendors, vendor] }));
        logActivity("create", "vendor-management", `Vendor "${vendor.name}" added`);
        toast(`Vendor "${vendor.name}" added`);

        if (workspaceId) {
          dbCreateVendor(workspaceId, vendor).catch((err) =>
            console.error("[vendor-management] dbCreateVendor failed:", err)
          );
        }
        return vendor;
      },
      updateVendor: (id, data, workspaceId?) => {
        const vendor = get().vendors.find((v) => v.id === id);
        set((s) => ({
          vendors: s.vendors.map((v) =>
            v.id === id ? { ...v, ...data, updatedAt: new Date().toISOString() } : v
          ),
        }));
        if (vendor) {
          logActivity("update", "vendor-management", `Vendor "${vendor.name}" updated`);
          toast(`Vendor "${vendor.name}" updated`);
        }

        if (workspaceId) {
          dbUpdateVendor(workspaceId, id, data).catch((err) =>
            console.error("[vendor-management] dbUpdateVendor failed:", err)
          );
        }
      },
      deleteVendor: (id, workspaceId?) => {
        const vendor = get().vendors.find((v) => v.id === id);
        set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) }));
        if (vendor) {
          logActivity("delete", "vendor-management", `Vendor "${vendor.name}" deleted`);
          toast(`Vendor "${vendor.name}" deleted`);
        }

        if (workspaceId) {
          dbDeleteVendor(workspaceId, id).catch((err) =>
            console.error("[vendor-management] dbDeleteVendor failed:", err)
          );
        }
      },
      getVendorsByCategory: (category) => {
        return get().vendors.filter((v) => v.category === category);
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { vendors } = get();
          await dbUpsertVendors(workspaceId, vendors);
        } catch (err) {
          console.error("[vendor-management] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchVendors(workspaceId);
          if (!rows || rows.length === 0) return;

          const mapped = rows.map((row: Record<string, unknown>) =>
            mapVendorFromDB(row)
          );
          set({ vendors: mapped });
        } catch (err) {
          console.error("[vendor-management] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-vendor-management" }
  )
);
