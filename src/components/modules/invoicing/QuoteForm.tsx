"use client";

import { useState, useEffect } from "react";
import { useInvoicesStore } from "@/store/invoices";
import { useClientsStore } from "@/store/clients";
import { Quote, LineItem } from "@/types/models";
import { generateId } from "@/lib/id";
import { useVocabulary } from "@/hooks/useVocabulary";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { LineItemEditor } from "@/components/ui/LineItemEditor";

interface QuoteFormProps {
  open: boolean;
  onClose: () => void;
  quote?: Quote;
}

export function QuoteForm({ open, onClose, quote }: QuoteFormProps) {
  const { addQuote, updateQuote } = useInvoicesStore();
  const { clients } = useClientsStore();
  const vocab = useVocabulary();

  const [clientId, setClientId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    if (open) {
      if (quote) {
        setClientId(quote.clientId ?? "");
        setValidUntil(quote.validUntil ?? "");
        setNotes(quote.notes);
        setLineItems(quote.lineItems);
      } else {
        setClientId("");
        setValidUntil("");
        setNotes("");
        setLineItems([{ id: generateId(), description: "", quantity: 1, unitPrice: 0 }]);
      }
    }
  }, [open, quote]);

  const clientOptions = [
    { value: "", label: "Select a client..." },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ];

  const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const handleSubmit = () => {
    const now = new Date().toISOString();

    if (quote) {
      updateQuote(quote.id, {
        clientId: clientId || undefined,
        validUntil: validUntil || undefined,
        notes,
        lineItems,
        updatedAt: now,
      });
    } else {
      addQuote({
        clientId: clientId || undefined,
        lineItems,
        status: "draft",
        validUntil: validUntil || undefined,
        notes,
      });
    }

    onClose();
  };

  return (
    <SlideOver open={open} onClose={onClose} title={quote ? `Edit ${vocab.quote}` : `New ${vocab.quote}`}>
      <div className="space-y-1">
        <FormField label={vocab.client}>
          <SelectField
            options={clientOptions}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
        </FormField>

        <FormField label="Valid Until">
          <DateField value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
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

        <div className="flex items-center justify-between pt-4 border-t border-border-light">
          <div className="text-lg font-semibold text-foreground">
            Total: ${total.toFixed(2)}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {quote ? `Update ${vocab.quote}` : `Create ${vocab.quote}`}
            </Button>
          </div>
        </div>
      </div>
    </SlideOver>
  );
}
