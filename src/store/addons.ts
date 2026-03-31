import { create } from "zustand";
import { persist } from "zustand/middleware";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  toggleWorkspaceModule,
  fetchWorkspaceModules,
} from "@/lib/db/workspace-settings";
import { FEATURE_BLOCKS } from "@/types/features";
import { useOnboardingStore } from "@/store/onboarding";

interface AddonsStore {
  enabledAddons: string[]; // module IDs
  enableAddon: (id: string, name: string, workspaceId?: string | null) => void;
  disableAddon: (id: string, name: string, workspaceId?: string | null) => void;
  isAddonEnabled: (id: string) => boolean;

  // Supabase sync
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useAddonsStore = create<AddonsStore>()(
  persist(
    (set, get) => ({
      enabledAddons: [],

      enableAddon: (id, name, workspaceId) => {
        if (get().enabledAddons.includes(id)) return;
        set((s) => ({ enabledAddons: [...s.enabledAddons, id] }));
        logActivity("create", "addons", `Enabled add-on "${name}"`);
        toast(`${name} enabled`);

        // Seed default feature selections so useFeature() works for this addon
        const block = FEATURE_BLOCKS.find((b) => b.id === id);
        if (block) {
          const store = useOnboardingStore.getState();
          if (!store.featureSelections[id]) {
            store.setFeatureSelections(
              id,
              block.subFeatures.map((sf) => ({
                id: sf.id,
                label: sf.label,
                description: sf.description,
                selected: sf.defaultOn,
              })),
            );
          }
        }

        // Fire-and-forget Supabase write
        if (workspaceId) {
          toggleWorkspaceModule(workspaceId, id, true).catch((err) =>
            { import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "enabling add-on" })); }
          );
        }
      },

      disableAddon: (id, name, workspaceId) => {
        set((s) => ({ enabledAddons: s.enabledAddons.filter((a) => a !== id) }));
        logActivity("delete", "addons", `Disabled add-on "${name}"`);
        toast(`${name} disabled`);

        // Fire-and-forget Supabase write
        if (workspaceId) {
          toggleWorkspaceModule(workspaceId, id, false).catch((err) =>
            { import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "disabling add-on" })); }
          );
        }
      },

      isAddonEnabled: (id) => get().enabledAddons.includes(id),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const modules = await fetchWorkspaceModules(workspaceId);
          if (!modules || modules.length === 0) return;

          const enabledIds = modules
            .filter((m) => m.enabled)
            .map((m) => m.module_id);

          if (enabledIds.length > 0) {
            set({ enabledAddons: enabledIds });
          }
        } catch (err) {
          console.error("[addons] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-addons" }
  )
);
