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
        <CampaignList onEdit={handleEdit} />
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
