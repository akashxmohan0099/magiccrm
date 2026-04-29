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
  /** Optimistic local update; the returned Promise resolves once the DB
   *  write lands, or rejects with the underlying error so callers running
   *  autosave can surface failures to the user instead of silently lying. */
  updateForm: (
    id: string,
    data: Partial<Form>,
    workspaceId?: string
  ) => Promise<void>;
  deleteForm: (id: string, workspaceId?: string) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useFormsStore = create<FormsStore>()(
  persist(
    (set) => ({
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

      updateForm: async (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          forms: s.forms.map((f) =>
            f.id === id ? { ...f, ...data, updatedAt: now } : f
          ),
        }));
        if (!workspaceId) return;
        // Bubble DB errors so callers (autosave) can react. Local state stays
        // optimistically updated regardless — reverting it would feel worse
        // than showing an error and letting the next save retry.
        await dbUpdateForm(workspaceId, id, data as Record<string, unknown>);
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
    {
      name: "magic-crm-forms",
      version: 3,
      // v2 → v3: backfill autoPromoteToInquiry. Default ON for seeded inquiry
      // forms (Wedding Inquiry, General Inquiry) so they land in Main forms;
      // any other inquiry form without an explicit value also defaults ON
      // (matches prior behavior where every inquiry submission appeared in
      // the leads inbox). Booking forms get false — irrelevant either way.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { forms?: Form[] } | null;
        if (!state || !Array.isArray(state.forms)) return state;
        if (version >= 3) return state;
        return {
          ...state,
          forms: state.forms.map((f) => ({
            ...f,
            autoPromoteToInquiry:
              typeof f.autoPromoteToInquiry === "boolean"
                ? f.autoPromoteToInquiry
                : f.type === "inquiry",
          })),
        };
      },
    }
  )
);
