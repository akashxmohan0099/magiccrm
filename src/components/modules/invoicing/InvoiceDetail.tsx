"use client";

import { useState } from "react";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import { useInvoicesStore } from "@/store/invoices";
import { useClientsStore } from "@/store/clients";
import { Invoice } from "@/types/models";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface InvoiceDetailProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string | null;
  onEdit?: (invoice: Invoice) => void;
}

export function InvoiceDetail({ open, onClose, invoiceId, onEdit }: InvoiceDetailProps) {
  const { invoices, updateInvoice, deleteInvoice } = useInvoicesStore();
  const { clients } = useClientsStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invoice = invoices.find((inv) => inv.id === invoiceId);

  if (!invoice) {
    return (
      <SlideOver open={open} onClose={onClose} title="Invoice">
        <p className="text-sm text-text-secondary">Invoice not found.</p>
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
      <SlideOver open={open} onClose={onClose} title={`Invoice ${invoice.number}`}>
        <div className="space-y-6">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Client</p>
              <p className="text-foreground font-medium">{client?.name ?? "\u2014"}</p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

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
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${invoice.number}? This action cannot be undone.`}
      />
    </>
  );
}
