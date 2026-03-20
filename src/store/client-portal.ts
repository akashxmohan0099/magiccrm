import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PortalConfig, PortalAccess } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface ClientPortalStore {
  config: PortalConfig;
  accessList: PortalAccess[];
  updateConfig: (data: Partial<PortalConfig>) => void;
  grantAccess: (data: Omit<PortalAccess, "id" | "createdAt" | "enabled">) => PortalAccess;
  revokeAccess: (id: string) => void;
  toggleAccess: (id: string) => void;
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
  accentColor: "#7CFE9D",
  updatedAt: new Date().toISOString(),
};

export const useClientPortalStore = create<ClientPortalStore>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      accessList: [],
      updateConfig: (data) => {
        set((s) => ({ config: { ...s.config, ...data, updatedAt: new Date().toISOString() } }));
        toast("Portal settings updated");
      },
      grantAccess: (data) => {
        const access: PortalAccess = { ...data, id: generateId(), enabled: true, createdAt: new Date().toISOString() };
        set((s) => ({ accessList: [...s.accessList, access] }));
        logActivity("create", "client-portal", `Granted portal access to ${data.clientName}`);
        toast(`Portal access granted to ${data.clientName}`);
        return access;
      },
      revokeAccess: (id) => {
        const access = get().accessList.find((a) => a.id === id);
        set((s) => ({ accessList: s.accessList.filter((a) => a.id !== id) }));
        if (access) logActivity("delete", "client-portal", `Revoked portal access for ${access.clientName}`);
      },
      toggleAccess: (id) => {
        set((s) => ({ accessList: s.accessList.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a) }));
      },
    }),
    { name: "magic-crm-client-portal" }
  )
);
