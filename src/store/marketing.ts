import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Campaign, ReviewRequest, Coupon } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchCampaigns, dbCreateCampaign, dbUpdateCampaign, dbDeleteCampaign, dbUpsertCampaigns, mapCampaignFromDB,
  fetchReviewRequests, dbCreateReviewRequest, dbUpdateReviewRequest, dbDeleteReviewRequest, dbUpsertReviewRequests, mapReviewRequestFromDB,
  fetchCoupons, dbCreateCoupon, dbUpdateCoupon, dbDeleteCoupon, dbUpsertCoupons, mapCouponFromDB,
  fetchSequences, dbCreateSequence, dbUpdateSequence, dbDeleteSequence, dbUpsertSequences, mapSequenceFromDB,
} from "@/lib/db/marketing";

export interface EmailSequence {
  id: string;
  name: string;
  status: "active" | "paused" | "draft";
  emailCount: number;
  enrolledCount: number;
}

export interface ScheduledPost {
  id: string;
  platform: "instagram" | "facebook" | "twitter";
  content: string;
  scheduledAt: string;
  status: "scheduled" | "published" | "failed";
}

interface MarketingStore {
  campaigns: Campaign[];
  reviewRequests: ReviewRequest[];
  coupons: Coupon[];
  sequences: EmailSequence[];

  addCampaign: (data: Omit<Campaign, "id" | "createdAt">, workspaceId?: string) => Campaign;
  updateCampaign: (id: string, data: Partial<Campaign>, workspaceId?: string) => void;
  deleteCampaign: (id: string, workspaceId?: string) => void;

  addReviewRequest: (data: Omit<ReviewRequest, "id" | "createdAt">, workspaceId?: string) => void;
  updateReviewRequest: (id: string, data: Partial<ReviewRequest>, workspaceId?: string) => void;
  deleteReviewRequest: (id: string, workspaceId?: string) => void;

  addCoupon: (data: Omit<Coupon, "id" | "usageCount" | "createdAt">, workspaceId?: string) => void;
  updateCoupon: (id: string, data: Partial<Coupon>, workspaceId?: string) => void;
  deleteCoupon: (id: string, workspaceId?: string) => void;

