import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StorefrontConfig } from "@/types/models";
import { toast } from "@/components/ui/Toast";

interface StorefrontStore {
  config: StorefrontConfig;
  updateConfig: (data: Partial<StorefrontConfig>) => void;
}

const defaultConfig: StorefrontConfig = {
  id: "storefront",
  businessName: "",
  tagline: "",
  description: "",
  showPricing: true,
  showDuration: true,
  accentColor: "#7CFE9D",
  categories: [],
  enabled: false,
  updatedAt: new Date().toISOString(),
};

export const useStorefrontStore = create<StorefrontStore>()(
  persist(
    (set) => ({
      config: defaultConfig,
      updateConfig: (data) => {
        set((s) => ({ config: { ...s.config, ...data, updatedAt: new Date().toISOString() } }));
        toast("Storefront updated");
      },
    }),
    { name: "magic-crm-storefront" }
  )
);
