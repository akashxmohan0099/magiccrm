"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useMarketingStore } from "@/store/marketing";
import { useAuth } from "@/hooks/useAuth";
import { Campaign } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { useModuleSchema } from "@/hooks/useModuleSchema";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { CampaignList } from "./CampaignList";
import { CampaignForm } from "./CampaignForm";

export function MarketingPage() {
  const { campaigns } = useMarketingStore();
  const { workspaceId } = useAuth();
  const ms = useModuleSchema("marketing");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>(undefined);

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
        title={ms.label || "Marketing"}
        description="Email campaigns, newsletters, and promotions."
        actions={
          <Button variant="primary" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Campaign
          </Button>
        }
      />

      <CampaignList onEdit={handleEdit} />

      <FeatureSection moduleId="marketing" featureId="campaign-analytics" featureLabel="Campaign Performance">
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card-bg rounded-xl border border-border-light p-4 text-center">
            <p className="text-[20px] font-bold text-foreground">{campaigns.filter((c) => c.status === "sent").length}</p>
            <p className="text-[11px] text-text-tertiary">Campaigns Sent</p>
          </div>
          <div className="bg-card-bg rounded-xl border border-border-light p-4 text-center">
            <p className="text-[20px] font-bold text-foreground">{campaigns.length}</p>
            <p className="text-[11px] text-text-tertiary">Total Campaigns</p>
          </div>
          <div className="bg-card-bg rounded-xl border border-border-light p-4 text-center">
            <p className="text-[20px] font-bold text-foreground">{campaigns.filter((c) => c.status === "draft").length}</p>
            <p className="text-[11px] text-text-tertiary">Drafts</p>
          </div>
        </div>
      </FeatureSection>

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
