import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SOAPNote } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
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
        const now = new Date().toISOString();
        const note: SOAPNote = { ...data, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ notes: [...s.notes, note] }));
        logActivity("create", "soap-notes", `Added treatment note for ${data.clientName}`);
        toast("Treatment note added");

        if (workspaceId) {
          dbCreateSOAPNote(workspaceId, note).catch((err) =>
            console.error("[soap-notes] dbCreateSOAPNote failed:", err)
          );
        }
        return note;
      },
      updateNote: (id, data, workspaceId?) => {
        set((s) => ({ notes: s.notes.map((n) => n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n) }));
        logActivity("update", "soap-notes", "Updated treatment note");
        toast("Treatment note updated");

        if (workspaceId) {
          dbUpdateSOAPNote(workspaceId, id, data).catch((err) =>
            console.error("[soap-notes] dbUpdateSOAPNote failed:", err)
          );
        }
      },
      deleteNote: (id, workspaceId?) => {
        const note = get().notes.find((n) => n.id === id);
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
        if (note) {
          logActivity("delete", "soap-notes", `Removed treatment note for ${note.clientName}`);
          toast("Treatment note deleted", "info");
        }

        if (workspaceId) {
          dbDeleteSOAPNote(workspaceId, id).catch((err) =>
            console.error("[soap-notes] dbDeleteSOAPNote failed:", err)
          );
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
          console.error("[soap-notes] syncToSupabase failed:", err);
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
          console.error("[soap-notes] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-soap-notes" }
  )
);
