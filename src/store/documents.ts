import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Document } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchDocuments,
  dbCreateDocument,
  dbUpdateDocument,
  dbDeleteDocument,
  dbUpsertDocuments,
  mapDocumentFromDB,
} from "@/lib/db/documents";

interface DocumentsStore {
  documents: Document[];
  addDocument: (data: Omit<Document, "id" | "createdAt" | "updatedAt">, workspaceId?: string) => void;
  updateDocument: (id: string, data: Partial<Document>, workspaceId?: string) => void;
  deleteDocument: (id: string, workspaceId?: string) => void;
  getDocumentsByCategory: (category: string) => Document[];
  getTemplates: () => Document[];

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useDocumentsStore = create<DocumentsStore>()(
  persist(
    (set, get) => ({
      documents: [],

      addDocument: (data, workspaceId?) => {
        const now = new Date().toISOString();
        const doc: Document = { ...data, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ documents: [...s.documents, doc] }));
        logActivity("create", "documents", `Uploaded "${doc.name}"`);
        toast(`Created document "${doc.name}"`);

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateDocument(workspaceId, doc).catch((err) =>
            console.error("[documents] dbCreateDocument failed:", err)
          );
        }
      },

      updateDocument: (id, data, workspaceId?) => {
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id ? { ...d, ...updatedData } : d
          ),
        }));
        logActivity("update", "documents", "Updated document");
        toast("Document updated");

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateDocument(workspaceId, id, updatedData).catch((err) =>
            console.error("[documents] dbUpdateDocument failed:", err)
          );
        }
      },

      deleteDocument: (id, workspaceId?) => {
        const doc = get().documents.find((d) => d.id === id);
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
        if (doc) {
          logActivity("delete", "documents", `Deleted "${doc.name}"`);
          toast(`Document "${doc.name}" deleted`, "info");

          // Sync to Supabase if workspaceId available
          if (workspaceId) {
            dbDeleteDocument(workspaceId, id).catch((err) =>
              console.error("[documents] dbDeleteDocument failed:", err)
            );
          }
        }
      },

      getDocumentsByCategory: (category) =>
        get().documents.filter((d) => d.category === category),

      getTemplates: () => get().documents.filter((d) => d.isTemplate),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { documents } = get();
          await dbUpsertDocuments(workspaceId, documents);
        } catch (err) {
          console.error("[documents] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchDocuments(workspaceId);
          const mappedDocuments = (rows ?? []).map((row: Record<string, unknown>) =>
            mapDocumentFromDB(row)
          );
          set({ documents: mappedDocuments });
        } catch (err) {
          console.error("[documents] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-documents" }
  )
);
