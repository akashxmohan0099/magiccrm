"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";
import { useProposalsStore } from "@/store/proposals";
import { useClientsStore } from "@/store/clients";
import { Proposal } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ProposalBuilder } from "@/components/modules/invoicing/ProposalBuilder";
import { ProposalForm } from "@/components/modules/invoicing/ProposalForm";
import { ProposalDetail } from "@/components/modules/invoicing/ProposalDetail";

export function ProposalsPage() {
  const proposals = useProposalsStore((s) => s.proposals);
  const clients = useClientsStore((s) => s.clients);
  const [proposalBuilderOpen, setProposalBuilderOpen] = useState(false);
  const [proposalFormOpen, setProposalFormOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | undefined>(undefined);
  const [detailProposalId, setDetailProposalId] = useState<string | null>(null);

  const getClientName = (clientId?: string) => {
    if (!clientId) return "—";
    const client = clients.find((item) => item.id === clientId);
    return client?.name ?? "—";
  };

  const proposalColumns: Column<Proposal>[] = [
    { key: "number", label: "Proposal #", sortable: true },
    { key: "title", label: "Title", sortable: true },
    {
      key: "clientId",
      label: "Client",
      sortable: true,
      render: (proposal) => proposal.clientName ?? getClientName(proposal.clientId),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (proposal) => <StatusBadge status={proposal.status} />,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (proposal) => new Date(proposal.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Proposals"
        description="Create branded proposal pages with pricing, sections, and e-signature."
        actions={
          <Button variant="primary" size="sm" onClick={() => setProposalBuilderOpen(true)}>
            <ScrollText className="w-4 h-4" /> New Proposal
          </Button>
        }
      />

      {proposals.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="w-10 h-10" />}
          title="No proposals yet"
          description="Create rich branded proposals with sections, pricing tables, and e-signature."
          actionLabel="New Proposal"
          onAction={() => setProposalBuilderOpen(true)}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<Proposal>
            columns={proposalColumns}
            data={proposals}
            keyExtractor={(proposal) => proposal.id}
            onRowClick={(proposal) => setDetailProposalId(proposal.id)}
          />
        </div>
      )}

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
        onEdit={(proposal) => {
          setDetailProposalId(null);
          setEditingProposal(proposal);
          setProposalFormOpen(true);
        }}
      />
    </div>
  );
}
