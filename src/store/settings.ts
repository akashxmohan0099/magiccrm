import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WorkspaceSettings } from "@/types/models";
import { toast } from "@/components/ui/Toast";
import {
  fetchWorkspaceSettings,
  dbUpsertWorkspaceSettings,
} from "@/lib/db/settings";

interface SettingsStore {
  settings: WorkspaceSettings | null;
  enabledAddons: string[];
  updateSettings: (
    data: Partial<WorkspaceSettings>,
    workspaceId?: string
  ) => void;
  toggleAddon: (addonId: string, workspaceId?: string) => void;
  isAddonEnabled: (addonId: string) => boolean;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: null,
      enabledAddons: [],

      updateSettings: (data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          enabledAddons: data.enabledAddons ?? s.enabledAddons,
          settings: s.settings
            ? { ...s.settings, ...data, updatedAt: now }
            : ({
                workspaceId: workspaceId ?? "",
                stripeOnboardingComplete: false,
                workingHours: {},
                cancellationWindowHours: 24,
                depositPercentage: 0,
                noShowFee: 0,
                messageTemplates: {},
                notificationDefaults: "email",
                branding: {},
                calendarSyncEnabled: false,
                minNoticeHours: 4,
                maxAdvanceDays: 56,
                autoReplyEnabled: false,
                bookingChannels: [],
                paymentMethods: [],
                selectedOnboardingActions: [],
                onboardingFollowUps: {},
                enabledAddons: [],
                enabledFeatures: [],
                ...data,
                updatedAt: now,
              } as WorkspaceSettings),
        }));
        toast("Settings updated");
        if (workspaceId) {
          dbUpsertWorkspaceSettings(
            workspaceId,
            data as Record<string, unknown>
          ).catch(console.error);
        }
      },

      toggleAddon: (addonId, workspaceId) => {
        set((s) => {
          const enabled = s.enabledAddons.includes(addonId);
          const next = enabled
            ? s.enabledAddons.filter((id) => id !== addonId)
            : [...s.enabledAddons, addonId];
          return {
            enabledAddons: next,
            settings: s.settings
              ? { ...s.settings, enabledAddons: next, updatedAt: new Date().toISOString() }
              : s.settings,
          };
        });

        if (workspaceId) {
          dbUpsertWorkspaceSettings(workspaceId, {
            enabledAddons: get().enabledAddons,
            updatedAt: new Date().toISOString(),
          }).catch(console.error);
        }
      },

      isAddonEnabled: (addonId) => {
        return get().enabledAddons.includes(addonId);
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const settings = await fetchWorkspaceSettings(workspaceId);
          if (settings) {
            set({
              settings,
              enabledAddons: settings.enabledAddons ?? [],
            });
          }
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-settings", version: 3 }
  )
);
