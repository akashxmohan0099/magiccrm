"use client";

import { useState } from "react";
import { Plus, FileInput, Eye } from "lucide-react";
import { useIntakeFormsStore } from "@/store/intake-forms";
import { IntakeForm, IntakeSubmission } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { IntakeFormForm } from "./IntakeFormForm";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function IntakeFormsPage() {
  const { forms } = useIntakeFormsStore();
  const submissions = useIntakeFormsStore((s) => s.submissions);
  const [formOpen, setFormOpen] = useState(false);

  /* ── Submission viewer state ── */
  const [viewingSub, setViewingSub] = useState<IntakeSubmission | null>(null);

  const columns: Column<IntakeForm>[] = [
    { key: "name", label: "Form Name", sortable: true },
    { key: "description", label: "Description", render: (f) => <span className="text-text-secondary">{f.description || "—"}</span> },
    { key: "submissionCount", label: "Submissions", sortable: true },
    { key: "active", label: "Status", render: (f) => (
      <StatusBadge status={f.active ? "active" : "inactive"} />
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
          <DataTable<IntakeForm> storageKey="magic-crm-intakeforms-columns" columns={columns} data={forms} keyExtractor={(f) => f.id} />
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
          <p className="text-[13px] font-medium text-foreground">Submission Notifications</p>
          <p className="text-[11px] text-text-tertiary">Notifications will be sent when your account is connected to the cloud.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="intake-forms" featureId="form-response-table" featureLabel="Response Viewer">
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Submissions</h3>

          {submissions.length === 0 ? (
            <p className="text-[13px] text-text-tertiary text-center py-4">No submissions yet. Responses will appear here once clients fill out your forms.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="pb-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Form</th>
                    <th className="pb-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Respondent</th>
                    <th className="pb-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Submitted</th>
                    <th className="pb-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="border-b border-border-light last:border-0">
                      <td className="py-3 text-[13px] text-foreground">{sub.formName}</td>
                      <td className="py-3 text-[13px] text-text-secondary">{sub.clientName}</td>
                      <td className="py-3 text-[13px] text-text-tertiary">
                        {new Date(sub.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setViewingSub(sub)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-surface border border-border-light rounded-lg text-xs font-medium text-foreground hover:bg-card-bg cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <SlideOver
          open={!!viewingSub}
          onClose={() => setViewingSub(null)}
          title={viewingSub ? `${viewingSub.formName} — ${viewingSub.clientName}` : "Submission"}
        >
          {viewingSub && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <span>Submitted {new Date(viewingSub.submittedAt).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="space-y-3">
                {Object.entries(viewingSub.responses).map(([field, value]) => (
                  <div key={field} className="bg-surface rounded-xl border border-border-light px-4 py-3">
                    <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">{field}</p>
                    <p className="text-sm text-foreground">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SlideOver>
      </FeatureSection>

      <FeatureSection moduleId="intake-forms" featureId="file-upload-field" featureLabel="File Upload Field">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">File Uploads</p>
          <p className="text-[11px] text-text-tertiary">File upload fields require cloud storage. Coming soon.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="intake-forms" featureId="auto-send-before-booking" featureLabel="Auto-Send Before Booking">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Pre-Booking Auto-Send</p>
          <p className="text-[11px] text-text-tertiary">Auto-send requires email integration. Coming soon.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="intake-forms" featureId="consent-signature" featureLabel="Consent / E-Signature">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">E-Signature Fields</p>
          <p className="text-[11px] text-text-tertiary">Signature fields require the Intake Forms builder.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="intake-forms" featureId="pre-fill-profile" featureLabel="Pre-Fill from Profile">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Auto Pre-Fill</p>
          <p className="text-[11px] text-text-tertiary">Auto pre-fill is enabled when forms are linked to client profiles.</p>
        </div>
      </FeatureSection>

      <IntakeFormForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
