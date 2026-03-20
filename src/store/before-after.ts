import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BeforeAfterRecord } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface BeforeAfterStore {
  records: BeforeAfterRecord[];
  addRecord: (data: Omit<BeforeAfterRecord, "id" | "createdAt">) => BeforeAfterRecord;
  updateRecord: (id: string, data: Partial<BeforeAfterRecord>) => void;
  deleteRecord: (id: string) => void;
  getRecordsByClient: (clientId: string) => BeforeAfterRecord[];
}

export const useBeforeAfterStore = create<BeforeAfterStore>()(
  persist(
    (set, get) => ({
      records: [],
      addRecord: (data) => {
        const record: BeforeAfterRecord = { ...data, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ records: [...s.records, record] }));
        logActivity("create", "before-after", `Added record for ${data.clientName}`);
        toast("Before/after record added");
        return record;
      },
      updateRecord: (id, data) => {
        set((s) => ({ records: s.records.map((r) => r.id === id ? { ...r, ...data } : r) }));
      },
      deleteRecord: (id) => {
        const record = get().records.find((r) => r.id === id);
        set((s) => ({ records: s.records.filter((r) => r.id !== id) }));
        if (record) logActivity("delete", "before-after", `Removed record for ${record.clientName}`);
      },
      getRecordsByClient: (clientId) => get().records.filter((r) => r.clientId === clientId),
    }),
    { name: "magic-crm-before-after" }
  )
);
