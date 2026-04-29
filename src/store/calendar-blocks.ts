import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CalendarBlock } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchCalendarBlocks,
  dbCreateCalendarBlock,
  dbUpdateCalendarBlock,
  dbDeleteCalendarBlock,
} from "@/lib/db/calendar-blocks";

interface CalendarBlocksStore {
  blocks: CalendarBlock[];
  addBlock: (
    data: Omit<CalendarBlock, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => CalendarBlock;
  updateBlock: (
    id: string,
    data: Partial<CalendarBlock>,
    workspaceId?: string
  ) => void;
  deleteBlock: (id: string, workspaceId?: string) => void;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useCalendarBlocksStore = create<CalendarBlocksStore>()(
  persist(
    (set, get) => ({
      blocks: [],

      addBlock: (data, workspaceId) => {
        const now = new Date().toISOString();
        const block: CalendarBlock = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ blocks: [block, ...s.blocks] }));
        if (workspaceId) {
          dbCreateCalendarBlock(
            workspaceId,
            block as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        return block;
      },

      updateBlock: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          blocks: s.blocks.map((b) =>
            b.id === id ? { ...b, ...data, updatedAt: now } : b
          ),
        }));
        if (workspaceId) {
          dbUpdateCalendarBlock(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(console.error);
        }
      },

      deleteBlock: (id, workspaceId) => {
        set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) }));
        toast("Block removed");
        if (workspaceId) {
          dbDeleteCalendarBlock(workspaceId, id).catch(console.error);
        }
        // Quiet getter to satisfy linter
        get();
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const blocks = await fetchCalendarBlocks(workspaceId);
          set({ blocks });
        } catch (err) {
          console.debug("[calendar-blocks store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-calendar-blocks", version: 1 }
  )
);
