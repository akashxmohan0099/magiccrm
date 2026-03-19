"use client";

import { useState, useMemo } from "react";
import { Plus, List, Columns3 } from "lucide-react";
import { useLeadsStore } from "@/store/leads";
import { Lead } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { LeadForm } from "./LeadForm";
import { PipelineBoard } from "./PipelineBoard";

type ViewMode = "list" | "pipeline";

export function LeadsPage() {
  const { leads } = useLeadsStore();
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.company && l.company.toLowerCase().includes(q))
    );
  }, [leads, search]);

  const columns: Column<Lead>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    {
      key: "stage",
      label: "Stage",
      sortable: true,
      render: (lead) => <StatusBadge status={lead.stage} />,
    },
    {
      key: "value",
      label: "Value",
      sortable: true,
      render: (lead) =>
        lead.value != null ? `$${lead.value.toLocaleString()}` : "\u2014",
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (lead) => new Date(lead.createdAt).toLocaleDateString(),
    },
  ];

  const handleRowClick = (lead: Lead) => {
    setEditingLead(lead);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingLead(undefined);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Leads & Pipeline"
        description="Track prospects from first contact to closed deal."
        actions={
          <Button variant="primary" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Lead
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search leads..."
        />
        <div className="flex items-center bg-surface rounded-lg p-1 border border-border-light">
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              view === "list"
                ? "bg-card-bg text-foreground shadow-sm"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("pipeline")}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              view === "pipeline"
                ? "bg-card-bg text-foreground shadow-sm"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            <Columns3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon="users"
          title="No leads yet"
          description="Start adding leads to track your sales pipeline."
          actionLabel="Add Lead"
          onAction={handleAdd}
        />
      ) : view === "list" ? (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<Lead>
            columns={columns}
            data={filtered}
            keyExtractor={(l) => l.id}
            onRowClick={handleRowClick}
          />
        </div>
      ) : (
        <FeatureSection moduleId="leads-pipeline" featureId="pipeline-stages">
          <PipelineBoard leads={filtered} />
        </FeatureSection>
      )}

      <LeadForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingLead(undefined);
        }}
        lead={editingLead}
      />
    </div>
  );
}
