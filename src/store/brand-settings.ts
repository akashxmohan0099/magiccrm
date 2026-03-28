import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  setBrandColor: (color: string) => void;
  setLogoBase64: (data: string) => void;
  setTagline: (tagline: string) => void;
  clearLogo: () => void;
}

export const useBrandSettingsStore = create<BrandSettingsStore>()(
  persist(
    (set) => ({
      brandColor: "#34D399",
      logoBase64: "",
      tagline: "",
      setBrandColor: (color) => set({ brandColor: color }),
      setLogoBase64: (data) => set({ logoBase64: data }),
      setTagline: (tagline) => set({ tagline }),
      clearLogo: () => set({ logoBase64: "" }),
    }),
    { name: "magic-crm-brand-settings" }
  )
);
