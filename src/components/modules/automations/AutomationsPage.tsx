"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { useAutomationsStore } from "@/store/automations";
import { AutomationRule } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { AutomationList } from "./AutomationList";
import { AutomationForm } from "./AutomationForm";

export function AutomationsPage() {
  const { rules } = useAutomationsStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | undefined>();

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingRule(undefined);
  };

  return (
    <div>
      <PageHeader
        title="Automations"
        description="Let your CRM handle the repetitive work"
        actions={
          <Button onClick={() => setFormOpen(true)}>New Automation</Button>
        }
      />

      <FeatureSection moduleId="automations" featureId="automation-templates" featureLabel="Automation Templates">
        <div className="mb-6">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Quick Start Templates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { name: "New Lead Follow-Up", trigger: "When a lead is created", action: "Send welcome email after 1 hour" },
              { name: "Overdue Invoice Reminder", trigger: "When invoice is overdue", action: "Send payment reminder email" },
              { name: "Post-Booking Confirmation", trigger: "When booking is created", action: "Send confirmation email" },
              { name: "Job Completion Notice", trigger: "When job is completed", action: "Send completion notification to client" },
            ].map((t) => (
              <div key={t.name} className="p-3 bg-card-bg border border-border-light rounded-xl hover:border-foreground/15 transition-all cursor-pointer">
                <p className="text-[13px] font-medium text-foreground">{t.name}</p>
                <p className="text-[11px] text-text-tertiary">{t.trigger} &rarr; {t.action}</p>
              </div>
            ))}
          </div>
        </div>
      </FeatureSection>

      {rules.length === 0 ? (
        <EmptyState
          icon={<Zap className="w-12 h-12" />}
          title="No automations yet"
          description="Create your first automation to save time on repetitive tasks."
          actionLabel="New Automation"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <AutomationList rules={rules} onEdit={handleEdit} />
      )}

      <FeatureSection moduleId="automations" featureId="automation-log" featureLabel="Automation Activity Log">
        <div className="mt-6">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Recent Runs</h3>
          <p className="text-[13px] text-text-tertiary py-4 text-center">No automation runs yet. Create and enable an automation to see its activity here.</p>
        </div>
      </FeatureSection>

      <AutomationForm open={formOpen} onClose={handleClose} rule={editingRule} />
    </div>
  );
}
