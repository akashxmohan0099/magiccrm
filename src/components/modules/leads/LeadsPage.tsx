"use client";

import { useState, useMemo } from "react";
import { Plus, List, Columns3, Users, FileInput, Upload } from "lucide-react";
import { useLeadsStore } from "@/store/leads";
import { useWorkflowSettingsStore } from "@/store/workflow-settings";
import { Lead } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useBaseIndustryConfig, useIndustryConfig } from "@/hooks/useIndustryConfig";
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
import { CSVImportWizard } from "@/components/modules/shared/CSVImportWizard";
import { StageSettingsCard } from "@/components/modules/shared/StageSettingsCard";

type ViewMode = "list" | "pipeline" | "form";

export function LeadsPage() {
  const { leads } = useLeadsStore();
  const vocab = useVocabulary();
  const baseConfig = useBaseIndustryConfig();
  const { leadStages } = useIndustryConfig();
  const setLeadStages = useWorkflowSettingsStore((s) => s.setLeadStages);
  const resetLeadStages = useWorkflowSettingsStore((s) => s.resetLeadStages);
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const leadStageKey = useMemo(
    () => leadStages.map((stage) => `${stage.id}:${stage.label}:${stage.color}:${stage.isClosed ? 1 : 0}`).join("|"),
    [leadStages]
  );

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
          <div className="flex items-center gap-2">
            <FeatureSection moduleId="client-database" featureId="import-export" featureLabel="Import / Export">
              <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="w-4 h-4 mr-1.5" />
                Import
              </Button>
            </FeatureSection>
            <Button variant="primary" size="sm" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1.5" />
              {vocab.addLead}
            </Button>
          </div>
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
        <StageSettingsCard
          key={leadStageKey}
          title="Pipeline Stages"
          description="Rename, reorder, add, and recolor your lead pipeline stages before backend workflow rules are attached."
          entityLabel={vocab.lead.toLowerCase()}
          stages={leadStages}
          defaultStages={baseConfig.leadStages}
          onSave={setLeadStages}
          onReset={resetLeadStages}
        />
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

      <CSVImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        defaultTarget="leads"
      />

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
