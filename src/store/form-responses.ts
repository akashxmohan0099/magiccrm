import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FormResponse } from "@/types/models";
import { generateId } from "@/lib/id";
import {
  fetchFormResponses,
  dbCreateFormResponse,
  dbUpdateFormResponse,
  dbDeleteFormResponse,
} from "@/lib/db/form-responses";

interface FormResponsesStore {
  formResponses: FormResponse[];
  addFormResponse: (
    data: Omit<FormResponse, "id" | "submittedAt"> & { submittedAt?: string },
    workspaceId?: string
  ) => FormResponse;
  updateFormResponse: (
    id: string,
    data: Partial<FormResponse>,
    workspaceId?: string
  ) => void;
  deleteFormResponse: (id: string, workspaceId?: string) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useFormResponsesStore = create<FormResponsesStore>()(
  persist(
    (set) => ({
      formResponses: [],

      addFormResponse: (data, workspaceId) => {
        const submittedAt = data.submittedAt ?? new Date().toISOString();
        const response: FormResponse = {
          id: generateId(),
          ...data,
          submittedAt,
        };
        set((s) => ({ formResponses: [response, ...s.formResponses] }));
        if (workspaceId) {
          dbCreateFormResponse(
            workspaceId,
            response as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        return response;
      },

      updateFormResponse: (id, data, workspaceId) => {
        set((s) => ({
          formResponses: s.formResponses.map((r) =>
            r.id === id ? { ...r, ...data } : r
          ),
        }));
        if (workspaceId) {
          dbUpdateFormResponse(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(console.error);
        }
      },

      deleteFormResponse: (id, workspaceId) => {
        set((s) => ({
          formResponses: s.formResponses.filter((r) => r.id !== id),
        }));
        if (workspaceId) {
          dbDeleteFormResponse(workspaceId, id).catch(console.error);
        }
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const formResponses = await fetchFormResponses(workspaceId);
          set({ formResponses });
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-form-responses", version: 1 }
  )
);
