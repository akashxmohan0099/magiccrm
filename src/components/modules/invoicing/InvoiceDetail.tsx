"use client";

import React, { useState } from "react";
import { Pencil, Trash2, CheckCircle, Send, FileDown, Eye } from "lucide-react";
import { useInvoicesStore, calculateInvoiceTotal } from "@/store/invoices";
import { useClientsStore } from "@/store/clients";
import { useBrandSettingsStore } from "@/store/brand-settings";
import { useOnboardingStore } from "@/store/onboarding";
import { useAuth } from "@/hooks/useAuth";
import { Invoice } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FeatureSection } from "@/components/modules/FeatureSection";

interface InvoiceDetailProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string | null;
  onEdit?: (invoice: Invoice) => void;
}

export function InvoiceDetail({ open, onClose, invoiceId, onEdit }: InvoiceDetailProps) {
  const { invoices, updateInvoice, deleteInvoice, sendInvoice } = useInvoicesStore();
  const { clients } = useClientsStore();
  const { workspaceId } = useAuth();
  const vocab = useVocabulary();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [sending, setSending] = useState(false);

  const invoice = invoices.find((inv) => inv.id === invoiceId);

  if (!invoice) {
    return (
      <SlideOver open={open} onClose={onClose} title={vocab.invoice}>
        <p className="text-sm text-text-secondary">{vocab.invoice} not found.</p>
      </SlideOver>
    );
  }

  const client = clients.find((c) => c.id === invoice.clientId);
  const { subtotal, taxAmount, total } = calculateInvoiceTotal(invoice);

  const handleMarkPaid = () => {
    updateInvoice(invoice.id, { status: "paid", updatedAt: new Date().toISOString() });
  };

  const handleDelete = () => {
    deleteInvoice(invoice.id);
    onClose();
  };

  const handleSend = async () => {
    if (!workspaceId || sending) return;
    setSending(true);
    await sendInvoice(invoice.id, workspaceId);
    setSending(false);
  };

  const brandColor = useBrandSettingsStore((s) => s.brandColor);
  const logoBase64 = useBrandSettingsStore((s) => s.logoBase64);
  const tagline = useBrandSettingsStore((s) => s.tagline);
  const invoiceTemplate = useBrandSettingsStore((s) => s.invoiceTemplate);
  const businessName = useOnboardingStore((s) => s.businessContext.businessName) || "My Business";

  const buildPdfPayload = () => ({
    templateId: invoiceTemplate,
    documentType: "invoice",
    businessName,
    tagline,
    logoBase64,
    brandColor,
    clientName: client?.name || "",
    clientEmail: client?.email || "",
    clientAddress: ((client as unknown as Record<string, unknown>)?.address as string) || "",
    number: invoice.number,
    date: new Date(invoice.createdAt).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" }),
    dueDate: invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })
      : "On receipt",
    status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1),
    items: invoice.lineItems.map((li) => ({
      description: li.description || "",
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      discount: li.discount ?? 0,
      amount: li.quantity * li.unitPrice - (li.discount ?? 0),
    })),
    subtotal,
    taxRate: invoice.taxRate ?? 0,
    taxAmount,
    total,
    notes: invoice.notes,
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

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const handlePreview = async () => {
    const res = await fetch("/api/invoices/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPdfPayload()),
    });
    if (!res.ok) return;
    setPreviewHtml(await res.text());
  };

  return (
    <>
      <SlideOver open={open} onClose={onClose} title={`${vocab.invoice} ${invoice.number}`}>
        <div className="space-y-6">
          <FeatureSection moduleId="quotes-invoicing" featureId="invoice-status-workflow" featureLabel="Status Workflow">
            <div className="flex items-center gap-1 mb-4">
              {["draft", "sent", "viewed", "paid"].map((s, i) => (
                <React.Fragment key={s}>
                  <div className={`px-2 py-1 rounded text-[10px] font-medium capitalize ${
                    s === invoice.status ? "bg-foreground text-white" :
                    ["draft","sent","viewed","paid"].indexOf(s) < ["draft","sent","viewed","paid"].indexOf(invoice.status) ? "bg-primary/20 text-foreground" :
                    "bg-surface text-text-tertiary"
                  }`}>{s}</div>
                  {i < 3 && <div className="w-4 h-px bg-border-light" />}
                </React.Fragment>
              ))}
            </div>
          </FeatureSection>

          {/* Header info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">{vocab.client}</p>
              <p className="text-foreground font-medium">{client?.name ?? "\u2014"}</p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Created</p>
              <p className="text-sm text-foreground">
                {new Date(invoice.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Due Date</p>
              <p className="text-sm text-foreground">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "\u2014"}
              </p>
            </div>
          </div>

          {/* Recurring badge */}
          {invoice.recurringSchedule && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Recurring: {invoice.recurringSchedule}
              </span>
            </div>
          )}

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
                  {invoice.lineItems.map((li) => (
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

            {/* Totals with tax breakdown */}
            <div className="flex flex-col items-end mt-3 gap-1">
              {invoice.taxRate && invoice.taxRate > 0 ? (
                <>
                  <div className="text-sm text-text-secondary">Subtotal: ${subtotal.toFixed(2)}</div>
                  <div className="text-sm text-text-secondary">Tax ({invoice.taxRate}%): ${taxAmount.toFixed(2)}</div>
                  <div className="text-lg font-semibold text-foreground">Total: ${total.toFixed(2)}</div>
                </>
              ) : (
                <div className="text-lg font-semibold text-foreground">Total: ${total.toFixed(2)}</div>
              )}
            </div>

            <FeatureSection moduleId="quotes-invoicing" featureId="tipping" featureLabel="Tipping">
              <div className="flex items-center justify-between px-4 py-2 bg-surface/30 rounded-lg">
                <span className="text-[13px] text-text-secondary">Tip</span>
                <div className="flex items-center gap-2">
                  {["$5", "$10", "$20"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipAmount(parseFloat(t.replace("$", "")))}
                      className={`px-2 py-1 rounded text-xs cursor-pointer ${
                        tipAmount === parseFloat(t.replace("$", ""))
                          ? "bg-primary/20 text-foreground font-medium"
                          : "bg-surface text-text-secondary hover:bg-surface/80"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  <input
                    type="number"
                    step="0.01"
                    value={tipAmount || ""}
                    onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Custom"
                    className="w-16 px-2 py-1 bg-surface border border-border-light rounded text-xs text-center"
                  />
                </div>
              </div>
            </FeatureSection>
          </div>

          <FeatureSection moduleId="quotes-invoicing" featureId="partial-payments" featureLabel="Partial Payments">
            <div className="mt-3 flex items-center gap-2">
              <button className="text-xs font-medium text-primary hover:underline cursor-pointer">Record Partial Payment</button>
              <span className="text-[11px] text-text-tertiary">Accept a deposit or split payment</span>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="quotes-invoicing" featureId="payment-links" featureLabel="Payment Links">
            <div className="mt-3 bg-surface rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-mono text-text-secondary truncate">pay.magic/inv/...</span>
              <button className="text-[11px] text-primary font-medium cursor-pointer hover:underline ml-2 flex-shrink-0">Copy Link</button>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="quotes-invoicing" featureId="overdue-escalation" featureLabel="Overdue Escalation">
            <div className="mt-3 p-3 bg-surface/50 rounded-lg">
              <p className="text-xs text-text-secondary">Escalation: <span className="font-medium text-foreground">Reminder → Warning → Final Notice</span></p>
              <p className="text-[10px] text-text-tertiary mt-0.5">Auto-escalates overdue invoices through severity levels.</p>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="quotes-invoicing" featureId="client-invoice-portal" featureLabel="Client Invoice Page">
            <div className="mt-3 bg-surface rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-text-secondary">Client can view this invoice at a branded page</span>
              <button className="text-[11px] text-primary font-medium cursor-pointer hover:underline">Preview</button>
            </div>
          </FeatureSection>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Notes</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border-light">
            {invoice.status === "draft" && (
              <Button variant="primary" size="sm" onClick={handleSend} loading={sending}>
                <Send className="w-4 h-4" /> Send to Client
              </Button>
            )}
            {invoice.status !== "paid" && invoice.status !== "draft" && (
              <Button variant="primary" size="sm" onClick={handleMarkPaid}>
                <CheckCircle className="w-4 h-4" /> Mark as Paid
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handlePreview}>
              <Eye className="w-4 h-4" /> Preview
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadPdf}>
              <FileDown className="w-4 h-4" /> PDF
            </Button>
            {invoice.status !== "draft" && invoice.status !== "paid" && (
              <Button variant="secondary" size="sm" onClick={handleSend} loading={sending}>
                <Send className="w-4 h-4" /> Resend
              </Button>
            )}
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={() => onEdit(invoice)}>
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
                  title="Invoice Preview"
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
        title={`Delete ${vocab.invoice}`}
        message={`Are you sure you want to delete ${vocab.invoice.toLowerCase()} ${invoice.number}? This action cannot be undone.`}
      />
    </>
  );
}
