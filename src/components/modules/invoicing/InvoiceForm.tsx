"use client";

import { useState, useEffect } from "react";
import { useInvoicesStore } from "@/store/invoices";
import { useClientsStore } from "@/store/clients";
import { Invoice, LineItem, InvoiceStatus } from "@/types/models";
import { generateId } from "@/lib/id";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import type { InvoiceMode } from "@/types/industry-config";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { LineItemEditor } from "@/components/ui/LineItemEditor";
import { MilestoneEditor } from "./MilestoneEditor";

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  invoice?: Invoice;
}

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export function InvoiceForm({ open, onClose, invoice }: InvoiceFormProps) {
  const { addInvoice, updateInvoice } = useInvoicesStore();
  const { clients } = useClientsStore();
  const vocab = useVocabulary();
  const config = useIndustryConfig();

  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>("draft");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [paymentSchedule, setPaymentSchedule] = useState<InvoiceMode>(config.invoiceMode.defaultMode);
  const [depositPercent, setDepositPercent] = useState(50);
  const [milestones, setMilestones] = useState<{ id: string; label: string; percent: number; status: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (invoice) {
        setClientId(invoice.clientId ?? "");
        setDueDate(invoice.dueDate ?? "");
        setNotes(invoice.notes);
        setStatus(invoice.status);
        setLineItems(invoice.lineItems);
        setPaymentSchedule(((invoice as any).paymentSchedule as InvoiceMode) ?? config.invoiceMode.defaultMode);
        setDepositPercent((invoice as any).depositPercent ?? 50);
        setMilestones((invoice as any).milestones ?? []);
      } else {
        setClientId("");
        setDueDate("");
        setNotes("");
        setStatus("draft");
        setLineItems([{ id: generateId(), description: "", quantity: 1, unitPrice: 0 }]);
        setPaymentSchedule(config.invoiceMode.defaultMode);
        setDepositPercent(50);
        setMilestones([]);
      }
    }
  }, [open, invoice, config.invoiceMode.defaultMode]);

  const clientOptions = [
    { value: "", label: "Select a client..." },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ];

  const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const handleSubmit = () => {
    if (saving) return;
    setSaving(true);

    const now = new Date().toISOString();

    const extraFields: Record<string, unknown> = {};
    if (config.invoiceMode.availableModes.length > 1) {
      extraFields.paymentSchedule = paymentSchedule;
      if (paymentSchedule === "deposit-balance") {
        extraFields.depositPercent = depositPercent;
      }
      if (paymentSchedule === "milestone") {
        extraFields.milestones = milestones;
      }
    }

    if (invoice) {
      updateInvoice(invoice.id, {
        clientId: clientId || undefined,
        dueDate: dueDate || undefined,
        notes,
        status,
        lineItems,
        updatedAt: now,
        ...extraFields,
      });
    } else {
      addInvoice({
        clientId: clientId || undefined,
        lineItems,
        status,
        dueDate: dueDate || undefined,
        notes,
        ...extraFields,
      } as any);
    }

    onClose();
    setSaving(false);
  };

  const paymentModeLabels: Record<InvoiceMode, string> = {
    "one-time": "One-Time",
    "recurring": "Recurring",
    "milestone": "Milestone",
    "deposit-balance": "Deposit + Balance",
    "session-pack": "Session Pack",
  };

  return (
    <SlideOver open={open} onClose={onClose} title={invoice ? `Edit ${vocab.invoice}` : vocab.addInvoice}>
      <div className="space-y-1">
        <FormField label={vocab.client}>
          <SelectField
            options={clientOptions}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
        </FormField>

        <FormField label="Status">
          <SelectField
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
          />
        </FormField>

        <FormField label="Due Date">
          <DateField value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </FormField>

        {config.invoiceMode.availableModes.length > 1 && (
          <FormField label="Payment Schedule">
            <SelectField
              options={config.invoiceMode.availableModes.map((m) => ({
                value: m,
                label: paymentModeLabels[m],
              }))}
              value={paymentSchedule}
              onChange={(e) => setPaymentSchedule(e.target.value as InvoiceMode)}
            />
          </FormField>
        )}

        {paymentSchedule === "deposit-balance" && (
          <FormField label="Deposit Percentage">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={depositPercent}
                onChange={(e) => setDepositPercent(Number(e.target.value))}
                min={1}
                max={99}
                className="w-24 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <span className="text-sm text-text-secondary">%</span>
              {total > 0 && (
                <span className="text-xs text-text-tertiary ml-2">
                  Deposit: ${(total * depositPercent / 100).toFixed(2)} / Balance: ${(total * (100 - depositPercent) / 100).toFixed(2)}
                </span>
              )}
            </div>
          </FormField>
        )}

        {paymentSchedule === "milestone" && (
          <FormField label="Milestones">
            <MilestoneEditor milestones={milestones} onChange={setMilestones} />
          </FormField>
        )}

        <FormField label="Line Items">
          <LineItemEditor items={lineItems} onChange={setLineItems} />
        </FormField>

        <FormField label="Notes">
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes..."
          />
        </FormField>

        <div className="flex items-center justify-between pt-4 border-t border-border-light">
          <div className="text-lg font-semibold text-foreground">
            Total: ${total.toFixed(2)}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit}>
              {invoice ? `Update ${vocab.invoice}` : `Create ${vocab.invoice}`}
            </Button>
          </div>
        </div>
      </div>
    </SlideOver>
  );
}
