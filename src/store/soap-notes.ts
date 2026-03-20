import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SOAPNote } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface SOAPNotesStore {
  notes: SOAPNote[];
  addNote: (data: Omit<SOAPNote, "id" | "createdAt" | "updatedAt">) => SOAPNote;
  updateNote: (id: string, data: Partial<SOAPNote>) => void;
  deleteNote: (id: string) => void;
  getNotesByClient: (clientId: string) => SOAPNote[];
}

export const useSOAPNotesStore = create<SOAPNotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      addNote: (data) => {
        const now = new Date().toISOString();
        const note: SOAPNote = { ...data, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ notes: [...s.notes, note] }));
        logActivity("create", "soap-notes", `Added treatment note for ${data.clientName}`);
        toast("Treatment note added");
        return note;
      },
      updateNote: (id, data) => {
        set((s) => ({ notes: s.notes.map((n) => n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n) }));
      },
      deleteNote: (id) => {
        const note = get().notes.find((n) => n.id === id);
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
        if (note) logActivity("delete", "soap-notes", `Removed treatment note for ${note.clientName}`);
      },
      getNotesByClient: (clientId) => get().notes.filter((n) => n.clientId === clientId),
    }),
    { name: "magic-crm-soap-notes" }
  )
);
