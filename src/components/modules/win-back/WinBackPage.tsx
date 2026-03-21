"use client";

import { useState } from "react";
import { Plus, UserCheck } from "lucide-react";
import { useWinBackStore } from "@/store/win-back";
import { WinBackRule } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { WinBackRuleForm } from "./WinBackRuleForm";
import { FeatureSection } from "@/components/modules/FeatureSection";

export function WinBackPage() {
  const { rules, lapsedClients } = useWinBackStore();
  const [formOpen, setFormOpen] = useState(false);
  const activeLapsed = lapsedClients.filter((c) => c.status === "detected");

  const ruleColumns: Column<WinBackRule>[] = [
    { key: "name", label: "Rule", sortable: true },
    { key: "inactiveDays", label: "Trigger After", render: (r) => `${r.inactiveDays} days inactive` },
    { key: "channel", label: "Channel", render: (r) => r.channel.toUpperCase() },
    { key: "enabled", label: "Status", render: (r) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.enabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
        {r.enabled ? "Active" : "Paused"}
      </span>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Win-Back Campaigns"
        description={`${rules.length} rules, ${activeLapsed.length} lapsed clients detected`}
        actions={<Button variant="primary" size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> New Rule</Button>}
      />
      <FeatureSection moduleId="win-back" featureId="winback-performance-report" featureLabel="Performance Report">
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card-bg rounded-xl border border-border-light p-4 text-center">
            <p className="text-[20px] font-bold text-foreground">{lapsedClients.filter(c => c.status === "detected").length}</p>
            <p className="text-[11px] text-text-tertiary">Detected</p>
          </div>
          <div className="bg-card-bg rounded-xl border border-border-light p-4 text-center">
            <p className="text-[20px] font-bold text-foreground">{lapsedClients.filter(c => c.status === "contacted").length}</p>
            <p className="text-[11px] text-text-tertiary">Contacted</p>
          </div>
          <div className="bg-card-bg rounded-xl border border-border-light p-4 text-center">
            <p className="text-[20px] font-bold text-primary">{lapsedClients.filter(c => c.status === "rebooked").length}</p>
            <p className="text-[11px] text-text-tertiary">Rebooked</p>
          </div>
        </div>
      </FeatureSection>

      {rules.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="w-10 h-10" />}
          title="No win-back rules yet"
          description="Set up rules to automatically detect and re-engage clients who haven't visited in a while."
          setupSteps={[{ label: "Create your first win-back rule", description: "Set inactivity threshold and message template", action: () => setFormOpen(true) }]}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<WinBackRule> columns={ruleColumns} data={rules} keyExtractor={(r) => r.id} />
        </div>
      )}
      <WinBackRuleForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
