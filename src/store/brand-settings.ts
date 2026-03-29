import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase";

export const PRESET_COLORS = [
  { id: "green", hex: "#34D399", label: "Emerald" },
  { id: "blue", hex: "#3B82F6", label: "Blue" },
  { id: "purple", hex: "#8B5CF6", label: "Purple" },
  { id: "pink", hex: "#EC4899", label: "Pink" },
  { id: "orange", hex: "#F97316", label: "Orange" },
  { id: "red", hex: "#EF4444", label: "Red" },
  { id: "teal", hex: "#14B8A6", label: "Teal" },
  { id: "indigo", hex: "#6366F1", label: "Indigo" },
  { id: "amber", hex: "#F59E0B", label: "Amber" },
  { id: "cyan", hex: "#06B6D4", label: "Cyan" },
] as const;

interface BrandSettingsStore {
  brandColor: string;
  logoBase64: string;
  tagline: string;
  invoiceTemplate: string;
  setBrandColor: (color: string) => void;
  setLogoBase64: (data: string) => void;
  setTagline: (tagline: string) => void;
  setInvoiceTemplate: (id: string) => void;
  clearLogo: () => void;
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useBrandSettingsStore = create<BrandSettingsStore>()(
  persist(
    (set, get) => ({
      brandColor: "#34D399",
      logoBase64: "",
      tagline: "",
      invoiceTemplate: "clean",
      setBrandColor: (color) => set({ brandColor: color }),
      setLogoBase64: (data) => set({ logoBase64: data }),
      setTagline: (tagline) => set({ tagline }),
      setInvoiceTemplate: (id) => set({ invoiceTemplate: id }),
      clearLogo: () => set({ logoBase64: "" }),

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { brandColor, tagline, logoBase64, invoiceTemplate } = get();
          const supabase = createClient();
          const { error } = await supabase
            .from("workspace_settings")
            .update({ brand: { brandColor, tagline, logoBase64, invoiceTemplate } })
            .eq("workspace_id", workspaceId);
          if (error) throw error;
        } catch (err) {
          import("@/lib/sync-error-handler").then((m) =>
            m.handleSyncError(err, { context: "syncing brand settings to Supabase" })
          );
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("workspace_settings")
            .select("brand")
            .eq("workspace_id", workspaceId)
            .maybeSingle();
          if (error) throw error;

          const brand = data?.brand as
            | { brandColor?: string; tagline?: string; logoBase64?: string; invoiceTemplate?: string }
            | null;
          if (brand) {
            set({
              ...(brand.brandColor ? { brandColor: brand.brandColor } : {}),
              ...(brand.tagline !== undefined ? { tagline: brand.tagline } : {}),
              ...(brand.logoBase64 !== undefined ? { logoBase64: brand.logoBase64 } : {}),
              ...(brand.invoiceTemplate ? { invoiceTemplate: brand.invoiceTemplate } : {}),
            });
          }
        } catch (err) {
          import("@/lib/sync-error-handler").then((m) =>
            m.handleSyncError(err, { context: "loading brand settings from Supabase" })
          );
        }
      },
    }),
    { name: "magic-crm-brand-settings" }
  )
);
