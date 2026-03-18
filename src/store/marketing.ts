import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Campaign, ReviewRequest, Coupon } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface MarketingStore {
  campaigns: Campaign[];
  reviewRequests: ReviewRequest[];
  coupons: Coupon[];

  addCampaign: (data: Omit<Campaign, "id" | "createdAt">) => Campaign;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;

  addReviewRequest: (data: Omit<ReviewRequest, "id" | "createdAt">) => void;
  updateReviewRequest: (id: string, data: Partial<ReviewRequest>) => void;

  addCoupon: (data: Omit<Coupon, "id" | "usageCount" | "createdAt">) => void;
  updateCoupon: (id: string, data: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
}

export const useMarketingStore = create<MarketingStore>()(
  persist(
    (set) => ({
      campaigns: [],
      reviewRequests: [],
      coupons: [],

      addCampaign: (data) => {
        const campaign: Campaign = { ...data, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ campaigns: [...s.campaigns, campaign] }));
        logActivity("create", "marketing", `Created campaign "${campaign.name}"`);
        toast(`Created campaign "${campaign.name}"`);
        return campaign;
      },
      updateCampaign: (id, data) => {
        set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
      },
      deleteCampaign: (id) => {
        set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }));
        toast("Campaign deleted", "info");
      },

      addReviewRequest: (data) => {
        set((s) => ({
          reviewRequests: [...s.reviewRequests, { ...data, id: generateId(), createdAt: new Date().toISOString() }],
        }));
      },
      updateReviewRequest: (id, data) => {
        set((s) => ({
          reviewRequests: s.reviewRequests.map((r) => (r.id === id ? { ...r, ...data } : r)),
        }));
      },

      addCoupon: (data) => {
        set((s) => ({
          coupons: [...s.coupons, { ...data, id: generateId(), usageCount: 0, createdAt: new Date().toISOString() }],
        }));
        logActivity("create", "marketing", `Created coupon "${data.code}"`);
        toast(`Created coupon "${data.code}"`);
      },
      updateCoupon: (id, data) => {
        set((s) => ({ coupons: s.coupons.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
      },
      deleteCoupon: (id) => {
        set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) }));
      },
    }),
    { name: "magic-crm-marketing" }
  )
);
