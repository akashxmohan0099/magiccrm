"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { useAutomationsStore } from "@/store/automations";
import { AutomationRule } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
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

      <AutomationForm open={formOpen} onClose={handleClose} rule={editingRule} />
    </div>
  );
}
