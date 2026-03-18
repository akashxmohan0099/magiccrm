import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Document } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface DocumentsStore {
  documents: Document[];
  addDocument: (data: Omit<Document, "id" | "createdAt" | "updatedAt">) => void;
  updateDocument: (id: string, data: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  getDocumentsByCategory: (category: string) => Document[];
  getTemplates: () => Document[];
}

export const useDocumentsStore = create<DocumentsStore>()(
  persist(
    (set, get) => ({
      documents: [],

      addDocument: (data) => {
        const now = new Date().toISOString();
        const doc: Document = { ...data, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ documents: [...s.documents, doc] }));
        logActivity("create", "documents", `Uploaded "${doc.name}"`);
        toast(`Created document "${doc.name}"`);
      },

      updateDocument: (id, data) => {
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
          ),
        }));
      },

      deleteDocument: (id) => {
        const doc = get().documents.find((d) => d.id === id);
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
        if (doc) {
          logActivity("delete", "documents", `Deleted "${doc.name}"`);
          toast(`Document "${doc.name}" deleted`, "info");
        }
      },

      getDocumentsByCategory: (category) =>
        get().documents.filter((d) => d.category === category),

      getTemplates: () => get().documents.filter((d) => d.isTemplate),
    }),
    { name: "magic-crm-documents" }
  )
);
