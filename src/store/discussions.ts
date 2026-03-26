import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DiscussionComment } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchDiscussions,
  dbCreateDiscussion,
  dbUpdateDiscussion,
  dbDeleteDiscussion,
  dbUpsertDiscussions,
  mapDiscussionFromDB,
} from "@/lib/db/discussions";

interface DiscussionsStore {
  comments: DiscussionComment[];
  addComment: (data: Omit<DiscussionComment, "id" | "createdAt">, workspaceId?: string) => void;
  updateComment: (id: string, content: string, workspaceId?: string) => void;
  deleteComment: (id: string, workspaceId?: string) => void;
  getCommentsForEntity: (entityType: string, entityId: string) => DiscussionComment[];

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useDiscussionsStore = create<DiscussionsStore>()(
  persist(
    (set, get) => ({
      comments: [],

      addComment: (data, workspaceId?) => {
        const comment: DiscussionComment = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ comments: [...s.comments, comment] }));
        logActivity("create", "team", `Added team note on ${data.entityType}`);
        toast("Comment posted");

        if (workspaceId) {
          dbCreateDiscussion(workspaceId, comment).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving discussion comment" }));
          });
        }
      },

      updateComment: (id, content, workspaceId?) => {
        set((s) => ({
          comments: s.comments.map((c) =>
            c.id === id ? { ...c, content } : c
          ),
        }));
        logActivity("update", "team", "Updated team note");
        toast("Comment updated");

        if (workspaceId) {
          dbUpdateDiscussion(workspaceId, id, content).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating discussion comment" }));
          });
        }
      },

      deleteComment: (id, workspaceId?) => {
        set((s) => ({ comments: s.comments.filter((c) => c.id !== id) }));
        logActivity("delete", "team", "Deleted team note");
        toast("Comment deleted", "info");

        if (workspaceId) {
          dbDeleteDiscussion(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting discussion comment" }));
          });
        }
      },

      getCommentsForEntity: (entityType, entityId) =>
        get().comments.filter(
          (c) => c.entityType === entityType && c.entityId === entityId
        ),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { comments } = get();
          await dbUpsertDiscussions(workspaceId, comments);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing discussions to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchDiscussions(workspaceId);
          if (!rows || rows.length === 0) return;

          const mapped = rows.map((row: Record<string, unknown>) =>
            mapDiscussionFromDB(row)
          );
          set({ comments: mapped });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading discussions from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-discussions" }
  )
);
