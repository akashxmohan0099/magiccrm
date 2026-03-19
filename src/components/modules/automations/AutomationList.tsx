"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAutomationsStore } from "@/store/automations";
import { AutomationRule } from "@/types/models";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface AutomationListProps {
  rules: AutomationRule[];
  onEdit: (rule: AutomationRule) => void;
}

const TRIGGER_LABELS: Record<string, string> = {
  "lead-created": "When a lead is created",
  "lead-stage-changed": "When a lead stage changes",
  "client-created": "When a client is created",
  "invoice-sent": "When an invoice is sent",
  "invoice-overdue": "When an invoice is overdue",
  "booking-created": "When a booking is created",
  "booking-cancelled": "When a booking is cancelled",
  "job-completed": "When a job is completed",
  "ticket-created": "When a ticket is created",
};

const ACTION_LABELS: Record<string, string> = {
  "send-email": "Send an email",
  "create-task": "Create a task",
  "update-status": "Update status",
  "send-notification": "Send a notification",
  "create-follow-up": "Create a follow-up",
};

export function AutomationList({ rules, onEdit }: AutomationListProps) {
  const { toggleRule, deleteRule } = useAutomationsStore();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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
              {rule.name}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              {TRIGGER_LABELS[rule.trigger] ?? rule.trigger} &rarr;{" "}
              {ACTION_LABELS[rule.action] ?? rule.action}
            </p>
          </button>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleRule(rule.id);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                rule.enabled ? "bg-brand" : "bg-border-light"
              }`}
              title={rule.enabled ? "Disable" : "Enable"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  rule.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(rule.id);
              }}
              className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-red-500 transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteRule(deleteTarget);
          setDeleteTarget(null);
        }}
        title="Delete Automation"
        message="Are you sure you want to delete this automation rule? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
