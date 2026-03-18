"use client";

import { useState, useEffect } from "react";
import { useAutomationsStore } from "@/store/automations";
import { AutomationRule, AutomationTrigger, AutomationAction } from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";

interface AutomationFormProps {
  open: boolean;
  onClose: () => void;
  rule?: AutomationRule;
}

const TRIGGER_OPTIONS: { value: AutomationTrigger; label: string }[] = [
  { value: "lead-created", label: "Lead Created" },
  { value: "lead-stage-changed", label: "Lead Stage Changed" },
  { value: "client-created", label: "Client Created" },
  { value: "invoice-sent", label: "Invoice Sent" },
  { value: "invoice-overdue", label: "Invoice Overdue" },
  { value: "booking-created", label: "Booking Created" },
  { value: "booking-cancelled", label: "Booking Cancelled" },
  { value: "job-completed", label: "Job Completed" },
  { value: "ticket-created", label: "Ticket Created" },
];

const ACTION_OPTIONS: { value: AutomationAction; label: string }[] = [
  { value: "send-email", label: "Send Email" },
  { value: "create-task", label: "Create Task" },
  { value: "update-status", label: "Update Status" },
  { value: "send-notification", label: "Send Notification" },
  { value: "create-follow-up", label: "Create Follow-Up" },
];

function getInitialState(rule?: AutomationRule) {
  return {
    name: rule?.name ?? "",
    trigger: rule?.trigger ?? ("lead-created" as AutomationTrigger),
    action: rule?.action ?? ("send-email" as AutomationAction),
    enabled: rule?.enabled ?? true,
  };
}

export function AutomationForm({ open, onClose, rule }: AutomationFormProps) {
  const { addRule, updateRule } = useAutomationsStore();
  const [form, setForm] = useState(getInitialState(rule));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(getInitialState(rule));
      setErrors({});
    }
  }, [open, rule]);

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (typeof value === "string" && errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const data = {
      name: form.name.trim(),
      trigger: form.trigger,
      action: form.action,
      actionConfig: {},
      enabled: form.enabled,
    };

    if (rule) {
      updateRule(rule.id, data);
    } else {
      addRule(data);
    }
    onClose();
  };

  const inputClass =
    "w-full px-3 py-2 bg-card-bg border border-border-warm rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand";

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={rule ? "Edit Automation" : "New Automation"}
    >
      <div className="space-y-1">
        <FormField label="Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Welcome email on new lead"
            className={inputClass}
          />
        </FormField>

        <FormField label="Trigger">
          <SelectField
            options={TRIGGER_OPTIONS}
            value={form.trigger}
            onChange={(e) => update("trigger", e.target.value)}
          />
        </FormField>

        <FormField label="Action">
          <SelectField
            options={ACTION_OPTIONS}
            value={form.action}
            onChange={(e) => update("action", e.target.value)}
          />
        </FormField>

        <FormField label="Enabled">
          <button
            type="button"
            onClick={() => update("enabled", !form.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              form.enabled ? "bg-brand" : "bg-border-warm"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </FormField>

        <div className="flex justify-end gap-2 pt-4 border-t border-border-warm">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {rule ? "Save Changes" : "Create Automation"}
          </Button>
        </div>
      </div>
    </SlideOver>
  );
}
