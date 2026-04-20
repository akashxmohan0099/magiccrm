"use client";

import { useState, useEffect } from "react";
import { useAutomationsStore } from "@/store/automations";
import { AutomationRule, AutomationChannel } from "@/types/models";
import { useAuth } from "@/hooks/useAuth";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";

interface AutomationFormProps {
  open: boolean;
  onClose: () => void;
  rule?: AutomationRule;
}

const CHANNEL_OPTIONS: { value: AutomationChannel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "both", label: "Email & SMS" },
];

const TIMING_UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];

const TYPE_LABELS: Record<string, string> = {
  booking_confirmation: "Booking Confirmation",
  appointment_reminder: "Appointment Reminder",
  post_service_followup: "Post-Service Follow-Up",
  review_request: "Review Request",
  rebooking_nudge: "Rebooking Nudge",
  no_show_followup: "No-Show Follow-Up",
  invoice_auto_send: "Invoice Auto-Send",
  cancellation_confirmation: "Cancellation Confirmation",
};

function getInitialState(rule?: AutomationRule) {
  return {
    enabled: rule?.enabled ?? true,
    channel: rule?.channel ?? ("email" as AutomationChannel),
    messageTemplate: rule?.messageTemplate ?? "",
    timingValue: rule?.timingValue?.toString() ?? "",
    timingUnit: rule?.timingUnit ?? ("hours" as "minutes" | "hours" | "days"),
  };
}

export function AutomationForm({ open, onClose, rule }: AutomationFormProps) {
  const { updateRule } = useAutomationsStore();
  const { workspaceId } = useAuth();
  const [form, setForm] = useState(getInitialState(rule));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (!form.messageTemplate.trim()) newErrors.messageTemplate = "Message template is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (!rule) return;

    const data: Partial<AutomationRule> = {
      enabled: form.enabled,
      channel: form.channel,
      messageTemplate: form.messageTemplate.trim(),
      timingValue: form.timingValue ? parseInt(form.timingValue, 10) : undefined,
      timingUnit: form.timingValue ? form.timingUnit : undefined,
    };

    updateRule(rule.id, data, workspaceId ?? undefined);
    onClose();
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  if (!rule) return null;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Edit Automation"
    >
      <div className="space-y-1">
        {/* Automation Type (read-only) */}
        <FormField label="Type">
          <p className="text-sm text-foreground font-medium py-2">
            {TYPE_LABELS[rule.type] ?? rule.type}
          </p>
        </FormField>

        <FormField label="Enabled">
          <button
            type="button"
            onClick={() => update("enabled", !form.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              form.enabled ? "bg-brand" : "bg-border-light"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-card-bg transition-transform ${
                form.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </FormField>

        <FormField label="Channel">
          <SelectField
            options={CHANNEL_OPTIONS}
            value={form.channel}
            onChange={(e) => update("channel", e.target.value)}
          />
        </FormField>

        <FormField label="Message Template" required error={errors.messageTemplate}>
          <textarea
            value={form.messageTemplate}
            onChange={(e) => update("messageTemplate", e.target.value)}
            placeholder="Hi {clientName}, your appointment on {date} at {time}..."
            rows={4}
            className={inputClass + " resize-none"}
          />
          <p className="text-[11px] text-text-tertiary mt-1">
            Variables: {"{clientName}"}, {"{date}"}, {"{time}"}, {"{invoiceNumber}"}, {"{total}"}
          </p>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Timing Value">
            <input
              type="number"
              min="0"
              value={form.timingValue}
              onChange={(e) => update("timingValue", e.target.value)}
              placeholder="e.g. 24"
              className={inputClass}
            />
          </FormField>
          <FormField label="Timing Unit">
            <SelectField
              options={TIMING_UNIT_OPTIONS}
              value={form.timingUnit}
              onChange={(e) => update("timingUnit", e.target.value)}
            />
          </FormField>
        </div>
        <p className="text-[11px] text-text-tertiary">
          Leave timing empty for automations that trigger immediately.
        </p>

        <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save Changes
          </Button>
        </div>
      </div>
    </SlideOver>
  );
}
