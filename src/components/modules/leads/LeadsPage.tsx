"use client";

import { useState, useMemo } from "react";
import { Plus, List, Columns3, Users, FileInput } from "lucide-react";
import { useLeadsStore } from "@/store/leads";
import { Lead } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { LeadForm } from "./LeadForm";
import { PipelineBoard } from "./PipelineBoard";
import { WebFormPreview } from "./WebFormPreview";

type ViewMode = "list" | "pipeline" | "form";

export function LeadsPage() {
  const { leads } = useLeadsStore();
  const vocab = useVocabulary();
  const { leadStages } = useIndustryConfig();
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
        title={vocab.leads}
        description={`Track ${vocab.leads.toLowerCase()} from first contact to closed deal.`}
        actions={
          <Button variant="primary" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            {vocab.addLead}
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={`Search ${vocab.leads.toLowerCase()}...`}
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
          <button
            onClick={() => setView("form")}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              view === "form"
                ? "bg-card-bg text-foreground shadow-sm"
                : "text-text-secondary hover:text-foreground"
            }`}
            title="Web capture form"
          >
            <FileInput className="w-4 h-4" />
          </button>
        </div>
      </div>

      <FeatureSection moduleId="leads-pipeline" featureId="custom-pipeline-stages" featureLabel="Custom Pipeline Stages">
        <div className="mb-4 p-4 bg-card-bg rounded-xl border border-border-light">
          <h4 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Pipeline Stages</h4>
          <div className="flex flex-wrap gap-2">
            {leadStages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-lg border border-border-light">
                <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                <span className="text-[12px] font-medium text-foreground">{stage.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-tertiary mt-2">Stage customization coming soon. Currently using industry defaults.</p>
        </div>
      </FeatureSection>

      {leads.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title={`No ${vocab.leads.toLowerCase()} yet`}
          description={`Capture ${vocab.leads.toLowerCase()} from your website, social media, or add them manually.`}
          setupSteps={[
            { label: `Add your first ${vocab.lead.toLowerCase()}`, description: "Enter their details manually", action: handleAdd },
            { label: "Set up a web capture form", description: "Embed a form on your website or share a link", action: () => setView("form") },
          ]}
        />
      ) : view === "form" ? (
        <WebFormPreview />
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
        <PipelineBoard leads={filtered} />
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
