import { create } from "zustand";
import { persist } from "zustand/middleware";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface AddonsStore {
  enabledAddons: string[]; // module IDs
  enableAddon: (id: string, name: string) => void;
  disableAddon: (id: string, name: string) => void;
  isAddonEnabled: (id: string) => boolean;
}

export const useAddonsStore = create<AddonsStore>()(
  persist(
    (set, get) => ({
      enabledAddons: [],

      enableAddon: (id, name) => {
        if (get().enabledAddons.includes(id)) return;
        set((s) => ({ enabledAddons: [...s.enabledAddons, id] }));
        logActivity("create", "addons", `Enabled add-on "${name}"`);
        toast(`${name} enabled`);
      },

      disableAddon: (id, name) => {
        set((s) => ({ enabledAddons: s.enabledAddons.filter((a) => a !== id) }));
        logActivity("delete", "addons", `Disabled add-on "${name}"`);
        toast(`${name} disabled`);
      },

      isAddonEnabled: (id) => get().enabledAddons.includes(id),
    }),
    { name: "magic-crm-addons" }
  )
);
