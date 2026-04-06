import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Vendor } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateVendor, sanitize, sanitizeEmail } from "@/lib/validation";
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
        // Validate input
        const validation = validateVendor(data);
        if (!validation.valid) {
          toast(validation.errors[0], "error");
          throw new Error(validation.errors[0]);
        }

        const vendor: Vendor = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          name: sanitize(data.name),
          contactName: sanitize(data.contactName),
          email: sanitizeEmail(data.email),
          phone: sanitize(data.phone),
          website: sanitize(data.website),
          notes: sanitize(data.notes),
        };
        set((s) => ({ vendors: [...s.vendors, vendor] }));
        logActivity("create", "vendor-management", `Vendor "${vendor.name}" added`);
        toast(`Vendor "${vendor.name}" added`);

        if (workspaceId) {
          dbCreateVendor(workspaceId, vendor).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving vendor" }));
          });
        }
        return vendor;
      },
      updateVendor: (id, data, workspaceId?) => {
        const vendor = get().vendors.find((v) => v.id === id);
        if (!vendor) return;

        // Validate if name or email changed
        if (data.name || data.email) {
          const validation = validateVendor({ ...vendor, ...data });
          if (!validation.valid) {
            toast(validation.errors[0], "error");
            return;
          }
        }

        // Sanitize string fields
        const sanitizedData = { ...data };
        if (data.name) sanitizedData.name = sanitize(data.name);
        if (data.contactName) sanitizedData.contactName = sanitize(data.contactName);
        if (data.email) sanitizedData.email = sanitizeEmail(data.email);
        if (data.phone) sanitizedData.phone = sanitize(data.phone);
        if (data.website) sanitizedData.website = sanitize(data.website);
        if (data.notes) sanitizedData.notes = sanitize(data.notes);

        // Capture previous state for rollback
        const previousVendors = get().vendors;

        set((s) => ({
          vendors: s.vendors.map((v) =>
            v.id === id ? { ...v, ...sanitizedData, updatedAt: new Date().toISOString() } : v
          ),
        }));
        logActivity("update", "vendor-management", `Vendor "${vendor.name}" updated`);
        toast(`Vendor "${vendor.name}" updated`);

        if (workspaceId) {
          dbUpdateVendor(workspaceId, id, sanitizedData).catch((err) => {
            set({ vendors: previousVendors });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating vendor" }));
          });
        }
      },
      deleteVendor: (id, workspaceId?) => {
        const vendor = get().vendors.find((v) => v.id === id);
        const previousVendors = get().vendors;

        set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) }));
        if (vendor) {
          logActivity("delete", "vendor-management", `Vendor "${vendor.name}" deleted`);
          toast(`Vendor "${vendor.name}" deleted`);
        }

        if (workspaceId) {
          dbDeleteVendor(workspaceId, id).catch((err) => {
            set({ vendors: previousVendors });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting vendor" }));
          });
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
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing vendors to Supabase" }));
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
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading vendors from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-vendor-management" }
  )
);
