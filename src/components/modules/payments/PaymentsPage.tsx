"use client";

import { useState } from "react";
import { Plus, DollarSign, CreditCard } from "lucide-react";
import { usePaymentsStore } from "@/store/payments";
import { useClientsStore } from "@/store/clients";
import { useInvoicesStore } from "@/store/invoices";
import { Payment } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { PaymentForm } from "./PaymentForm";

export function PaymentsPage() {
  const { payments, getTotalRevenue } = usePaymentsStore();
  const { clients } = useClientsStore();
  const { invoices } = useInvoicesStore();
  const [formOpen, setFormOpen] = useState(false);

  const totalRevenue = getTotalRevenue();

  const outstandingInvoices = invoices.filter(
    (inv) => inv.status === "sent" || inv.status === "overdue"
  );
  const outstandingCount = outstandingInvoices.length;
  const outstandingTotal = outstandingInvoices.reduce(
    (sum, inv) =>
      sum +
      inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0),
    0
  );

  const getClientName = (clientId?: string) => {
    if (!clientId) return "\u2014";
    const client = clients.find((c) => c.id === clientId);
    return client?.name ?? "\u2014";
  };

  const getInvoiceNumber = (invoiceId?: string) => {
    if (!invoiceId) return "\u2014";
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    return invoice?.number ?? "\u2014";
  };

  const formatMethod = (method: string) =>
    method.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const columns: Column<Payment>[] = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (p) => new Date(p.date).toLocaleDateString(),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (p) => `$${p.amount.toFixed(2)}`,
    },
    {
      key: "clientId",
      label: "Client",
      sortable: true,
      render: (p) => getClientName(p.clientId),
    },
    {
      key: "method",
      label: "Method",
      sortable: true,
      render: (p) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          <CreditCard className="w-3.5 h-3.5 text-text-secondary" />
          {formatMethod(p.method)}
        </span>
      ),
    },
    {
      key: "invoiceId",
      label: "Invoice",
      sortable: false,
      render: (p) => getInvoiceNumber(p.invoiceId),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Track payments and revenue from your clients."
        actions={
          <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4" /> Record Payment
          </Button>
        }
      />

      {/* Revenue card */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-4 bg-card-bg border border-border-light rounded-xl px-6 py-4">
          <div className="p-2.5 bg-surface rounded-lg">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <FeatureSection moduleId="payments" featureId="outstanding-balance-report" featureLabel="Outstanding Balances">
        <div className="bg-card-bg rounded-xl border border-border-light p-4 mb-4">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Outstanding</h3>
          <p className="text-[24px] font-bold text-foreground">${outstandingTotal.toLocaleString()}</p>
          <p className="text-[12px] text-text-tertiary">{outstandingCount} unpaid invoice{outstandingCount !== 1 ? "s" : ""}</p>
        </div>
      </FeatureSection>

      {payments.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="w-10 h-10" />}
          title="No payments yet"
          description="Record your first payment to start tracking revenue."
          actionLabel="Record Payment"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<Payment>
            columns={columns}
            data={payments}
            keyExtractor={(p) => p.id}
          />
        </div>
      )}

      <PaymentForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
