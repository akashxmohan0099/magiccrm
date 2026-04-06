import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Document } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateDocument, sanitize } from "@/lib/validation";
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
        // Validate
        const validation = validateDocument({ name: data.name });
        if (!validation.valid) {
          validation.errors.forEach(error => toast(error, "error"));
          return;
        }

        const now = new Date().toISOString();
        const sanitizedData = {
          ...data,
          name: sanitize(data.name, 500),
          category: sanitize(data.category, 200),
        };
        const doc: Document = { ...sanitizedData, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ documents: [...s.documents, doc] }));
        logActivity("create", "documents", `Uploaded "${doc.name}"`);
        toast(`Created document "${doc.name}"`);

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateDocument(workspaceId, doc).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving document" }));
          });
        }
      },

      updateDocument: (id, data, workspaceId?) => {
        // Validate if name changed
        if (data.name !== undefined) {
          const validation = validateDocument({ name: data.name });
          if (!validation.valid) {
            validation.errors.forEach(error => toast(error, "error"));
            return;
          }
        }

        const previousDocuments = get().documents;
        const sanitizedData = {
          ...data,
          ...(data.name !== undefined && { name: sanitize(data.name, 500) }),
          ...(data.category !== undefined && { category: sanitize(data.category, 200) }),
          updatedAt: new Date().toISOString(),
        };

        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id ? { ...d, ...sanitizedData } : d
          ),
        }));
        logActivity("update", "documents", "Updated document");
        toast("Document updated");

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateDocument(workspaceId, id, sanitizedData).catch((err) => {
            set({ documents: previousDocuments });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating document" }));
          });
        }
      },

      deleteDocument: (id, workspaceId?) => {
        const previousDocuments = get().documents;
        const doc = previousDocuments.find((d) => d.id === id);
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
        if (doc) {
          logActivity("delete", "documents", `Deleted "${doc.name}"`);
          toast(`Document "${doc.name}" deleted`, "info");

          // Sync to Supabase if workspaceId available
          if (workspaceId) {
            dbDeleteDocument(workspaceId, id).catch((err) => {
              set({ documents: previousDocuments });
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting document" }));
            });
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
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing documents to Supabase" }));
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
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading documents from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-documents" }
  )
);
