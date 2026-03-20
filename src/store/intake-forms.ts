import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IntakeForm, IntakeSubmission } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface IntakeFormsStore {
  forms: IntakeForm[];
  submissions: IntakeSubmission[];
  addForm: (data: Omit<IntakeForm, "id" | "createdAt" | "updatedAt" | "submissionCount">) => IntakeForm;
  updateForm: (id: string, data: Partial<IntakeForm>) => void;
  deleteForm: (id: string) => void;
  addSubmission: (data: Omit<IntakeSubmission, "id" | "submittedAt">) => IntakeSubmission;
  getSubmissionsByForm: (formId: string) => IntakeSubmission[];
}

export const useIntakeFormsStore = create<IntakeFormsStore>()(
  persist(
    (set, get) => ({
      forms: [],
      submissions: [],
      addForm: (data) => {
        const now = new Date().toISOString();
        const form: IntakeForm = { ...data, id: generateId(), submissionCount: 0, createdAt: now, updatedAt: now };
        set((s) => ({ forms: [...s.forms, form] }));
        logActivity("create", "intake-forms", `Created form "${data.name}"`);
        toast(`Form "${data.name}" created`);
        return form;
      },
      updateForm: (id, data) => {
        set((s) => ({ forms: s.forms.map((f) => f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString() } : f) }));
      },
      deleteForm: (id) => {
        const form = get().forms.find((f) => f.id === id);
        set((s) => ({ forms: s.forms.filter((f) => f.id !== id) }));
        if (form) logActivity("delete", "intake-forms", `Removed form "${form.name}"`);
      },
      addSubmission: (data) => {
        const sub: IntakeSubmission = { ...data, id: generateId(), submittedAt: new Date().toISOString() };
        set((s) => ({
          submissions: [...s.submissions, sub],
          forms: s.forms.map((f) => f.id === data.formId ? { ...f, submissionCount: f.submissionCount + 1 } : f),
        }));
        logActivity("create", "intake-forms", `New submission for "${data.formName}" from ${data.clientName}`);
        return sub;
      },
      getSubmissionsByForm: (formId) => get().submissions.filter((s) => s.formId === formId),
    }),
    { name: "magic-crm-intake-forms" }
  )
);
