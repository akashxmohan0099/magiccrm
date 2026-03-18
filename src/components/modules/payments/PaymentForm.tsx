"use client";

import { useState, useEffect } from "react";
import { usePaymentsStore } from "@/store/payments";
import { useClientsStore } from "@/store/clients";
import { useInvoicesStore } from "@/store/invoices";
import { PaymentMethod } from "@/types/models";
import { generateId } from "@/lib/id";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
}

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank-transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export function PaymentForm({ open, onClose }: PaymentFormProps) {
  const { addPayment } = usePaymentsStore();
  const { clients } = useClientsStore();
  const { invoices } = useInvoicesStore();

  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setClientId("");
      setInvoiceId("");
      setMethod("cash");
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
  }, [open]);

  const clientOptions = [
    { value: "", label: "Select a client..." },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ];

  const invoiceOptions = [
    { value: "", label: "No invoice linked" },
    ...invoices
      .filter((inv) => inv.status !== "paid" && inv.status !== "cancelled")
      .map((inv) => ({ value: inv.id, label: `${inv.number}` })),
  ];

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    addPayment({
      amount: parsedAmount,
      clientId: clientId || undefined,
      invoiceId: invoiceId || undefined,
      method,
      date: date || new Date().toISOString().split("T")[0],
      notes,
    });

    onClose();
  };

  return (
    <SlideOver open={open} onClose={onClose} title="Record Payment">
      <div className="space-y-1">
        <FormField label="Amount" required>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min={0}
            step={0.01}
            className="w-full px-3 py-2 bg-card-bg border border-border-warm rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </FormField>

        <FormField label="Client">
          <SelectField
            options={clientOptions}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
        </FormField>

        <FormField label="Invoice">
          <SelectField
            options={invoiceOptions}
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
          />
        </FormField>

        <FormField label="Payment Method">
          <SelectField
            options={METHOD_OPTIONS}
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          />
        </FormField>

        <FormField label="Date">
          <DateField value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>

        <FormField label="Notes">
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment notes..."
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-4 border-t border-border-warm">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Record Payment</Button>
        </div>
      </div>
    </SlideOver>
  );
}
