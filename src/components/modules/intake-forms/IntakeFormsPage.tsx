"use client";

import { useState } from "react";
import { Plus, FileInput } from "lucide-react";
import { useIntakeFormsStore } from "@/store/intake-forms";
import { IntakeForm } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { IntakeFormForm } from "./IntakeFormForm";

export function IntakeFormsPage() {
  const { forms } = useIntakeFormsStore();
  const [formOpen, setFormOpen] = useState(false);

  const columns: Column<IntakeForm>[] = [
    { key: "name", label: "Form Name", sortable: true },
    { key: "description", label: "Description", render: (f) => <span className="text-text-secondary">{f.description || "—"}</span> },
    { key: "submissionCount", label: "Submissions", sortable: true },
    { key: "active", label: "Status", render: (f) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${f.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
        {f.active ? "Active" : "Inactive"}
      </span>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Intake Forms"
        description="Create forms for client intake, consultations, and questionnaires."
        actions={<Button variant="primary" size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> New Form</Button>}
      />
      {forms.length === 0 ? (
        <EmptyState
          icon={<FileInput className="w-10 h-10" />}
          title="No forms yet"
          description="Build intake forms with conditional logic to collect client information before appointments."
          setupSteps={[{ label: "Create your first intake form", description: "Add fields, set requirements, and share", action: () => setFormOpen(true) }]}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<IntakeForm> columns={columns} data={forms} keyExtractor={(f) => f.id} />
        </div>
      )}
      <IntakeFormForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
