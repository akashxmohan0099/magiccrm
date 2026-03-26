import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PortalConfig, PortalAccess } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchPortalConfig, savePortalConfig,
  fetchPortalAccess, dbCreatePortalAccess, dbUpdatePortalAccess,
  dbDeletePortalAccess, dbUpsertPortalAccess, mapPortalAccessFromDB,
} from "@/lib/db/client-portal";

interface ClientPortalStore {
  config: PortalConfig;
  accessList: PortalAccess[];
  updateConfig: (data: Partial<PortalConfig>, workspaceId?: string) => void;
  grantAccess: (data: Omit<PortalAccess, "id" | "createdAt" | "enabled">, workspaceId?: string) => PortalAccess;
  revokeAccess: (id: string, workspaceId?: string) => void;
  toggleAccess: (id: string, workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

const defaultConfig: PortalConfig = {
  id: "portal",
  enabled: false,
  showBookings: true,
  showInvoices: true,
  showDocuments: true,
  showMessages: true,
  showJobProgress: true,
  welcomeMessage: "Welcome to your client portal.",
  accentColor: "#34D399",
  updatedAt: new Date().toISOString(),
};

export const useClientPortalStore = create<ClientPortalStore>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      accessList: [],
      updateConfig: (data, workspaceId?) => {
        const updated = { ...get().config, ...data, updatedAt: new Date().toISOString() };
        set({ config: updated });
        toast("Portal settings updated");

        if (workspaceId) {
          savePortalConfig(workspaceId, updated).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving portal config" }));
          });
        }
      },
      grantAccess: (data, workspaceId?) => {
        const access: PortalAccess = { ...data, id: generateId(), enabled: true, createdAt: new Date().toISOString() };
        set((s) => ({ accessList: [...s.accessList, access] }));
        logActivity("create", "client-portal", `Granted portal access to ${data.clientName}`);
        toast(`Portal access granted to ${data.clientName}`);

        if (workspaceId) {
          dbCreatePortalAccess(workspaceId, access).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "granting portal access" }));
          });
        }
        return access;
      },
      revokeAccess: (id, workspaceId?) => {
        const access = get().accessList.find((a) => a.id === id);
        set((s) => ({ accessList: s.accessList.filter((a) => a.id !== id) }));
        if (access) {
          logActivity("delete", "client-portal", `Revoked portal access for ${access.clientName}`);
          toast(`Portal access revoked for ${access.clientName}`, "info");
        }

        if (workspaceId) {
          dbDeletePortalAccess(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "revoking portal access" }));
          });
        }
      },
      toggleAccess: (id, workspaceId?) => {
        set((s) => ({ accessList: s.accessList.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a) }));
        const access = get().accessList.find((a) => a.id === id);
        if (access) toast(`Portal access ${access.enabled ? "enabled" : "disabled"} for ${access.clientName}`);

        if (workspaceId && access) {
          dbUpdatePortalAccess(workspaceId, id, { enabled: access.enabled }).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "toggling portal access" }));
          });
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { config, accessList } = get();
          await Promise.all([
            savePortalConfig(workspaceId, config),
            dbUpsertPortalAccess(workspaceId, accessList),
          ]);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing client portal to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [portalConfig, accessRows] = await Promise.all([
            fetchPortalConfig(workspaceId),
            fetchPortalAccess(workspaceId),
          ]);

          const updates: Record<string, unknown> = {};

          if (portalConfig) {
            updates.config = portalConfig;
          }
          if (accessRows && accessRows.length > 0) {
            updates.accessList = accessRows.map((r: Record<string, unknown>) => mapPortalAccessFromDB(r));
          }

          if (Object.keys(updates).length > 0) {
            set(updates as Partial<ClientPortalStore>);
          }
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading client portal from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-client-portal" }
  )
);
