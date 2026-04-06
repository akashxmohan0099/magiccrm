import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SOAPNote } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateSOAPNote, sanitize } from "@/lib/validation";
import {
  fetchSOAPNotes, dbCreateSOAPNote, dbUpdateSOAPNote, dbDeleteSOAPNote,
  dbUpsertSOAPNotes, mapSOAPNoteFromDB,
} from "@/lib/db/soap-notes";

interface SOAPNotesStore {
  notes: SOAPNote[];
  addNote: (data: Omit<SOAPNote, "id" | "createdAt" | "updatedAt">, workspaceId?: string) => SOAPNote;
  updateNote: (id: string, data: Partial<SOAPNote>, workspaceId?: string) => void;
  deleteNote: (id: string, workspaceId?: string) => void;
  getNotesByClient: (clientId: string) => SOAPNote[];

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useSOAPNotesStore = create<SOAPNotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      addNote: (data, workspaceId?) => {
        // Validate input
        const validation = validateSOAPNote(data);
        if (!validation.valid) {
          toast(validation.errors[0], "error");
          return null as unknown as SOAPNote;
        }

        // Sanitize string fields
        const sanitized = {
          ...data,
          clientName: sanitize(data.clientName),
          subjective: sanitize(data.subjective),
          objective: sanitize(data.objective),
          assessment: sanitize(data.assessment),
          plan: sanitize(data.plan),
        };

        const now = new Date().toISOString();
        const note: SOAPNote = { ...sanitized, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ notes: [...s.notes, note] }));
        logActivity("create", "soap-notes", `Added treatment note for ${data.clientName}`);
        toast("Treatment note added");

        if (workspaceId) {
          dbCreateSOAPNote(workspaceId, note).catch((err) => {
            set((s) => ({ notes: s.notes.filter((n) => n.id !== note.id) }));
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving SOAP note" }));
          });
        }
        return note;
      },
      updateNote: (id, data, workspaceId?) => {
        // Validate changed fields if clientName or date changed
        if (data.clientName || data.date) {
          const targetNote = get().notes.find((n) => n.id === id);
          if (targetNote) {
            const validation = validateSOAPNote({ ...targetNote, ...data });
            if (!validation.valid) {
              toast(validation.errors[0], "error");
              return;
            }
          }
        }

        // Sanitize text fields
        const sanitized: Partial<SOAPNote> = { ...data };
        if (data.clientName) sanitized.clientName = sanitize(data.clientName);
        if (data.subjective) sanitized.subjective = sanitize(data.subjective);
        if (data.objective) sanitized.objective = sanitize(data.objective);
        if (data.assessment) sanitized.assessment = sanitize(data.assessment);
        if (data.plan) sanitized.plan = sanitize(data.plan);

        // Capture previous state
        const previousNotes = get().notes;
        const updatedAt = new Date().toISOString();
        set((s) => ({ notes: s.notes.map((n) => n.id === id ? { ...n, ...sanitized, updatedAt } : n) }));
        logActivity("update", "soap-notes", "Updated treatment note");
        toast("Treatment note updated");

        if (workspaceId) {
          dbUpdateSOAPNote(workspaceId, id, { ...sanitized, updatedAt }).catch((err) => {
            set({ notes: previousNotes });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating SOAP note" }));
          });
        }
      },
      deleteNote: (id, workspaceId?) => {
        // Capture previous state for rollback
        const previousNotes = get().notes;
        const note = previousNotes.find((n) => n.id === id);
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
        if (note) {
          logActivity("delete", "soap-notes", `Removed treatment note for ${note.clientName}`);
          toast("Treatment note deleted", "info");
        }

        if (workspaceId) {
          dbDeleteSOAPNote(workspaceId, id).catch((err) => {
            set({ notes: previousNotes });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting SOAP note" }));
          });
        }
      },
      getNotesByClient: (clientId) => get().notes.filter((n) => n.clientId === clientId),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { notes } = get();
          await dbUpsertSOAPNotes(workspaceId, notes);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing SOAP notes to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchSOAPNotes(workspaceId);
          if (!rows || rows.length === 0) return;

          const mapped = rows.map((row: Record<string, unknown>) =>
            mapSOAPNoteFromDB(row)
          );
          set({ notes: mapped });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading SOAP notes from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-soap-notes" }
  )
);
