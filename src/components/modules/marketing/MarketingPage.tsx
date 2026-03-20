"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useMarketingStore } from "@/store/marketing";
import { Campaign } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { CampaignList } from "./CampaignList";
import { CampaignForm } from "./CampaignForm";
import { ReviewCollection } from "./ReviewCollection";
import { CouponManager } from "./CouponManager";

const tabs = [
  { id: "campaigns", label: "Campaigns" },
  { id: "reviews", label: "Reviews" },
  { id: "coupons", label: "Coupons" },
];

export function MarketingPage() {
  const { campaigns } = useMarketingStore();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>(
    undefined
  );

  const handleAdd = () => {
    setEditingCampaign(undefined);
    setFormOpen(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Marketing"
        description="Manage campaigns, collect reviews, and create coupon codes."
        actions={
          activeTab === "campaigns" ? (
            <Button variant="primary" size="sm" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Campaign
            </Button>
          ) : undefined
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "campaigns" && (
        <>
          <CampaignList onEdit={handleEdit} />

          <FeatureSection moduleId="marketing" featureId="campaign-analytics" featureLabel="Campaign Performance">
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-card-bg rounded-xl border border-border-light p-4 text-center">
                <p className="text-[20px] font-bold text-foreground">{campaigns.filter(c => c.status === "sent" || c.status === "active").length}</p>
                <p className="text-[11px] text-text-tertiary">Campaigns Sent</p>
              </div>
              <div className="bg-card-bg rounded-xl border border-border-light p-4 text-center">
                <p className="text-[20px] font-bold text-foreground">{campaigns.length}</p>
                <p className="text-[11px] text-text-tertiary">Total Campaigns</p>
              </div>
              <div className="bg-card-bg rounded-xl border border-border-light p-4 text-center">
                <p className="text-[20px] font-bold text-foreground">{campaigns.filter(c => c.status === "draft").length}</p>
                <p className="text-[11px] text-text-tertiary">Drafts</p>
              </div>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="marketing" featureId="unsubscribe-management" featureLabel="Unsubscribe Management">
            <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
              <p className="text-[13px] font-medium text-foreground">Unsubscribe management is active</p>
              <p className="text-[11px] text-text-tertiary">Opted-out contacts will be automatically excluded from campaigns.</p>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="marketing" featureId="email-sequences" featureLabel="Email Sequences">
            <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
              <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Email Sequences</h3>
              <p className="text-[13px] text-text-tertiary text-center py-4">Create multi-step drip campaigns that trigger automatically.</p>
              <div className="flex justify-center">
                <button className="px-4 py-2 bg-foreground text-white rounded-lg text-[12px] font-medium cursor-pointer hover:opacity-90">New Sequence</button>
              </div>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="marketing" featureId="social-scheduling" featureLabel="Social Media Scheduling">
            <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
              <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Social Scheduler</h3>
              <p className="text-[13px] text-text-tertiary text-center py-4">Schedule and publish posts to Instagram, Facebook, and more.</p>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="marketing" featureId="ab-subject-lines" featureLabel="A/B Subject Lines">
            <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
              <p className="text-[13px] font-medium text-foreground">A/B Testing</p>
              <p className="text-[11px] text-text-tertiary">Test two subject lines on a small group. The winner is auto-sent to the rest.</p>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="marketing" featureId="referral-program" featureLabel="Referral Program">
            <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
              <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Referral Program</h3>
              <p className="text-[13px] text-text-tertiary mb-3">Clients share a unique link. When someone books, both get a reward.</p>
              <div className="bg-surface rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-[12px] font-mono text-text-secondary">yourbusiness.magic/refer/...</span>
                <button className="text-[11px] text-primary font-medium cursor-pointer hover:underline">Copy</button>
              </div>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="marketing" featureId="bounce-tracking" featureLabel="Bounce Tracking">
            <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
              <p className="text-[13px] font-medium text-foreground">Bounce & Complaint Tracking</p>
              <p className="text-[11px] text-text-tertiary">Hard bounces and spam complaints are tracked. Bad addresses are auto-suppressed from future campaigns.</p>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="marketing" featureId="send-time-optimization" featureLabel="Smart Send Time">
            <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
              <p className="text-[13px] font-medium text-foreground">Smart Send Time</p>
              <p className="text-[11px] text-text-tertiary">Auto-picks the best time to send based on each client's past open behaviour.</p>
            </div>
          </FeatureSection>
        </>
      )}

      {activeTab === "reviews" && (
        <FeatureSection moduleId="marketing" featureId="review-collection">
          <ReviewCollection />
        </FeatureSection>
      )}

      {activeTab === "coupons" && (
        <FeatureSection moduleId="marketing" featureId="coupon-codes">
          <CouponManager />
        </FeatureSection>
      )}

      <CampaignForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingCampaign(undefined);
        }}
        campaign={editingCampaign}
      />
    </div>
  );
}
