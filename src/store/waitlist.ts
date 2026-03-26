import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WaitlistEntry } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchWaitlistEntries, dbCreateWaitlistEntry, dbUpdateWaitlistEntry,
  dbDeleteWaitlistEntry, dbUpsertWaitlistEntries, mapWaitlistEntryFromDB,
} from "@/lib/db/waitlist";

interface WaitlistStore {
  entries: WaitlistEntry[];
  addEntry: (data: Omit<WaitlistEntry, "id" | "status" | "createdAt">, workspaceId?: string) => WaitlistEntry;
  removeEntry: (id: string, workspaceId?: string) => void;
  updateEntry: (id: string, data: Partial<WaitlistEntry>, workspaceId?: string) => void;
  getEntriesForDate: (date: string) => WaitlistEntry[];
  checkAndNotify: (date: string, freedStartTime: string, freedEndTime: string, workspaceId?: string) => WaitlistEntry[];

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useWaitlistStore = create<WaitlistStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (data, workspaceId?) => {
        const entry: WaitlistEntry = {
          ...data,
          id: generateId(),
          status: "waiting",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ entries: [...s.entries, entry] }));
        toast(`Added ${entry.clientName} to waitlist`);

        if (workspaceId) {
          dbCreateWaitlistEntry(workspaceId, entry).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving waitlist entry" }));
          });
        }
        return entry;
      },

      removeEntry: (id, workspaceId?) => {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
        toast("Removed from waitlist", "info");

        if (workspaceId) {
          dbDeleteWaitlistEntry(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "removing waitlist entry" }));
          });
        }
      },

      updateEntry: (id, data, workspaceId?) => {
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        }));

        if (workspaceId) {
          dbUpdateWaitlistEntry(workspaceId, id, data).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating waitlist entry" }));
          });
        }
      },

      getEntriesForDate: (date) => {
        return get().entries.filter((e) => e.date === date);
      },

      checkAndNotify: (date, freedStartTime, freedEndTime, workspaceId?) => {
        const waiting = get().entries.filter(
          (e) =>
            e.date === date &&
            e.status === "waiting" &&
            (!e.startTime || !e.endTime || (e.startTime < freedEndTime && e.endTime > freedStartTime))
        );

        if (waiting.length > 0) {
          const now = new Date().toISOString();
          set((s) => ({
            entries: s.entries.map((e) =>
              waiting.some((w) => w.id === e.id)
                ? { ...e, status: "notified" as const, notifiedAt: now }
                : e
            ),
          }));
          toast(
            `${waiting.length} waitlist client${waiting.length > 1 ? "s" : ""} notified of opening`,
            "success"
          );

          if (workspaceId) {
            // Bulk update notified entries
            for (const w of waiting) {
              dbUpdateWaitlistEntry(workspaceId, w.id, { status: "notified", notifiedAt: now }).catch((err) => {
                import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "notifying waitlist entry" }));
              });
            }
          }
        }

        return waiting;
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { entries } = get();
          await dbUpsertWaitlistEntries(workspaceId, entries);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing waitlist to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchWaitlistEntries(workspaceId);
          if (!rows || rows.length === 0) return;

          const mapped = rows.map((row: Record<string, unknown>) =>
            mapWaitlistEntryFromDB(row)
          );
          set({ entries: mapped });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading waitlist from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-waitlist" }
  )
);
