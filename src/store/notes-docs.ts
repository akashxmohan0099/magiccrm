import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateNote, sanitize } from "@/lib/validation";
import {
  fetchNotes,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbUpsertNotes,
  mapNoteFromDB,
} from "@/lib/db/notes";

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  linkedClient: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotesDocsStore {
  notes: Note[];
  addNote: (workspaceId?: string) => Note;
  updateNote: (id: string, data: Partial<Note>, workspaceId?: string) => void;
  deleteNote: (id: string, workspaceId?: string) => void;
  togglePin: (id: string, workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useNotesDocsStore = create<NotesDocsStore>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: (workspaceId?) => {
        const note: Note = {
          id: generateId(),
          title: sanitize("Untitled"),
          content: sanitize(""),
          pinned: false,
          linkedClient: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Validate the new note
        const validation = validateNote(note);
        if (!validation.valid) {
          toast(validation.errors[0], "error");
          throw new Error(validation.errors[0]);
        }

        set((s) => ({ notes: [note, ...s.notes] }));
        logActivity("create", "notes-docs", "Created new note");

        if (workspaceId) {
          dbCreateNote(workspaceId, note).catch((err) => {
            import("@/lib/sync-error-handler").then((m) =>
              m.handleSyncError(err, { context: "saving note" })
            );
          });
        }

        return note;
      },

      updateNote: (id, data, workspaceId?) => {
        const note = get().notes.find((n) => n.id === id);
        if (!note) return;

        // Validate if title changed
        if (data.title) {
          const validation = validateNote({ ...note, ...data });
          if (!validation.valid) {
            toast(validation.errors[0], "error");
            return;
          }
        }

        // Sanitize string fields
        const sanitizedData = { ...data };
        if (data.title) sanitizedData.title = sanitize(data.title);
        if (data.content) sanitizedData.content = sanitize(data.content);

        // Capture previous state for rollback
        const previousNotes = get().notes;

        const updatedData = { ...sanitizedData, updatedAt: new Date().toISOString() };
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...updatedData } : n
          ),
        }));

        if (workspaceId) {
          dbUpdateNote(workspaceId, id, updatedData).catch((err) => {
            set({ notes: previousNotes });
            import("@/lib/sync-error-handler").then((m) =>
              m.handleSyncError(err, { context: "updating note" })
            );
          });
        }
      },

      deleteNote: (id, workspaceId?) => {
        const previousNotes = get().notes;
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
        logActivity("delete", "notes-docs", "Deleted note");
        toast("Note deleted");

        if (workspaceId) {
          dbDeleteNote(workspaceId, id).catch((err) => {
            set({ notes: previousNotes });
            import("@/lib/sync-error-handler").then((m) =>
              m.handleSyncError(err, { context: "deleting note" })
            );
          });
        }
      },

      togglePin: (id, workspaceId?) => {
        const note = get().notes.find((n) => n.id === id);
        if (!note) return;
        const newPinned = !note.pinned;

        // Capture previous state for rollback
        const previousNotes = get().notes;

        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, pinned: newPinned } : n
          ),
        }));

        if (workspaceId) {
          dbUpdateNote(workspaceId, id, { pinned: newPinned }).catch((err) => {
            set({ notes: previousNotes });
            import("@/lib/sync-error-handler").then((m) =>
              m.handleSyncError(err, { context: "pinning note" })
            );
          });
        }
      },

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { notes } = get();
          await dbUpsertNotes(workspaceId, notes);
        } catch (err) {
          import("@/lib/sync-error-handler").then((m) =>
            m.handleSyncError(err, { context: "syncing notes to Supabase" })
          );
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchNotes(workspaceId);
          if (!rows || rows.length === 0) return;
          const mapped = rows.map((row: Record<string, unknown>) =>
            mapNoteFromDB(row)
          );
          set({ notes: mapped });
        } catch (err) {
          import("@/lib/sync-error-handler").then((m) =>
            m.handleSyncError(err, { context: "loading notes from Supabase" })
          );
        }
      },
    }),
    { name: "magic-crm-notes-docs" }
  )
);
