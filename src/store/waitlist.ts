import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WaitlistEntry } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateWaitlistEntry, sanitize } from "@/lib/validation";
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

  // Walk-in queue methods
  addWalkIn: (data: { clientName: string; clientPhone?: string; serviceName?: string; serviceId?: string; clientId?: string }, workspaceId?: string) => WaitlistEntry;
  startService: (id: string, workspaceId?: string) => void;
  completeService: (id: string, workspaceId?: string) => void;
  markNoShow: (id: string, workspaceId?: string) => void;
  getQueueForDate: (date: string) => WaitlistEntry[];
  estimateWaitMinutes: (date: string, avgServiceMinutes?: number) => number;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useWaitlistStore = create<WaitlistStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (data, workspaceId?) => {
        // Validate input
        const validation = validateWaitlistEntry(data);
        if (!validation.valid) {
          toast(validation.errors[0], "error");
          return {} as WaitlistEntry;
        }

        // Sanitize clientName
        const sanitizedData = {
          ...data,
          clientName: sanitize(data.clientName),
        };

        const entry: WaitlistEntry = {
          ...sanitizedData,
          id: generateId(),
          status: "waiting",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ entries: [...s.entries, entry] }));
        toast(`Added ${entry.clientName} to waitlist`);

        if (workspaceId) {
          dbCreateWaitlistEntry(workspaceId, entry).catch((err) => {
            set((s) => ({ entries: s.entries.filter((e) => e.id !== entry.id) }));
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving waitlist entry" }));
          });
        }
        return entry;
      },

      removeEntry: (id, workspaceId?) => {
        // Capture previous state for rollback
        const previousEntries = get().entries;
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
        toast("Removed from waitlist", "info");

        if (workspaceId) {
          dbDeleteWaitlistEntry(workspaceId, id).catch((err) => {
            set({ entries: previousEntries });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "removing waitlist entry" }));
          });
        }
      },

      updateEntry: (id, data, workspaceId?) => {
        // Capture previous state for rollback
        const previousEntries = get().entries;

        // Sanitize clientName if it's being updated
        const sanitizedData: Partial<WaitlistEntry> = { ...data };
        if (data.clientName) {
          sanitizedData.clientName = sanitize(data.clientName);
        }

        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, ...sanitizedData } : e
          ),
        }));

        if (workspaceId) {
          dbUpdateWaitlistEntry(workspaceId, id, sanitizedData).catch((err) => {
            set({ entries: previousEntries });
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
      // Walk-in queue
      // ---------------------------------------------------------------

      addWalkIn: (data, workspaceId?) => {
        const today = new Date().toISOString().split("T")[0];

        // Sanitize clientName
        const sanitizedData = {
          ...data,
          clientName: sanitize(data.clientName),
        };

        const entry: WaitlistEntry = {
          id: generateId(),
          clientName: sanitizedData.clientName,
          clientPhone: sanitizedData.clientPhone,
          clientId: sanitizedData.clientId,
          serviceName: sanitizedData.serviceName,
          serviceId: sanitizedData.serviceId,
          date: today,
          status: "waiting",
          entryType: "walkin",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ entries: [...s.entries, entry] }));
        logActivity("create", "waitlist", `Walk-in: ${entry.clientName}${entry.serviceName ? ` for ${entry.serviceName}` : ""}`);
        toast(`${entry.clientName} added to walk-in queue`);

        if (workspaceId) {
          dbCreateWaitlistEntry(workspaceId, entry).catch((err) => {
            set((s) => ({ entries: s.entries.filter((e) => e.id !== entry.id) }));
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving walk-in entry" }));
          });
        }
        return entry;
      },

      startService: (id, workspaceId?) => {
        // Capture previous state for rollback
        const previousEntries = get().entries;
        const entry = previousEntries.find((e) => e.id === id);
        const now = new Date().toISOString();
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, status: "in-service" as const, startedServiceAt: now } : e
          ),
        }));
        if (entry) {
          logActivity("update", "waitlist", `Started service for ${entry.clientName}`);
          toast(`Started service for ${entry.clientName}`);
        }
        if (workspaceId) {
          dbUpdateWaitlistEntry(workspaceId, id, { status: "in-service", startedServiceAt: now }).catch((err) => {
            set({ entries: previousEntries });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "starting walk-in service" }));
          });
        }
      },

      completeService: (id, workspaceId?) => {
        // Capture previous state for rollback
        const previousEntries = get().entries;
        const entry = previousEntries.find((e) => e.id === id);
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, status: "completed" as const } : e
          ),
        }));
        if (entry) {
          logActivity("update", "waitlist", `Completed service for ${entry.clientName}`);
          toast(`Service completed for ${entry.clientName}`, "success");
        }
        if (workspaceId) {
          dbUpdateWaitlistEntry(workspaceId, id, { status: "completed" }).catch((err) => {
            set({ entries: previousEntries });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "completing walk-in service" }));
          });
        }
      },

      markNoShow: (id, workspaceId?) => {
        // Capture previous state for rollback
        const previousEntries = get().entries;
        const entry = previousEntries.find((e) => e.id === id);
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, status: "no-show" as const } : e
          ),
        }));
        if (entry) {
          logActivity("update", "waitlist", `${entry.clientName} marked as no-show`);
          toast(`${entry.clientName} marked as no-show`, "info");
        }
        if (workspaceId) {
          dbUpdateWaitlistEntry(workspaceId, id, { status: "no-show" }).catch((err) => {
            set({ entries: previousEntries });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "marking walk-in no-show" }));
          });
        }
      },

      getQueueForDate: (date) => {
        return get().entries
          .filter((e) => e.date === date && (e.status === "waiting" || e.status === "in-service"))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      },

      estimateWaitMinutes: (date, avgServiceMinutes = 30) => {
        const queue = get().entries
          .filter((e) => e.date === date && e.status === "waiting")
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        return queue.length * avgServiceMinutes;
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
