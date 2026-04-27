import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Campaign } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchCampaigns,
  dbCreateCampaign,
  dbUpdateCampaign,
  dbDeleteCampaign,
} from "@/lib/db/marketing";

interface MarketingStore {
  campaigns: Campaign[];
  addCampaign: (
    data: Omit<Campaign, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => Campaign;
  updateCampaign: (
    id: string,
    data: Partial<Campaign>,
    workspaceId?: string
  ) => void;
  deleteCampaign: (id: string, workspaceId?: string) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useMarketingStore = create<MarketingStore>()(
  persist(
    (set) => ({
      campaigns: [],

      addCampaign: (data, workspaceId) => {
        const now = new Date().toISOString();
        const campaign: Campaign = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ campaigns: [campaign, ...s.campaigns] }));
        toast("Campaign created");
        if (workspaceId) {
          dbCreateCampaign(
            workspaceId,
            campaign as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        return campaign;
      },

      updateCampaign: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: now } : c
          ),
        }));
        if (workspaceId) {
          dbUpdateCampaign(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(console.error);
        }
      },

      deleteCampaign: (id, workspaceId) => {
        set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }));
        toast("Campaign deleted");
        if (workspaceId) {
          dbDeleteCampaign(workspaceId, id).catch(console.error);
        }
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const campaigns = await fetchCampaigns(workspaceId);
          set({ campaigns });
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-marketing", version: 2 }
  )
);
