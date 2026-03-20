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
import { FeatureSection } from "@/components/modules/FeatureSection";

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
      <FeatureSection moduleId="intake-forms" featureId="conditional-fields" featureLabel="Conditional Fields">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Conditional Logic</p>
          <p className="text-[11px] text-text-tertiary">Show or hide form fields based on previous answers. Configure logic in the form builder.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="intake-forms" featureId="form-notifications" featureLabel="Submission Notifications">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Submission Notifications are active</p>
          <p className="text-[11px] text-text-tertiary">You'll be notified instantly when someone submits a form.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="intake-forms" featureId="form-response-table" featureLabel="Response Viewer">
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Submissions</h3>
          <p className="text-[13px] text-text-tertiary text-center py-4">Form submissions will appear here in a spreadsheet-style view.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="intake-forms" featureId="file-upload-field" featureLabel="File Upload Field">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">File Uploads</p>
          <p className="text-[11px] text-text-tertiary">Add file upload fields to your forms so respondents can attach photos, documents, or files.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="intake-forms" featureId="auto-send-before-booking" featureLabel="Auto-Send Before Booking">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Pre-Booking Auto-Send</p>
          <p className="text-[11px] text-text-tertiary">Forms are automatically emailed to clients before their appointment.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="intake-forms" featureId="consent-signature" featureLabel="Consent / E-Signature">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">E-Signature Fields</p>
          <p className="text-[11px] text-text-tertiary">Add signature capture fields to consent forms and waivers.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="intake-forms" featureId="pre-fill-profile" featureLabel="Pre-Fill from Profile">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Auto Pre-Fill is active</p>
          <p className="text-[11px] text-text-tertiary">Name, email, and phone are auto-populated from the client's existing record.</p>
        </div>
      </FeatureSection>

      <IntakeFormForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
