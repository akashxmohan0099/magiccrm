import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StorefrontConfig } from "@/types/models";
import { toast } from "@/components/ui/Toast";
import {
  fetchStorefrontConfig,
  saveStorefrontConfig,
} from "@/lib/db/storefront";

interface StorefrontStore {
  config: StorefrontConfig;
  updateConfig: (data: Partial<StorefrontConfig>, workspaceId?: string) => void;

  // Supabase sync
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

const defaultConfig: StorefrontConfig = {
  id: "storefront",
  businessName: "",
  tagline: "",
  description: "",
  showPricing: true,
  showDuration: true,
  accentColor: "#34D399",
  categories: [],
  enabled: false,
  updatedAt: new Date().toISOString(),
};

export const useStorefrontStore = create<StorefrontStore>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      updateConfig: (data, workspaceId?) => {
        const updated = { ...get().config, ...data, updatedAt: new Date().toISOString() };
        set({ config: updated });
        toast("Storefront updated");

        if (workspaceId) {
          saveStorefrontConfig(workspaceId, updated).catch((err) =>
            console.error("[storefront] saveStorefrontConfig failed:", err)
          );
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const config = await fetchStorefrontConfig(workspaceId);
          if (config) {
            set({ config });
          }
        } catch (err) {
          console.error("[storefront] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-storefront" }
  )
);
