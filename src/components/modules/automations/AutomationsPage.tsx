"use client";

import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { useAutomationsStore } from "@/store/automations";
import { AutomationRule } from "@/types/models";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { AutomationList } from "./AutomationList";
import { AutomationForm } from "./AutomationForm";

export function AutomationsPage() {
  const { rules, initDefaults } = useAutomationsStore();
  const { workspaceId } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | undefined>();

  // Ensure default automation rules are created on mount
  useEffect(() => {
    initDefaults(workspaceId ?? undefined);
  }, [initDefaults, workspaceId]);

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
        description="Reminders, follow-ups, and workflows that run automatically."
      />

      {rules.length === 0 ? (
        <EmptyState
          icon={<Zap className="w-12 h-12" />}
          title="No automations yet"
          description="Setting up default automation rules..."
        />
      ) : (
        <>
          <AutomationList rules={rules} onEdit={handleEdit} />

          <FeatureSection moduleId="automations" featureId="automation-log" featureLabel="Automation Activity Log">
            <div className="mt-6">
              <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Recent Runs</h3>
              <p className="text-[13px] text-text-tertiary py-4 text-center">No automation runs yet. Enable an automation to see its activity here.</p>
            </div>
          </FeatureSection>
        </>
      )}

      <AutomationForm open={formOpen} onClose={handleClose} rule={editingRule} />
    </div>
  );
}
