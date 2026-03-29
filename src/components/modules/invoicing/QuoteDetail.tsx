"use client";

import { useState } from "react";
import { Pencil, Trash2, ArrowRightCircle, FileDown, Eye } from "lucide-react";
import { useInvoicesStore } from "@/store/invoices";
import { useClientsStore } from "@/store/clients";
import { useBrandSettingsStore } from "@/store/brand-settings";
import { useOnboardingStore } from "@/store/onboarding";
import { Quote } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
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
  const vocab = useVocabulary();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const brandColor = useBrandSettingsStore((s) => s.brandColor);
  const logoBase64 = useBrandSettingsStore((s) => s.logoBase64);
  const tagline = useBrandSettingsStore((s) => s.tagline);
  const invoiceTemplate = useBrandSettingsStore((s) => s.invoiceTemplate);
  const businessName = useOnboardingStore((s) => s.businessContext.businessName) || "My Business";

  const quote = quotes.find((q) => q.id === quoteId);

  if (!quote) {
    return (
      <SlideOver open={open} onClose={onClose} title={vocab.quote}>
        <p className="text-sm text-text-secondary">{vocab.quote} not found.</p>
      </SlideOver>
    );
  }

  const client = clients.find((c) => c.id === quote.clientId);
  const total = quote.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const buildPdfPayload = () => ({
    templateId: invoiceTemplate,
    documentType: "quote",
    businessName,
    tagline,
    logoBase64,
    brandColor,
    clientName: client?.name || "",
    clientEmail: client?.email || "",
    clientAddress: ((client as unknown as Record<string, unknown>)?.address as string) || "",
    number: quote.number,
    date: new Date(quote.createdAt).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" }),
    dueDate: quote.validUntil
      ? new Date(quote.validUntil).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })
      : "N/A",
    status: quote.status.charAt(0).toUpperCase() + quote.status.slice(1),
    items: quote.lineItems.map((li) => ({
      description: li.description || "",
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      discount: li.discount ?? 0,
      amount: li.quantity * li.unitPrice - (li.discount ?? 0),
    })),
    subtotal: total,
    taxRate: 0,
    taxAmount: 0,
    total,
    notes: quote.notes,
  });

  const handleDownloadPdf = async () => {
    const res = await fetch("/api/invoices/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPdfPayload()),
    });
    if (!res.ok) return;
    const html = await res.text();
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handlePreview = async () => {
    const res = await fetch("/api/invoices/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPdfPayload()),
    });
    if (!res.ok) return;
    setPreviewHtml(await res.text());
  };

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
      <SlideOver open={open} onClose={onClose} title={`${vocab.quote} ${quote.number}`}>
        <div className="space-y-6">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">{vocab.client}</p>
              <p className="text-foreground font-medium">{client?.name ?? "\u2014"}</p>
            </div>
            <StatusBadge status={quote.status} />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border-light">
            <Button variant="primary" size="sm" onClick={handleConvert}>
              <ArrowRightCircle className="w-4 h-4" /> Convert to {vocab.invoice}
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePreview}>
              <Eye className="w-4 h-4" /> Preview
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadPdf}>
              <FileDown className="w-4 h-4" /> PDF
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

          {/* PDF Preview */}
          {previewHtml && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Preview</p>
                <button onClick={() => setPreviewHtml(null)} className="text-xs text-text-tertiary hover:text-foreground cursor-pointer">Close</button>
              </div>
              <div className="border border-border-light rounded-xl overflow-hidden bg-white" style={{ height: 480 }}>
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full"
                  title="Quote Preview"
                  style={{ border: "none", transform: "scale(0.65)", transformOrigin: "top left", width: "154%", height: "154%" }}
                />
              </div>
            </div>
          )}
        </div>
      </SlideOver>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={`Delete ${vocab.quote}`}
        message={`Are you sure you want to delete ${vocab.quote.toLowerCase()} ${quote.number}? This action cannot be undone.`}
      />
    </>
  );
}
