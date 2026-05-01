import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TreatmentNote, TreatmentNoteAmendment } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchTreatmentNotes,
  dbCreateTreatmentNote,
  dbUpdateTreatmentNote,
  dbDeleteTreatmentNote,
} from "@/lib/db/treatment-notes";
import { surfaceDbError } from "./_db-error";

interface TreatmentNotesStore {
  notes: TreatmentNote[];
  notesForClient: (clientId: string) => TreatmentNote[];
  addNote: (
    data: Omit<TreatmentNote, "id" | "createdAt" | "updatedAt" | "locked"> & { locked?: boolean },
    workspaceId?: string,
  ) => TreatmentNote;
  updateNote: (id: string, data: Partial<TreatmentNote>, workspaceId?: string) => void;
  /** Append an amendment to a locked note. Edits the displayed values. */
  amendNote: (id: string, amendment: Omit<TreatmentNoteAmendment, "id" | "createdAt">, workspaceId?: string) => void;
  /** Lock a note — once locked, edits go through amendNote. */
  lockNote: (id: string, workspaceId?: string) => void;
  deleteNote: (id: string, workspaceId?: string) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useTreatmentNotesStore = create<TreatmentNotesStore>()(
  persist(
    (set, get) => ({
      notes: [],

      notesForClient: (clientId) => get().notes.filter((n) => n.clientId === clientId),

      addNote: (data, workspaceId) => {
        const now = new Date().toISOString();
        const note: TreatmentNote = {
          id: generateId(),
          ...data,
          locked: data.locked ?? false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ notes: [note, ...s.notes] }));
        toast("Note added");
        if (workspaceId) {
          dbCreateTreatmentNote(workspaceId, note as unknown as Record<string, unknown>).catch(
            surfaceDbError("treatment-notes"),
          );
        }
        return note;
      },

      updateNote: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        const existing = get().notes.find((n) => n.id === id);
        if (!existing) return;
        // Refuse silent edits on locked notes — operators must amend instead.
        if (existing.locked) {
          toast("Note is locked. Add an amendment instead.");
          return;
        }
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...data, updatedAt: now } : n)),
        }));
        if (workspaceId) {
          dbUpdateTreatmentNote(workspaceId, id, data as Record<string, unknown>).catch(
            surfaceDbError("treatment-notes"),
          );
        }
      },

      amendNote: (id, amendment, workspaceId) => {
        const now = new Date().toISOString();
        const existing = get().notes.find((n) => n.id === id);
        if (!existing) return;
        const next: TreatmentNote = {
          ...existing,
          ...amendment.delta,
          amendments: [
            ...(existing.amendments ?? []),
            { id: generateId(), createdAt: now, ...amendment },
          ],
          updatedAt: now,
        };
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? next : n)) }));
        if (workspaceId) {
          dbUpdateTreatmentNote(workspaceId, id, {
            ...amendment.delta,
            amendments: next.amendments,
          } as Record<string, unknown>).catch(surfaceDbError("treatment-notes"));
        }
      },

      lockNote: (id, workspaceId) => {
        get().updateNote(id, { locked: true }, workspaceId);
      },

      deleteNote: (id, workspaceId) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
        toast("Note deleted");
        if (workspaceId) {
          dbDeleteTreatmentNote(workspaceId, id).catch(surfaceDbError("treatment-notes"));
        }
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const notes = await fetchTreatmentNotes(workspaceId);
          set({ notes });
        } catch (err) {
          console.debug("[store] treatment-notes load skipped:", err);
        }
      },
    }),
    { name: "magic-crm-treatment-notes", version: 1 },
  ),
);
