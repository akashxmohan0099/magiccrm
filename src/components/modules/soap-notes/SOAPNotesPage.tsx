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

export function SOAPNotesPage() {
  const { notes } = useSOAPNotesStore();
  const [formOpen, setFormOpen] = useState(false);

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
      <SOAPNoteForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
