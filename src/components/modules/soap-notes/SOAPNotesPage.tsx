"use client";

import { useState } from "react";
import { Plus, ClipboardList } from "lucide-react";
import { useSOAPNotesStore } from "@/store/soap-notes";
import { SOAPNote } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { SOAPNoteForm } from "./SOAPNoteForm";
import { FeatureSection } from "@/components/modules/FeatureSection";

export function SOAPNotesPage() {
  const { notes } = useSOAPNotesStore();
  const [formOpen, setFormOpen] = useState(false);
  const [practFilter, setPractFilter] = useState("");

  const columns: Column<SOAPNote>[] = [
    { key: "clientName", label: "Patient", sortable: true },
    { key: "date", label: "Date", sortable: true, render: (n) => new Date(n.date).toLocaleDateString() },
    { key: "subjective", label: "Chief Complaint", render: (n) => <span className="text-text-secondary truncate max-w-[200px] block">{n.subjective.slice(0, 60)}{n.subjective.length > 60 ? "..." : ""}</span> },
    { key: "practitioner", label: "Practitioner", render: (n) => n.practitioner || <span className="text-text-tertiary">—</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Treatment Notes"
        description="SOAP notes and treatment records for your patients."
        actions={<Button variant="primary" size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> New Note</Button>}
      />
      <FeatureSection moduleId="soap-notes" featureId="practitioner-filter" featureLabel="Practitioner Filter">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[12px] text-text-tertiary">Filter by:</span>
          <select value={practFilter} onChange={(e) => setPractFilter(e.target.value)} className="px-3 py-1.5 bg-surface border border-border-light rounded-lg text-[13px] text-foreground">
            <option value="">All practitioners</option>
          </select>
        </div>
      </FeatureSection>

      {notes.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-10 h-10" />}
          title="No treatment notes yet"
          description="Start documenting patient treatments with structured SOAP notes."
          setupSteps={[{ label: "Create your first SOAP note", description: "Subjective, Objective, Assessment, Plan", action: () => setFormOpen(true) }]}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<SOAPNote> columns={columns} data={notes} keyExtractor={(n) => n.id} />
        </div>
      )}
      <FeatureSection moduleId="soap-notes" featureId="auto-link-booking" featureLabel="Auto-Link to Booking">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Auto-Link is active</p>
          <p className="text-[11px] text-text-tertiary">Treatment notes automatically attach to the related appointment.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="soap-notes" featureId="body-map-markup" featureLabel="Body Map">
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Body Map</h3>
          <div className="w-full h-48 bg-surface rounded-lg border border-border-light flex items-center justify-center">
            <p className="text-[13px] text-text-tertiary">Body diagram markup — draw on a body outline to mark treatment areas.</p>
          </div>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="soap-notes" featureId="note-locking" featureLabel="Note Locking">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Note Locking</p>
          <p className="text-[11px] text-text-tertiary">Notes are locked after 24 hours and cannot be edited — for compliance and audit trail.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="soap-notes" featureId="treatment-plan-builder" featureLabel="Treatment Plan Builder">
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Treatment Plans</h3>
          <p className="text-[13px] text-text-tertiary text-center py-4">Create multi-session treatment plans with progress tracking across visits.</p>
          <div className="flex justify-center">
            <button className="px-4 py-2 bg-foreground text-white rounded-lg text-[12px] font-medium cursor-pointer hover:opacity-90">New Treatment Plan</button>
          </div>
        </div>
      </FeatureSection>

      <SOAPNoteForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
