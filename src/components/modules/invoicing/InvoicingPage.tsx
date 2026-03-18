"use client";

import { useState } from "react";
import { Plus, FileText, Receipt } from "lucide-react";
import { useInvoicesStore } from "@/store/invoices";
import { useClientsStore } from "@/store/clients";
import { Invoice, Quote } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceDetail } from "./InvoiceDetail";
import { QuoteForm } from "./QuoteForm";
import { QuoteDetail } from "./QuoteDetail";

const TABS = [
  { id: "invoices", label: "Invoices" },
  { id: "quotes", label: "Quotes" },
];

export function InvoicingPage() {
  const { invoices, quotes } = useInvoicesStore();
  const { clients } = useClientsStore();
  const [activeTab, setActiveTab] = useState("invoices");
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>(undefined);
  const [detailInvoiceId, setDetailInvoiceId] = useState<string | null>(null);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>(undefined);
  const [detailQuoteId, setDetailQuoteId] = useState<string | null>(null);

  const getClientName = (clientId?: string) => {
    if (!clientId) return "\u2014";
    const client = clients.find((c) => c.id === clientId);
    return client?.name ?? "\u2014";
  };

  const getTotal = (lineItems: { quantity: number; unitPrice: number }[]) =>
    lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const invoiceColumns: Column<Invoice>[] = [
    { key: "number", label: "Invoice #", sortable: true },
    {
      key: "clientId",
      label: "Client",
      sortable: true,
      render: (inv) => getClientName(inv.clientId),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (inv) => <StatusBadge status={inv.status} />,
    },
    {
      key: "total",
      label: "Total",
      sortable: false,
      render: (inv) => `$${getTotal(inv.lineItems).toFixed(2)}`,
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      render: (inv) => inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "\u2014",
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (inv) => new Date(inv.createdAt).toLocaleDateString(),
    },
  ];

  const quoteColumns: Column<Quote>[] = [
    { key: "number", label: "Quote #", sortable: true },
    {
      key: "clientId",
      label: "Client",
      sortable: true,
      render: (q) => getClientName(q.clientId),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (q) => <StatusBadge status={q.status} />,
    },
    {
      key: "total",
      label: "Total",
      sortable: false,
      render: (q) => `$${getTotal(q.lineItems).toFixed(2)}`,
    },
    {
      key: "validUntil",
      label: "Valid Until",
      sortable: true,
      render: (q) => q.validUntil ? new Date(q.validUntil).toLocaleDateString() : "\u2014",
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (q) => new Date(q.createdAt).toLocaleDateString(),
    },
  ];

  const handleNewInvoice = () => {
    setEditingInvoice(undefined);
    setInvoiceFormOpen(true);
  };

  const handleNewQuote = () => {
    setEditingQuote(undefined);
    setQuoteFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Quotes & Invoicing"
        description="Create and manage quotes and invoices for your clients."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleNewQuote}>
              <FileText className="w-4 h-4" /> New Quote
            </Button>
            <Button variant="primary" size="sm" onClick={handleNewInvoice}>
              <Plus className="w-4 h-4" /> New Invoice
            </Button>
          </div>
        }
      />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "invoices" && (
        <>
          {invoices.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-10 h-10" />}
              title="No invoices yet"
              description="Create your first invoice to start billing clients."
              actionLabel="New Invoice"
              onAction={handleNewInvoice}
            />
          ) : (
            <div className="bg-card-bg rounded-xl border border-border-warm overflow-hidden">
              <DataTable<Invoice>
                columns={invoiceColumns}
                data={invoices}
                keyExtractor={(inv) => inv.id}
                onRowClick={(inv) => setDetailInvoiceId(inv.id)}
              />
            </div>
          )}
        </>
      )}

      {activeTab === "quotes" && (
        <>
          {quotes.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-10 h-10" />}
              title="No quotes yet"
              description="Create a quote to send a pricing proposal to a client."
              actionLabel="New Quote"
              onAction={handleNewQuote}
            />
          ) : (
            <div className="bg-card-bg rounded-xl border border-border-warm overflow-hidden">
              <DataTable<Quote>
                columns={quoteColumns}
                data={quotes}
                keyExtractor={(q) => q.id}
                onRowClick={(q) => setDetailQuoteId(q.id)}
              />
            </div>
          )}
        </>
      )}

      <InvoiceForm
        open={invoiceFormOpen}
        onClose={() => {
          setInvoiceFormOpen(false);
          setEditingInvoice(undefined);
        }}
        invoice={editingInvoice}
      />

      <InvoiceDetail
        open={detailInvoiceId !== null}
        onClose={() => setDetailInvoiceId(null)}
        invoiceId={detailInvoiceId}
        onEdit={(inv) => {
          setDetailInvoiceId(null);
          setEditingInvoice(inv);
          setInvoiceFormOpen(true);
        }}
      />

      <QuoteForm
        open={quoteFormOpen}
        onClose={() => {
          setQuoteFormOpen(false);
          setEditingQuote(undefined);
        }}
        quote={editingQuote}
      />

      <QuoteDetail
        open={detailQuoteId !== null}
        onClose={() => setDetailQuoteId(null)}
        quoteId={detailQuoteId}
        onEdit={(q) => {
          setDetailQuoteId(null);
          setEditingQuote(q);
          setQuoteFormOpen(true);
        }}
      />
    </div>
  );
}
