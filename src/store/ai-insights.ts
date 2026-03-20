import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ClientInsight } from "@/types/models";
import { generateId } from "@/lib/id";

interface AIInsightsStore {
  insights: ClientInsight[];
  addInsight: (data: Omit<ClientInsight, "id" | "createdAt" | "dismissed">) => void;
  dismissInsight: (id: string) => void;
  clearAll: () => void;
  getActiveInsights: () => ClientInsight[];
}

export const useAIInsightsStore = create<AIInsightsStore>()(
  persist(
    (set, get) => ({
      insights: [],
      addInsight: (data) => {
        const insight: ClientInsight = { ...data, id: generateId(), dismissed: false, createdAt: new Date().toISOString() };
        set((s) => ({ insights: [...s.insights, insight] }));
      },
      dismissInsight: (id) => {
        set((s) => ({ insights: s.insights.map((i) => i.id === id ? { ...i, dismissed: true } : i) }));
      },
      clearAll: () => set({ insights: [] }),
      getActiveInsights: () => get().insights.filter((i) => !i.dismissed),
    }),
    { name: "magic-crm-ai-insights" }
  )
);
