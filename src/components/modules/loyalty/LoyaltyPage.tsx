"use client";

import { useState } from "react";
import { Plus, Gift, Trophy } from "lucide-react";
import { useLoyaltyStore } from "@/store/loyalty";
import { ReferralCode } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { ReferralCodeForm } from "./ReferralCodeForm";

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
