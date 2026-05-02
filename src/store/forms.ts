import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Form } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import { surfaceDbError } from "@/store/_db-error";
import {
  fetchForms,
  dbCreateForm,
  dbUpdateForm,
  dbDeleteForm,
  FormSlugConflictError,
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
          dbCreateForm(workspaceId, form).catch((err) => {
            // Slug conflict from a concurrent writer — revert the optimistic
            // insert so the operator isn't looking at a row that doesn't exist
            // server-side. They'll need to pick a different slug.
            if (err instanceof FormSlugConflictError) {
              set((s) => ({ forms: s.forms.filter((f) => f.id !== form.id) }));
              toast(err.message, "error");
              return;
            }
            // Delegate to the shared error surface so schema-cache misses
            // get the actionable "run the migration" message instead of
            // the generic "couldn't save" toast.
            surfaceDbError("forms.add")(err);
          });
        }
        return form;
      },

      updateForm: async (id, data, workspaceId) => {
        const now = new Date().toISOString();
        // Snapshot the prior row so we can revert on a hard failure (e.g.
        // slug collision the local client didn't catch).
        const prior = useFormsStore.getState().forms.find((f) => f.id === id);
        set((s) => ({
          forms: s.forms.map((f) =>
            f.id === id ? { ...f, ...data, updatedAt: now } : f
          ),
        }));
        if (!workspaceId) return;
        try {
          await dbUpdateForm(workspaceId, id, data);
        } catch (err) {
          if (err instanceof FormSlugConflictError && prior) {
            // Hard revert just the slug — the operator's other edits stay so
            // they can fix the slug and the next autosave retry lands clean.
            set((s) => ({
              forms: s.forms.map((f) =>
                f.id === id ? { ...f, slug: prior.slug } : f
              ),
            }));
            toast(err.message, "error");
          }
          throw err;
        }
      },

      deleteForm: (id, workspaceId) => {
        const prior = useFormsStore.getState().forms.find((f) => f.id === id);
        set((s) => ({ forms: s.forms.filter((f) => f.id !== id) }));
        // Caller fires the user-facing toast — they know the surrounding
        // context (e.g. submission count) and can word the message better
        // than this generic store-level message would.
        if (workspaceId) {
          dbDeleteForm(workspaceId, id).catch((err) => {
            // Restore the row if the server delete failed — better to show
            // it back than to leave the operator thinking it's gone while
            // the form keeps accepting public submissions.
            console.error("[forms.deleteForm] DB delete failed:", err);
            if (prior) {
              set((s) => ({ forms: [prior, ...s.forms] }));
              toast("Couldn't delete form on the server. Restored.", "error");
            }
          });
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
