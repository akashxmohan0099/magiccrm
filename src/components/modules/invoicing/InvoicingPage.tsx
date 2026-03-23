"use client";

import { useState } from "react";
import { Plus, FileText, Receipt, ScrollText } from "lucide-react";
import { useInvoicesStore } from "@/store/invoices";
import { useProposalsStore } from "@/store/proposals";
import { useClientsStore } from "@/store/clients";
import { Invoice, Quote, Proposal } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
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
import { ProposalForm } from "./ProposalForm";
import { ProposalBuilder } from "./ProposalBuilder";
import { ProposalDetail } from "./ProposalDetail";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { useFeature } from "@/hooks/useFeature";

export function InvoicingPage() {
  const { invoices, quotes } = useInvoicesStore();
  const { proposals } = useProposalsStore();
  const { clients } = useClientsStore();
  const vocab = useVocabulary();
  const creditNotesEnabled = useFeature("quotes-invoicing", "credit-notes");
  const proposalsEnabled = useFeature("quotes-invoicing", "proposals");
  const TABS = [
    { id: "invoices", label: vocab.invoices },
    { id: "quotes", label: vocab.quotes },
    ...(proposalsEnabled ? [{ id: "proposals", label: "Proposals" }] : []),
    ...(creditNotesEnabled ? [{ id: "credit-notes", label: "Credit Notes" }] : []),
  ];
  const [activeTab, setActiveTab] = useState("invoices");
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>(undefined);
  const [detailInvoiceId, setDetailInvoiceId] = useState<string | null>(null);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>(undefined);
  const [detailQuoteId, setDetailQuoteId] = useState<string | null>(null);
  const [proposalFormOpen, setProposalFormOpen] = useState(false);
  const [proposalBuilderOpen, setProposalBuilderOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | undefined>(undefined);
  const [detailProposalId, setDetailProposalId] = useState<string | null>(null);

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

  const handleNewProposal = () => {
    setProposalBuilderOpen(true);
  };

  const proposalColumns: Column<Proposal>[] = [
    { key: "number", label: "Proposal #", sortable: true },
    { key: "title", label: "Title", sortable: true },
    {
      key: "clientId",
      label: "Client",
      sortable: true,
      render: (p) => p.clientName ?? getClientName(p.clientId),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (p) => new Date(p.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Billing"
        description={`Create and manage ${vocab.quotes.toLowerCase()} and ${vocab.invoices.toLowerCase()} for your ${vocab.clients.toLowerCase()}.`}
        actions={
          <div className="flex items-center gap-2">
            {proposalsEnabled && (
              <Button variant="secondary" size="sm" onClick={handleNewProposal}>
                <ScrollText className="w-4 h-4" /> New Proposal
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleNewQuote}>
              <FileText className="w-4 h-4" /> New {vocab.quote}
            </Button>
            <Button variant="primary" size="sm" onClick={handleNewInvoice}>
              <Plus className="w-4 h-4" /> {vocab.addInvoice}
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
              title={`No ${vocab.invoices.toLowerCase()} yet`}
              description={`Set up your billing, then start sending ${vocab.invoices.toLowerCase()}.`}
              setupSteps={[
                { label: `Create your first ${vocab.invoice.toLowerCase()}`, description: "Add line items, set payment terms, and send", action: handleNewInvoice },
              ]}
            />
          ) : (
            <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
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
              title={`No ${vocab.quotes.toLowerCase()} yet`}
              description={`Create a ${vocab.quote.toLowerCase()} to send a pricing proposal to a ${vocab.client.toLowerCase()}.`}
              actionLabel={`New ${vocab.quote}`}
              onAction={handleNewQuote}
            />
          ) : (
            <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
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

      {activeTab === "proposals" && (
        <FeatureSection moduleId="quotes-invoicing" featureId="proposals" featureLabel="Proposals">
          {proposals.length === 0 ? (
            <EmptyState
              icon={<ScrollText className="w-10 h-10" />}
              title="No proposals yet"
              description="Create rich branded proposals with sections, pricing tables, and e-signature."
              actionLabel="New Proposal"
              onAction={handleNewProposal}
            />
          ) : (
            <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
              <DataTable<Proposal>
                columns={proposalColumns}
                data={proposals}
                keyExtractor={(p) => p.id}
                onRowClick={(p) => setDetailProposalId(p.id)}
              />
            </div>
          )}
        </FeatureSection>
      )}

      {activeTab === "credit-notes" && (
        <FeatureSection moduleId="quotes-invoicing" featureId="credit-notes" featureLabel="Credit Notes">
          <EmptyState
            icon={<Receipt className="w-10 h-10" />}
            title="No credit notes yet"
            description="Credit notes for returns, errors, or goodwill adjustments will appear here once issued."
          />
        </FeatureSection>
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

      <ProposalBuilder
        open={proposalBuilderOpen}
        onClose={() => setProposalBuilderOpen(false)}
      />

      <ProposalForm
        open={proposalFormOpen}
        onClose={() => {
          setProposalFormOpen(false);
          setEditingProposal(undefined);
        }}
        proposal={editingProposal}
      />

      <ProposalDetail
        open={detailProposalId !== null}
        onClose={() => setDetailProposalId(null)}
        proposalId={detailProposalId}
        onEdit={(p) => {
          setDetailProposalId(null);
          setEditingProposal(p);
          setProposalFormOpen(true);
        }}
      />
    </div>
  );
}
