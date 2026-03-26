import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BeforeAfterRecord } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchBeforeAfterRecords, dbCreateBeforeAfter, dbUpdateBeforeAfter,
  dbDeleteBeforeAfter, dbUpsertBeforeAfterRecords, mapBeforeAfterFromDB,
} from "@/lib/db/before-after";

interface BeforeAfterStore {
  records: BeforeAfterRecord[];
  addRecord: (data: Omit<BeforeAfterRecord, "id" | "createdAt">, workspaceId?: string) => BeforeAfterRecord;
  updateRecord: (id: string, data: Partial<BeforeAfterRecord>, workspaceId?: string) => void;
  deleteRecord: (id: string, workspaceId?: string) => void;
  getRecordsByClient: (clientId: string) => BeforeAfterRecord[];

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useBeforeAfterStore = create<BeforeAfterStore>()(
  persist(
    (set, get) => ({
      records: [],
      addRecord: (data, workspaceId?) => {
        const record: BeforeAfterRecord = { ...data, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ records: [...s.records, record] }));
        logActivity("create", "before-after", `Added record for ${data.clientName}`);
        toast("Before/after record added");

        if (workspaceId) {
          dbCreateBeforeAfter(workspaceId, record).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving before/after record" }));
          });
        }
        return record;
      },
      updateRecord: (id, data, workspaceId?) => {
        set((s) => ({ records: s.records.map((r) => r.id === id ? { ...r, ...data } : r) }));
        logActivity("update", "before-after", "Updated before/after record");
        toast("Before/after record updated");

        if (workspaceId) {
          dbUpdateBeforeAfter(workspaceId, id, data).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating before/after record" }));
          });
        }
      },
      deleteRecord: (id, workspaceId?) => {
        const record = get().records.find((r) => r.id === id);
        set((s) => ({ records: s.records.filter((r) => r.id !== id) }));
        if (record) {
          logActivity("delete", "before-after", `Removed record for ${record.clientName}`);
          toast("Before/after record deleted", "info");
        }

        if (workspaceId) {
          dbDeleteBeforeAfter(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting before/after record" }));
          });
        }
      },
      getRecordsByClient: (clientId) => get().records.filter((r) => r.clientId === clientId),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { records } = get();
          await dbUpsertBeforeAfterRecords(workspaceId, records);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing before/after records to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchBeforeAfterRecords(workspaceId);
          if (!rows || rows.length === 0) return;

          const mapped = rows.map((row: Record<string, unknown>) =>
            mapBeforeAfterFromDB(row)
          );
          set({ records: mapped });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading before/after records from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-before-after" }
  )
);
