import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Form } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchForms,
  dbCreateForm,
  dbUpdateForm,
  dbDeleteForm,
} from "@/lib/db/forms";

interface FormsStore {
  forms: Form[];
  addForm: (
    data: Omit<Form, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => Form;
  updateForm: (
    id: string,
    data: Partial<Form>,
    workspaceId?: string
  ) => void;
  deleteForm: (id: string, workspaceId?: string) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useFormsStore = create<FormsStore>()(
  persist(
    (set, get) => ({
      forms: [],

      addForm: (data, workspaceId) => {
        const now = new Date().toISOString();
        const form: Form = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ forms: [form, ...s.forms] }));
        toast("Form created");
        if (workspaceId) {
          dbCreateForm(
            workspaceId,
            form as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        return form;
      },

      updateForm: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          forms: s.forms.map((f) =>
            f.id === id ? { ...f, ...data, updatedAt: now } : f
          ),
        }));
        if (workspaceId) {
          dbUpdateForm(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(console.error);
        }
      },

      deleteForm: (id, workspaceId) => {
        set((s) => ({ forms: s.forms.filter((f) => f.id !== id) }));
        toast("Form deleted");
        if (workspaceId) {
          dbDeleteForm(workspaceId, id).catch(console.error);
        }
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const forms = await fetchForms(workspaceId);
          set({ forms });
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-forms", version: 2 }
  )
);
