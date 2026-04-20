"use client";

import { useState } from "react";
import {
  CheckCircle, XCircle,
  Send, Link2, Trash2, Copy,
} from "lucide-react";
import { PaymentDocument } from "@/types/models";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SlideOver } from "@/components/ui/SlideOver";
import { toast } from "@/components/ui/Toast";

export function PaymentDetail({
  doc, items, clientName, onClose, onUpdate, onDelete, onViewClient, fmtDate, stripeConnected,
}: {
  doc: PaymentDocument | null;
  items: { id: string; description: string; quantity: number; unitPrice: number; sortOrder: number }[];
  clientName?: string;
  onClose: () => void;
  onUpdate: (data: Partial<PaymentDocument>) => void;
  onDelete: () => void;
  onViewClient: () => void;
  fmtDate: (iso?: string) => string;
  stripeConnected: boolean;
}) {
  const [generatingLink, setGeneratingLink] = useState(false);

  if (!doc) return null;

  const handleGeneratePaymentLink = async () => {
    if (generatingLink) return;
    if (!stripeConnected) {
      toast("Connect Stripe in Settings to generate payment links", "warning");
      return;
    }

    setGeneratingLink(true);

    try {
      const res = await fetch("/api/integrations/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: doc.id, currency: "aud" }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        toast(data.error || "Failed to generate payment link", "error");
        return;
      }

      onUpdate({
        stripeHostedUrl: data.url,
        paymentMethod: "stripe",
        sentAt: doc.sentAt ?? new Date().toISOString(),
        status: doc.status === "draft" ? "sent" : doc.status,
      });
      await navigator.clipboard.writeText(data.url);
      window.open(data.url, "_blank", "noopener,noreferrer");
      toast("Payment link generated and copied");
    } catch {
      toast("Failed to generate payment link", "error");
    } finally {
      setGeneratingLink(false);
    }
  };

  return (
    <SlideOver open onClose={onClose} title="">
      <div className="-mt-2 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">{doc.documentNumber}</h3>
              <span className="text-[11px] font-medium text-text-tertiary uppercase bg-surface px-2 py-0.5 rounded">{doc.label}</span>
            </div>
            <p className="text-[12px] text-text-secondary mt-0.5"><span onClick={onViewClient} className="text-primary font-medium cursor-pointer hover:underline">{clientName || "—"}</span> · {fmtDate(doc.createdAt)}</p>
            <div className="mt-2"><StatusBadge status={doc.status} /></div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>

        {/* Total */}
        <div className="bg-surface rounded-lg p-5 border border-border-light text-center">
          <p className="text-[32px] font-bold text-foreground">${doc.total.toLocaleString()}</p>
          <p className="text-[12px] text-text-tertiary mt-1">
            {doc.status === "paid" ? `Paid ${fmtDate(doc.paidAt)}` : doc.dueDate ? `Due ${fmtDate(doc.dueDate)}` : "No due date"}
          </p>
        </div>

        {/* Line items */}
        <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border-light">
            <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Line Items</h4>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-text-tertiary">No line items.</p>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-border-light last:border-0">
                  <div>
                    <p className="text-[13px] text-foreground">{item.description}</p>
                    <p className="text-[11px] text-text-tertiary">{item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                  </div>
                  <p className="text-[13px] font-semibold text-foreground">${(item.quantity * item.unitPrice).toFixed(2)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 bg-foreground/5">
                <p className="text-[13px] font-bold text-foreground">Total</p>
                <p className="text-[15px] font-bold text-foreground">${doc.total.toFixed(2)}</p>
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className="bg-surface rounded-lg p-4 border border-border-light space-y-3">
          <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Details</h4>
          {doc.paymentMethod && (
            <div className="flex justify-between"><span className="text-[12px] text-text-tertiary">Method</span><span className="text-[13px] text-foreground capitalize">{doc.paymentMethod.replace(/_/g, " ")}</span></div>
          )}
          <div className="flex justify-between"><span className="text-[12px] text-text-tertiary">Created</span><span className="text-[13px] text-foreground">{fmtDate(doc.createdAt)}</span></div>
          {doc.sentAt && <div className="flex justify-between"><span className="text-[12px] text-text-tertiary">Sent</span><span className="text-[13px] text-foreground">{fmtDate(doc.sentAt)}</span></div>}
          {doc.paidAt && <div className="flex justify-between"><span className="text-[12px] text-text-tertiary">Paid</span><span className="text-[13px] text-foreground">{fmtDate(doc.paidAt)}</span></div>}
          {doc.notes && <div><span className="text-[12px] text-text-tertiary block mb-1">Notes</span><p className="text-[13px] text-foreground">{doc.notes}</p></div>}
        </div>

        {/* Actions */}
        <div className="bg-surface rounded-lg p-4 border border-border-light space-y-2">
          <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Actions</h4>

          {doc.status === "draft" && (
            <button onClick={() => onUpdate({ status: "sent", sentAt: new Date().toISOString() })}
              className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
              <Send className="w-4 h-4 text-text-secondary group-hover:text-primary" /> Send to Client
            </button>
          )}

          {(doc.status === "sent" || doc.status === "overdue") && (
            <>
              <button onClick={() => { onUpdate({ status: "paid", paidAt: new Date().toISOString(), paymentMethod: "cash" }); toast("Marked as paid"); }}
                className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
                <CheckCircle className="w-4 h-4 text-text-secondary group-hover:text-emerald-500" /> Mark as Paid (Cash)
              </button>
              <button onClick={() => { onUpdate({ status: "paid", paidAt: new Date().toISOString(), paymentMethod: "bank_transfer" }); toast("Marked as paid"); }}
                className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
                <CheckCircle className="w-4 h-4 text-text-secondary group-hover:text-emerald-500" /> Mark as Paid (Bank Transfer)
              </button>
              <button onClick={() => { onUpdate({ status: "paid", paidAt: new Date().toISOString(), paymentMethod: "card_in_person" }); toast("Marked as paid"); }}
                className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
                <CheckCircle className="w-4 h-4 text-text-secondary group-hover:text-emerald-500" /> Mark as Paid (Card in Person)
              </button>
            </>
          )}

          {doc.stripeHostedUrl && (
            <button onClick={() => { navigator.clipboard.writeText(doc.stripeHostedUrl || ""); toast("Payment link copied!"); }}
              className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
              <Copy className="w-4 h-4 text-text-secondary group-hover:text-primary" /> Copy Payment Link
            </button>
          )}

          {!doc.stripeHostedUrl && doc.status !== "paid" && doc.status !== "cancelled" && (
            <button onClick={handleGeneratePaymentLink}
              disabled={generatingLink}
              className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-foreground hover:bg-card-bg transition-colors w-full text-left cursor-pointer group">
              <Link2 className="w-4 h-4 text-text-secondary group-hover:text-primary" />
              {generatingLink ? "Generating Payment Link..." : "Generate Payment Link"}
            </button>
          )}

          {doc.status !== "paid" && doc.status !== "cancelled" && (
            <button onClick={() => onUpdate({ status: "cancelled" })}
              className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] text-red-500 hover:bg-red-50 transition-colors w-full text-left cursor-pointer">
              <XCircle className="w-4 h-4" /> Cancel Document
            </button>
          )}
        </div>
      </div>
    </SlideOver>
  );
}
