"use client";

import React, { useState } from "react";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import { useInvoicesStore } from "@/store/invoices";
import { useClientsStore } from "@/store/clients";
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
  const { invoices, updateInvoice, deleteInvoice } = useInvoicesStore();
  const { clients } = useClientsStore();
  const vocab = useVocabulary();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);

  const invoice = invoices.find((inv) => inv.id === invoiceId);

  if (!invoice) {
    return (
      <SlideOver open={open} onClose={onClose} title={vocab.invoice}>
        <p className="text-sm text-text-secondary">{vocab.invoice} not found.</p>
      </SlideOver>
    );
  }

  const client = clients.find((c) => c.id === invoice.clientId);
  const total = invoice.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const handleMarkPaid = () => {
    updateInvoice(invoice.id, { status: "paid", updatedAt: new Date().toISOString() });
  };

  const handleDelete = () => {
    deleteInvoice(invoice.id);
    onClose();
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
            <div className="flex justify-end mt-3">
              <div className="text-lg font-semibold text-foreground">Total: ${total.toFixed(2)}</div>
            </div>

            <FeatureSection moduleId="quotes-invoicing" featureId="tipping" featureLabel="Tipping">
              <div className="flex items-center justify-between px-4 py-2 bg-surface/30 rounded-lg">
                <span className="text-[13px] text-text-secondary">Tip</span>
                <div className="flex items-center gap-2">
                  {["$5", "$10", "$20"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipAmount(parseFloat(t.replace("$", "")))}
                      className={`px-2 py-1 rounded text-[12px] cursor-pointer ${
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
                    className="w-16 px-2 py-1 bg-surface border border-border-light rounded text-[12px] text-center"
                  />
                </div>
              </div>
            </FeatureSection>
          </div>

          <FeatureSection moduleId="quotes-invoicing" featureId="partial-payments" featureLabel="Partial Payments">
            <div className="mt-3 flex items-center gap-2">
              <button className="text-[12px] font-medium text-primary hover:underline cursor-pointer">Record Partial Payment</button>
              <span className="text-[11px] text-text-tertiary">Accept a deposit or split payment</span>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="quotes-invoicing" featureId="payment-links" featureLabel="Payment Links">
            <div className="mt-3 bg-surface rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-[12px] font-mono text-text-secondary truncate">pay.magic/inv/...</span>
              <button className="text-[11px] text-primary font-medium cursor-pointer hover:underline ml-2 flex-shrink-0">Copy Link</button>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="quotes-invoicing" featureId="overdue-escalation" featureLabel="Overdue Escalation">
            <div className="mt-3 p-3 bg-surface/50 rounded-lg">
              <p className="text-[12px] text-text-secondary">Escalation: <span className="font-medium text-foreground">Reminder → Warning → Final Notice</span></p>
              <p className="text-[10px] text-text-tertiary mt-0.5">Auto-escalates overdue invoices through severity levels.</p>
            </div>
          </FeatureSection>

          <FeatureSection moduleId="quotes-invoicing" featureId="client-invoice-portal" featureLabel="Client Invoice Page">
            <div className="mt-3 bg-surface rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-[12px] text-text-secondary">Client can view this invoice at a branded page</span>
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
          <div className="flex items-center gap-2 pt-4 border-t border-border-light">
            {invoice.status !== "paid" && (
              <Button variant="primary" size="sm" onClick={handleMarkPaid}>
                <CheckCircle className="w-4 h-4" /> Mark as Paid
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
