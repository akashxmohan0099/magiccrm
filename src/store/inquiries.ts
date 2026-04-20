import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Inquiry } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchInquiries,
  dbCreateInquiry,
  dbUpdateInquiry,
  dbDeleteInquiry,
} from "@/lib/db/inquiries";

interface InquiriesStore {
  inquiries: Inquiry[];
  addInquiry: (
    data: Omit<Inquiry, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => Inquiry;
  updateInquiry: (
    id: string,
    data: Partial<Inquiry>,
    workspaceId?: string
  ) => void;
  deleteInquiry: (id: string, workspaceId?: string) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useInquiriesStore = create<InquiriesStore>()(
  persist(
    (set, get) => ({
      inquiries: [],

      addInquiry: (data, workspaceId) => {
        const now = new Date().toISOString();
        const inquiry: Inquiry = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ inquiries: [inquiry, ...s.inquiries] }));
        toast("Inquiry created");
        if (workspaceId) {
          dbCreateInquiry(
            workspaceId,
            inquiry as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        return inquiry;
      },

      updateInquiry: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          inquiries: s.inquiries.map((inq) =>
            inq.id === id ? { ...inq, ...data, updatedAt: now } : inq
          ),
        }));
        if (workspaceId) {
          dbUpdateInquiry(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(console.error);
        }
      },

      deleteInquiry: (id, workspaceId) => {
        set((s) => ({ inquiries: s.inquiries.filter((inq) => inq.id !== id) }));
        toast("Inquiry deleted");
        if (workspaceId) {
          dbDeleteInquiry(workspaceId, id).catch(console.error);
        }
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const inquiries = await fetchInquiries(workspaceId);
          set({ inquiries });
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-inquiries", version: 2 }
  )
);
