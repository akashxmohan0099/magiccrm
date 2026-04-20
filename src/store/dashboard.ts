import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DashboardStore {
  activeTab: string;
  sidebarCollapsed: boolean;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      activeTab: "communications",
      sidebarCollapsed: false,

      setActiveTab: (tab) => set({ activeTab: tab }),

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: "magic-crm-dashboard", version: 2 }
  )
);
