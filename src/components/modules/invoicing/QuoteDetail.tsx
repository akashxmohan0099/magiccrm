"use client";

import { useState } from "react";
import { Pencil, Trash2, ArrowRightCircle } from "lucide-react";
import { useInvoicesStore } from "@/store/invoices";
import { useClientsStore } from "@/store/clients";
import { Quote } from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface QuoteDetailProps {
  open: boolean;
  onClose: () => void;
  quoteId: string | null;
  onEdit?: (quote: Quote) => void;
}

export function QuoteDetail({ open, onClose, quoteId, onEdit }: QuoteDetailProps) {
  const { quotes, deleteQuote, convertQuoteToInvoice } = useInvoicesStore();
  const { clients } = useClientsStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const quote = quotes.find((q) => q.id === quoteId);

  if (!quote) {
    return (
      <SlideOver open={open} onClose={onClose} title="Quote">
        <p className="text-sm text-text-secondary">Quote not found.</p>
      </SlideOver>
    );
  }

  const client = clients.find((c) => c.id === quote.clientId);
  const total = quote.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const handleConvert = () => {
    convertQuoteToInvoice(quote.id);
    onClose();
  };

  const handleDelete = () => {
    deleteQuote(quote.id);
    onClose();
  };

  return (
    <>
      <SlideOver open={open} onClose={onClose} title={`Quote ${quote.number}`}>
        <div className="space-y-6">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Client</p>
              <p className="text-foreground font-medium">{client?.name ?? "\u2014"}</p>
            </div>
            <StatusBadge status={quote.status} />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Created</p>
              <p className="text-sm text-foreground">
                {new Date(quote.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Valid Until</p>
              <p className="text-sm text-foreground">
                {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : "\u2014"}
              </p>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Line Items</p>
            <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="text-left text-xs font-medium text-text-secondary px-4 py-2">Description</th>
                    <th className="text-center text-xs font-medium text-text-secondary px-4 py-2">Qty</th>
                    <th className="text-right text-xs font-medium text-text-secondary px-4 py-2">Price</th>
                    <th className="text-right text-xs font-medium text-text-secondary px-4 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lineItems.map((li) => (
                    <tr key={li.id} className="border-b border-border-light last:border-b-0">
                      <td className="px-4 py-2 text-sm text-foreground">{li.description || "\u2014"}</td>
                      <td className="px-4 py-2 text-sm text-foreground text-center">{li.quantity}</td>
                      <td className="px-4 py-2 text-sm text-foreground text-right">${li.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm font-medium text-foreground text-right">
                        ${(li.quantity * li.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-3">
              <div className="text-lg font-semibold text-foreground">Total: ${total.toFixed(2)}</div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Notes</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-border-warm">
            <Button variant="primary" size="sm" onClick={handleConvert}>
              <ArrowRightCircle className="w-4 h-4" /> Convert to Invoice
            </Button>
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={() => onEdit(quote)}>
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Quote"
        message={`Are you sure you want to delete quote ${quote.number}? This action cannot be undone.`}
      />
    </>
  );
}
