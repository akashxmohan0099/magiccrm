import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IntakeForm, IntakeSubmission } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchIntakeForms, dbCreateIntakeForm, dbUpdateIntakeForm, dbDeleteIntakeForm, dbUpsertIntakeForms, mapIntakeFormFromDB,
  fetchIntakeSubmissions, dbCreateIntakeSubmission, dbDeleteIntakeSubmission, dbUpsertIntakeSubmissions, mapIntakeSubmissionFromDB,
} from "@/lib/db/intake-forms";

interface IntakeFormsStore {
  forms: IntakeForm[];
  submissions: IntakeSubmission[];
  addForm: (data: Omit<IntakeForm, "id" | "createdAt" | "updatedAt" | "submissionCount">, workspaceId?: string) => IntakeForm;
  updateForm: (id: string, data: Partial<IntakeForm>, workspaceId?: string) => void;
  deleteForm: (id: string, workspaceId?: string) => void;
  addSubmission: (data: Omit<IntakeSubmission, "id" | "submittedAt">, workspaceId?: string) => IntakeSubmission;
  deleteSubmission: (id: string, workspaceId?: string) => void;
  getSubmissionsByForm: (formId: string) => IntakeSubmission[];

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useIntakeFormsStore = create<IntakeFormsStore>()(
  persist(
    (set, get) => ({
      forms: [],
      submissions: [],
      addForm: (data, workspaceId?) => {
        const now = new Date().toISOString();
        const form: IntakeForm = { ...data, id: generateId(), submissionCount: 0, createdAt: now, updatedAt: now };
        set((s) => ({ forms: [...s.forms, form] }));
        logActivity("create", "intake-forms", `Created form "${data.name}"`);
        toast(`Form "${data.name}" created`);

        if (workspaceId) {
          dbCreateIntakeForm(workspaceId, form).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving intake form" }));
          });
        }
        return form;
      },
      updateForm: (id, data, workspaceId?) => {
        set((s) => ({ forms: s.forms.map((f) => f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString() } : f) }));
        logActivity("update", "intake-forms", "Updated form");
        toast("Form updated");

        if (workspaceId) {
          dbUpdateIntakeForm(workspaceId, id, data).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating intake form" }));
          });
        }
      },
      deleteForm: (id, workspaceId?) => {
        const form = get().forms.find((f) => f.id === id);
        set((s) => ({ forms: s.forms.filter((f) => f.id !== id) }));
        if (form) {
          logActivity("delete", "intake-forms", `Removed form "${form.name}"`);
          toast(`Form "${form.name}" deleted`, "info");
        }

        if (workspaceId) {
          dbDeleteIntakeForm(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting intake form" }));
          });
        }
      },
      addSubmission: (data, workspaceId?) => {
        const sub: IntakeSubmission = { ...data, id: generateId(), submittedAt: new Date().toISOString() };
        set((s) => ({
          submissions: [...s.submissions, sub],
          forms: s.forms.map((f) => f.id === data.formId ? { ...f, submissionCount: f.submissionCount + 1 } : f),
        }));
        logActivity("create", "intake-forms", `New submission for "${data.formName}" from ${data.clientName}`);
        toast(`Submission received for "${data.formName}"`);

        if (workspaceId) {
          dbCreateIntakeSubmission(workspaceId, sub).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving intake submission" }));
          });
          // Also update the form's submission count
          const form = get().forms.find((f) => f.id === data.formId);
          if (form) {
            dbUpdateIntakeForm(workspaceId, data.formId, { submissionCount: form.submissionCount }).catch((err) => {
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating intake form submission count" }));
            });
          }
        }
        return sub;
      },
      deleteSubmission: (id, workspaceId?) => {
        const sub = get().submissions.find((s) => s.id === id);
        set((s) => ({
          submissions: s.submissions.filter((s) => s.id !== id),
          forms: sub
            ? s.forms.map((f) => f.id === sub.formId ? { ...f, submissionCount: Math.max(0, f.submissionCount - 1) } : f)
            : s.forms,
        }));
        logActivity("delete", "intake-forms", "Deleted submission");
        toast("Submission deleted", "info");

        if (workspaceId) {
          dbDeleteIntakeSubmission(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting intake submission" }));
          });
          // Also update the form's submission count
          if (sub) {
            const form = get().forms.find((f) => f.id === sub.formId);
            if (form) {
              dbUpdateIntakeForm(workspaceId, sub.formId, { submissionCount: form.submissionCount }).catch((err) => {
                import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating intake form submission count" }));
              });
            }
          }
        }
      },
      getSubmissionsByForm: (formId) => get().submissions.filter((s) => s.formId === formId),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { forms, submissions } = get();
          await Promise.all([
            dbUpsertIntakeForms(workspaceId, forms),
            dbUpsertIntakeSubmissions(workspaceId, submissions),
          ]);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing intake forms to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [formRows, subRows] = await Promise.all([
            fetchIntakeForms(workspaceId),
            fetchIntakeSubmissions(workspaceId),
          ]);

          const updates: Record<string, unknown> = {};

          if (formRows && formRows.length > 0) {
            updates.forms = formRows.map((r: Record<string, unknown>) => mapIntakeFormFromDB(r));
          }
          if (subRows && subRows.length > 0) {
            updates.submissions = subRows.map((r: Record<string, unknown>) => mapIntakeSubmissionFromDB(r));
          }

          if (Object.keys(updates).length > 0) {
            set(updates as Partial<IntakeFormsStore>);
          }
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading intake forms from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-intake-forms" }
  )
);
