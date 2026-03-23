"use client";

import { useState } from "react";
import { Plus, Mail, Play, Pause, Trash2 } from "lucide-react";
import { useMarketingStore } from "@/store/marketing";
import { Campaign } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { CampaignList } from "./CampaignList";
import { CampaignForm } from "./CampaignForm";
import { CouponManager } from "./CouponManager";

const tabs = [
  { id: "campaigns", label: "Campaigns" },
  { id: "coupons", label: "Coupons" },
];

export function MarketingPage() {
  const {
    campaigns,
    sequences,
    addSequence: storeAddSequence,
    toggleSequenceStatus,
    deleteSequence,
  } = useMarketingStore();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>(
    undefined
  );

  /* ── Email Sequences UI state ── */
  const [seqFormOpen, setSeqFormOpen] = useState(false);
  const [seqName, setSeqName] = useState("");

  const addSequence = () => {
    if (!seqName.trim()) return;
    storeAddSequence({ name: seqName.trim(), status: "draft", emailCount: 0, enrolledCount: 0 });
    setSeqName("");
    setSeqFormOpen(false);
  };

  /* ── Delete confirmation state ── */
  const [deleteSeqId, setDeleteSeqId] = useState<string | null>(null);

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
        description="Manage campaigns and create coupon codes."
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
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider">Email Sequences</h3>
                <Button variant="primary" size="sm" onClick={() => setSeqFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  New Sequence
                </Button>
              </div>

              {sequences.length === 0 ? (
                <p className="text-[13px] text-text-tertiary text-center py-6">No sequences yet. Create a multi-step drip campaign that triggers automatically.</p>
              ) : (
                <div className="space-y-2">
                  {sequences.map((seq) => (
                    <div key={seq.id} className="flex items-center justify-between px-4 py-3 bg-surface rounded-xl border border-border-light">
                      <div className="flex items-center gap-3 min-w-0">
                        <Mail className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{seq.name}</p>
                          <p className="text-[11px] text-text-tertiary">{seq.emailCount} emails &middot; {seq.enrolledCount} enrolled</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          seq.status === "active" ? "bg-emerald-50 text-emerald-700" : seq.status === "paused" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {seq.status}
                        </span>
                        {seq.status !== "draft" && (
                          <button
                            onClick={() => toggleSequenceStatus(seq.id)}
                            className="p-1 rounded-lg hover:bg-card-bg text-text-tertiary cursor-pointer"
                            title={seq.status === "active" ? "Pause" : "Resume"}
                          >
                            {seq.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {seq.status === "draft" && (
                          <button
                            onClick={() => toggleSequenceStatus(seq.id)}
                            className="p-1 rounded-lg hover:bg-card-bg text-text-tertiary cursor-pointer"
                            title="Activate"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteSeqId(seq.id)}
                          className="p-1 rounded-lg hover:bg-red-50 text-text-tertiary hover:text-red-500 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Modal open={seqFormOpen} onClose={() => { setSeqFormOpen(false); setSeqName(""); }} title="New Email Sequence">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1.5">Sequence Name</label>
                  <input
                    type="text"
                    value={seqName}
                    onChange={(e) => setSeqName(e.target.value)}
                    placeholder="e.g. Welcome series"
                    className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && addSequence()}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => { setSeqFormOpen(false); setSeqName(""); }}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={addSequence} disabled={!seqName.trim()}>Create Sequence</Button>
                </div>
              </div>
            </Modal>
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
                <button onClick={() => { navigator.clipboard.writeText(window.location.origin + "/refer/" + "preview").catch(() => {}); }} className="text-[11px] text-primary font-medium cursor-pointer hover:underline">Copy</button>
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
              <p className="text-[11px] text-text-tertiary">Auto-picks the best time to send based on each client&apos;s past open behaviour.</p>
            </div>
          </FeatureSection>
        </>
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

      <ConfirmDialog
        open={deleteSeqId !== null}
        onClose={() => setDeleteSeqId(null)}
        onConfirm={() => {
          if (deleteSeqId) deleteSequence(deleteSeqId);
          setDeleteSeqId(null);
        }}
        title="Delete Sequence"
        message="Are you sure you want to delete this email sequence? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

    </div>
  );
}
