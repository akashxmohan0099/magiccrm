"use client";

import { motion } from "framer-motion";
import { useAutomationsStore } from "@/store/automations";
import { AutomationRule } from "@/types/models";
import { useAuth } from "@/hooks/useAuth";

interface AutomationListProps {
  rules: AutomationRule[];
  onEdit: (rule: AutomationRule) => void;
}

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

const TYPE_DESCRIPTIONS: Record<string, string> = {
  booking_confirmation: "Send a confirmation when a booking is created",
  appointment_reminder: "Remind the client before their appointment",
  post_service_followup: "Follow up after a completed appointment",
  review_request: "Ask for a review after the appointment",
  rebooking_nudge: "Reach out to clients inactive for a while",
  no_show_followup: "Reach out when a client doesn't show up",
  invoice_auto_send: "Automatically send invoices to clients",
  cancellation_confirmation: "Confirm when a booking is cancelled",
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  both: "Email & SMS",
};

export function AutomationList({ rules, onEdit }: AutomationListProps) {
  const { toggleRule } = useAutomationsStore();
  const { workspaceId } = useAuth();

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => (
        <motion.div
          key={rule.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-card-bg border border-border-light rounded-xl p-4 flex items-center justify-between gap-4 hover:border-brand/30 transition-colors"
        >
          <button
            onClick={() => onEdit(rule)}
            className="flex-1 text-left cursor-pointer bg-transparent border-none p-0"
          >
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              {TYPE_LABELS[rule.type] ?? rule.type}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              {TYPE_DESCRIPTIONS[rule.type] ?? rule.type}
              {" · "}
              {CHANNEL_LABELS[rule.channel] ?? rule.channel}
              {rule.timingValue && rule.timingUnit && (
                <> · {rule.timingValue} {rule.timingUnit} {
                  rule.type === "post_service_followup" ||
                  rule.type === "review_request" ||
                  rule.type === "rebooking_nudge"
                    ? "after"
                    : "before"
                }</>
              )}
            </p>
          </button>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleRule(rule.id, workspaceId ?? undefined);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                rule.enabled ? "bg-brand" : "bg-border-light"
              }`}
              title={rule.enabled ? "Disable" : "Enable"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-card-bg transition-transform ${
                  rule.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
