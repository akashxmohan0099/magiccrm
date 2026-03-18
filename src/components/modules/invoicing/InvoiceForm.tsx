"use client";

import { useState, useEffect } from "react";
import { useInvoicesStore } from "@/store/invoices";
import { useClientsStore } from "@/store/clients";
import { Invoice, LineItem, InvoiceStatus } from "@/types/models";
import { generateId } from "@/lib/id";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { LineItemEditor } from "@/components/ui/LineItemEditor";

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

  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>("draft");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    if (open) {
      if (invoice) {
        setClientId(invoice.clientId ?? "");
        setDueDate(invoice.dueDate ?? "");
        setNotes(invoice.notes);
        setStatus(invoice.status);
        setLineItems(invoice.lineItems);
      } else {
        setClientId("");
        setDueDate("");
        setNotes("");
        setStatus("draft");
        setLineItems([{ id: generateId(), description: "", quantity: 1, unitPrice: 0 }]);
      }
    }
  }, [open, invoice]);

  const clientOptions = [
    { value: "", label: "Select a client..." },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ];

  const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const handleSubmit = () => {
    const now = new Date().toISOString();

    if (invoice) {
      updateInvoice(invoice.id, {
        clientId: clientId || undefined,
        dueDate: dueDate || undefined,
        notes,
        status,
        lineItems,
        updatedAt: now,
      });
    } else {
      addInvoice({
        clientId: clientId || undefined,
        lineItems,
        status,
        dueDate: dueDate || undefined,
        notes,
      });
    }

    onClose();
  };

  return (
    <SlideOver open={open} onClose={onClose} title={invoice ? "Edit Invoice" : "New Invoice"}>
      <div className="space-y-1">
        <FormField label="Client">
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

        <div className="flex items-center justify-between pt-4 border-t border-border-warm">
          <div className="text-lg font-semibold text-foreground">
            Total: ${total.toFixed(2)}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {invoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </div>
        </div>
      </div>
    </SlideOver>
  );
}
