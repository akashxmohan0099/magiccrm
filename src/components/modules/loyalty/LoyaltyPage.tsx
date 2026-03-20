"use client";

import { useState } from "react";
import { Plus, Gift, Trophy, Check } from "lucide-react";
import { useLoyaltyStore } from "@/store/loyalty";
import { ReferralCode } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { ReferralCodeForm } from "./ReferralCodeForm";
import { FeatureSection } from "@/components/modules/FeatureSection";

export function LoyaltyPage() {
  const { transactions, referralCodes, pointsPerDollar, redeemThreshold, redeemValue } = useLoyaltyStore();
  const [formOpen, setFormOpen] = useState(false);

  const codeColumns: Column<ReferralCode>[] = [
    { key: "clientName", label: "Referrer", sortable: true },
    { key: "code", label: "Code", render: (c) => <span className="font-mono text-[13px] bg-surface px-2 py-0.5 rounded">{c.code}</span> },
    { key: "timesUsed", label: "Uses", sortable: true },
    { key: "rewardPoints", label: "Reward", render: (c) => `${c.rewardPoints} pts` },
  ];

  // Calculate leaderboard
  const pointsByClient: Record<string, { name: string; points: number }> = {};
  transactions.forEach((t) => {
    if (!pointsByClient[t.clientId]) pointsByClient[t.clientId] = { name: t.clientName, points: 0 };
    pointsByClient[t.clientId].points += t.type === "redeemed" ? -t.points : t.points;
  });
  const leaderboard = Object.values(pointsByClient).sort((a, b) => b.points - a.points).slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Loyalty & Referrals"
        description={`${pointsPerDollar} pt/$1 spent · Redeem ${redeemThreshold} pts for $${redeemValue} off`}
        actions={<Button variant="primary" size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> New Referral Code</Button>}
      />

      <FeatureSection moduleId="loyalty" featureId="digital-punch-card" featureLabel="Digital Punch Card">
        <div className="bg-card-bg rounded-xl border border-border-light p-5 mb-4">
          <h3 className="text-[14px] font-semibold text-foreground mb-3">Digital Punch Card</h3>
          <div className="flex gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${i < 3 ? "bg-primary/20 border-primary" : "border-border-light"}`}>
                {i < 3 && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">Buy 9, get the 10th free — tracked automatically per client.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="loyalty" featureId="reward-tiers" featureLabel="Reward Tiers">
        <div className="bg-card-bg rounded-xl border border-border-light p-5 mb-4">
          <h3 className="text-[14px] font-semibold text-foreground mb-3">Reward Tiers</h3>
          <div className="space-y-2">
            {[
              { name: "Bronze", min: 0, color: "bg-orange-100 text-orange-700" },
              { name: "Silver", min: 100, color: "bg-gray-100 text-gray-700" },
              { name: "Gold", min: 300, color: "bg-yellow-100 text-yellow-700" },
            ].map((tier) => (
              <div key={tier.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface/50">
                <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${tier.color}`}>{tier.name}</span>
                <span className="text-[11px] text-text-tertiary">{tier.min}+ points</span>
              </div>
            ))}
          </div>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="loyalty" featureId="custom-reward-catalog" featureLabel="Reward Catalog">
        <div className="bg-card-bg rounded-xl border border-border-light p-5 mb-4">
          <h3 className="text-[14px] font-semibold text-foreground mb-3">Reward Catalog</h3>
          <div className="space-y-1.5">
            {[
              { name: "$10 off next visit", points: 100 },
              { name: "Free add-on service", points: 200 },
              { name: "50% off any service", points: 500 },
            ].map((reward) => (
              <div key={reward.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface/50">
                <span className="text-[12px] text-foreground">{reward.name}</span>
                <span className="text-[12px] font-semibold text-primary">{reward.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      </FeatureSection>

      {transactions.length === 0 && referralCodes.length === 0 ? (
        <EmptyState
          icon={<Gift className="w-10 h-10" />}
          title="No loyalty activity yet"
          description="Reward your best clients with points and referral bonuses. Points are earned automatically on every transaction."
          setupSteps={[
            { label: "Create a referral code", description: "Give clients a code to share", action: () => setFormOpen(true) },
          ]}
        />
      ) : (
        <div className="space-y-6">
          {leaderboard.length > 0 && (
            <div className="bg-card-bg rounded-xl border border-border-light p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-primary" />
                <h3 className="text-[14px] font-semibold text-foreground">Top Members</h3>
              </div>
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-bold text-text-tertiary w-5">{i + 1}.</span>
                      <span className="text-[14px] text-foreground">{entry.name}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-primary">{entry.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {referralCodes.length > 0 && (
            <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
              <div className="px-5 py-3 border-b border-border-light">
                <h3 className="text-[14px] font-semibold text-foreground">Referral Codes</h3>
              </div>
              <DataTable<ReferralCode> columns={codeColumns} data={referralCodes} keyExtractor={(c) => c.id} />
            </div>
          )}
        </div>
      )}
      <ReferralCodeForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
