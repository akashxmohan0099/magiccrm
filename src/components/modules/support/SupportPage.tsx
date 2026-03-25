"use client";

import { useState, useMemo } from "react";
import { Plus, Headphones } from "lucide-react";
import { useSupportStore } from "@/store/support";
import { SupportTicket } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Tabs } from "@/components/ui/Tabs";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { TicketForm } from "./TicketForm";
import { TicketDetail } from "./TicketDetail";
import { KnowledgeBase } from "./KnowledgeBase";

type TabId = "tickets" | "knowledge-base";

const TABS = [
  { id: "tickets" as const, label: "Tickets" },
  { id: "knowledge-base" as const, label: "Knowledge Base" },
];

export function SupportPage() {
  const { tickets } = useSupportStore();
  const [activeTab, setActiveTab] = useState<TabId>("tickets");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<SupportTicket | undefined>();
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.clientName.toLowerCase().includes(q)
    );
  }, [tickets, search]);

  const columns: Column<SupportTicket>[] = [
    { key: "subject", label: "Subject", sortable: true },
    {
      key: "clientName",
      label: "Client",
      sortable: true,
      render: (t) => (
        <span className="text-text-secondary">{t.clientName}</span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (t) => <StatusBadge status={t.priority} />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (t) => (
        <span className="text-text-secondary">
          {new Date(t.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const handleNewTicket = () => {
    setEditTicket(undefined);
    setFormOpen(true);
  };

  const handleRowClick = (ticket: SupportTicket) => {
    setDetailTicketId(ticket.id);
  };

  return (
    <div>
      <PageHeader
        title="Support"
        description="Manage support tickets and help your clients."
        actions={
          <Button onClick={handleNewTicket}>
            <Plus className="w-4 h-4" />
            New Ticket
          </Button>
        }
      />

      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
      />

      {activeTab === "tickets" && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 max-w-sm">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search tickets..."
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Headphones className="w-10 h-10" />}
              title="No tickets yet"
              description="Create your first support ticket to start tracking client requests."
              actionLabel="New Ticket"
              onAction={handleNewTicket}
            />
          ) : (
            <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
              <DataTable
                storageKey="magic-crm-support-columns"
                columns={columns}
                data={filtered}
                keyExtractor={(t) => t.id}
                onRowClick={handleRowClick}
              />
            </div>
          )}

          <TicketForm
            open={formOpen}
            onClose={() => {
              setFormOpen(false);
              setEditTicket(undefined);
            }}
            ticket={editTicket}
          />

          <TicketDetail
            open={detailTicketId !== null}
            onClose={() => setDetailTicketId(null)}
            ticketId={detailTicketId}
          />
        </>
      )}

      {activeTab === "knowledge-base" && (
        <FeatureSection moduleId="support" featureId="knowledge-base" featureLabel="Knowledge Base" showDisabledState>
          <KnowledgeBase />
        </FeatureSection>
      )}
    </div>
  );
}
