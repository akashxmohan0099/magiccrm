import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  saveDashboardConfig,
  fetchWorkspaceSettings,
} from "@/lib/db/workspace-settings";

export interface DashboardWidget {
  id: string;
  type: string;
  size: "sm" | "md" | "lg";
}

interface DashboardStore {
  widgets: DashboardWidget[];
  setupDismissed: boolean;
  completedSetupIds: string[];
  addWidget: (type: string, size?: "sm" | "md" | "lg") => void;
  removeWidget: (id: string) => void;
  /** Copy a set of default widgets into the store so add/remove operate on real data */
  materializeDefaults: (defaults: DashboardWidget[]) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;
  dismissSetup: () => void;
  completeSetupTask: (id: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

let widgetCounter = 0;

/** Extract only the serializable data keys from the store (no functions). */
function getDashboardData(state: DashboardStore) {
  return {
    widgets: state.widgets,
    setupDismissed: state.setupDismissed,
    completedSetupIds: state.completedSetupIds,
  };
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      widgets: [],
      setupDismissed: false,
      completedSetupIds: [],

      addWidget: (type, size = "sm") => {
        const id = `widget-${Date.now()}-${widgetCounter++}`;
        set((s) => ({
          widgets: [...s.widgets, { id, type, size }],
        }));
      },

      removeWidget: (id) => {
        set((s) => ({
          widgets: s.widgets.filter((w) => w.id !== id),
        }));
      },

      materializeDefaults: (defaults) => {
        set((s) => {
          // Only materialize if the store is empty (using computed defaults)
          if (s.widgets.length === 0) {
            return { widgets: defaults };
          }
          return s;
        });
      },

      reorderWidgets: (widgets) => {
        set({ widgets });
      },

      dismissSetup: () => set({ setupDismissed: true }),

      completeSetupTask: (id) =>
        set((s) => ({
          completedSetupIds: s.completedSetupIds.includes(id)
            ? s.completedSetupIds
            : [...s.completedSetupIds, id],
        })),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const data = getDashboardData(get());
          await saveDashboardConfig(workspaceId, data);
        } catch (err) {
          console.error("[dashboard] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const settings = await fetchWorkspaceSettings(workspaceId);
          if (!settings?.dashboard) return;

          const remote = settings.dashboard as Record<string, unknown>;

          const widgets = remote.widgets as DashboardWidget[] | undefined;
          const setupDismissed = remote.setupDismissed as boolean | undefined;
          const completedSetupIds = remote.completedSetupIds as string[] | undefined;

          // Only hydrate if remote has data
          if (widgets && widgets.length > 0) {
            set({
              widgets,
              setupDismissed: setupDismissed ?? get().setupDismissed,
              completedSetupIds: completedSetupIds ?? get().completedSetupIds,
            });
          } else if (setupDismissed !== undefined || completedSetupIds !== undefined) {
            set({
              setupDismissed: setupDismissed ?? get().setupDismissed,
              completedSetupIds: completedSetupIds ?? get().completedSetupIds,
            });
          }
        } catch (err) {
          console.error("[dashboard] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-dashboard" }
  )
);