  addSequence: (data: Omit<EmailSequence, "id">, workspaceId?: string) => void;
  toggleSequenceStatus: (id: string, workspaceId?: string) => void;
  deleteSequence: (id: string, workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useMarketingStore = create<MarketingStore>()(
  persist(
    (set, get) => ({
      campaigns: [],
      reviewRequests: [],
      coupons: [],
      sequences: [],

      addCampaign: (data, workspaceId?) => {
        const campaign: Campaign = { ...data, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ campaigns: [...s.campaigns, campaign] }));
        logActivity("create", "marketing", `Created campaign "${campaign.name}"`);
        toast(`Created campaign "${campaign.name}"`);

        if (workspaceId) {
          dbCreateCampaign(workspaceId, campaign).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving campaign" }));
          });
        }
        return campaign;
      },
      updateCampaign: (id, data, workspaceId?) => {
        set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
        logActivity("update", "marketing", "Updated campaign");
        toast("Campaign updated");

        if (workspaceId) {
          dbUpdateCampaign(workspaceId, id, data).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating campaign" }));
          });
        }
      },
      deleteCampaign: (id, workspaceId?) => {
        set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }));
        toast("Campaign deleted", "info");

        if (workspaceId) {
          dbDeleteCampaign(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting campaign" }));
          });
        }
      },

      addReviewRequest: (data, workspaceId?) => {
        const rr: ReviewRequest = { ...data, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ reviewRequests: [...s.reviewRequests, rr] }));
        logActivity("create", "marketing", "Created review request");
        toast("Review request created");

        if (workspaceId) {
          dbCreateReviewRequest(workspaceId, rr).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving review request" }));
          });
        }
      },
      updateReviewRequest: (id, data, workspaceId?) => {
        set((s) => ({
          reviewRequests: s.reviewRequests.map((r) => (r.id === id ? { ...r, ...data } : r)),
        }));
        logActivity("update", "marketing", "Updated review request");
        toast("Review request updated");

        if (workspaceId) {
          dbUpdateReviewRequest(workspaceId, id, data).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating review request" }));
          });
        }
      },
      deleteReviewRequest: (id, workspaceId?) => {
        set((s) => ({ reviewRequests: s.reviewRequests.filter((r) => r.id !== id) }));
        logActivity("delete", "marketing", "Deleted review request");
        toast("Review request deleted", "info");

        if (workspaceId) {
          dbDeleteReviewRequest(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting review request" }));
          });
        }
      },

      addCoupon: (data, workspaceId?) => {
        const coupon: Coupon = { ...data, id: generateId(), usageCount: 0, createdAt: new Date().toISOString() };
        set((s) => ({ coupons: [...s.coupons, coupon] }));
        logActivity("create", "marketing", `Created coupon "${data.code}"`);
        toast(`Created coupon "${data.code}"`);

        if (workspaceId) {
          dbCreateCoupon(workspaceId, coupon).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving coupon" }));
          });
        }
      },
      updateCoupon: (id, data, workspaceId?) => {
        set((s) => ({ coupons: s.coupons.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
        logActivity("update", "marketing", "Updated coupon");
        toast("Coupon updated");

        if (workspaceId) {
          dbUpdateCoupon(workspaceId, id, data).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating coupon" }));
          });
        }
      },
      deleteCoupon: (id, workspaceId?) => {
        set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) }));
        logActivity("delete", "marketing", "Deleted coupon");
        toast("Coupon deleted", "info");

        if (workspaceId) {
          dbDeleteCoupon(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting coupon" }));
          });
        }
      },

      addSequence: (data, workspaceId?) => {
        const seq: EmailSequence = { ...data, id: generateId() };
        set((s) => ({ sequences: [...s.sequences, seq] }));
        logActivity("create", "marketing", `Created sequence "${data.name}"`);
        toast(`Created sequence "${data.name}"`);

        if (workspaceId) {
          dbCreateSequence(workspaceId, seq).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving email sequence" }));
          });
        }
      },
      toggleSequenceStatus: (id, workspaceId?) => {
        let newStatus: EmailSequence["status"] = "active";
        set((s) => ({
          sequences: s.sequences.map((seq) => {
            if (seq.id === id) {
              newStatus = seq.status === "active" ? "paused" : "active";
              return { ...seq, status: newStatus };
            }
            return seq;
          }),
        }));

        if (workspaceId) {
          dbUpdateSequence(workspaceId, id, { status: newStatus }).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "toggling email sequence status" }));
          });
        }
      },
      deleteSequence: (id, workspaceId?) => {
        set((s) => ({ sequences: s.sequences.filter((seq) => seq.id !== id) }));
        toast("Sequence deleted", "info");

        if (workspaceId) {
          dbDeleteSequence(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting email sequence" }));
          });
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { campaigns, reviewRequests, coupons, sequences } = get();
          await Promise.all([
            dbUpsertCampaigns(workspaceId, campaigns),
            dbUpsertReviewRequests(workspaceId, reviewRequests),
            dbUpsertCoupons(workspaceId, coupons),
            dbUpsertSequences(workspaceId, sequences),
          ]);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing marketing data to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [campRows, rrRows, couponRows, seqRows] = await Promise.all([
            fetchCampaigns(workspaceId),
            fetchReviewRequests(workspaceId),
            fetchCoupons(workspaceId),
            fetchSequences(workspaceId),
          ]);

          set({
            campaigns: (campRows ?? []).map((r: Record<string, unknown>) => mapCampaignFromDB(r)),
            reviewRequests: (rrRows ?? []).map((r: Record<string, unknown>) => mapReviewRequestFromDB(r)),
            coupons: (couponRows ?? []).map((r: Record<string, unknown>) => mapCouponFromDB(r)),
            sequences: (seqRows ?? []).map((r: Record<string, unknown>) => mapSequenceFromDB(r)),
          });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading marketing data from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-marketing" }
  )
);
