import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ClientInsight } from "@/types/models";
import { generateId } from "@/lib/id";
import { getProfileForAIPrompt } from "@/lib/persona-profiles";

interface AIInsightsStore {
  insights: ClientInsight[];
  loading: boolean;
  lastFetchedAt: string | null;
  addInsight: (data: Omit<ClientInsight, "id" | "createdAt" | "dismissed">) => void;
  dismissInsight: (id: string) => void;
  clearAll: () => void;
  getActiveInsights: () => ClientInsight[];
  fetchInsights: (workspaceId: string, selectedPersona?: string) => Promise<void>;
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useAIInsightsStore = create<AIInsightsStore>()(
  persist(
    (set, get) => ({
      insights: [],
      loading: false,
      lastFetchedAt: null,

      addInsight: (data) => {
        const insight: ClientInsight = {
          ...data,
          id: generateId(),
          dismissed: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ insights: [...s.insights, insight] }));
      },

      dismissInsight: (id) => {
        set((s) => ({
          insights: s.insights.map((i) =>
            i.id === id ? { ...i, dismissed: true } : i
          ),
        }));
      },

      clearAll: () => set({ insights: [] }),

      getActiveInsights: () => get().insights.filter((i) => !i.dismissed),

      fetchInsights: async (workspaceId: string, selectedPersona?: string) => {
        // Don't refetch if we fetched within the last hour
        const lastFetched = get().lastFetchedAt;
        if (lastFetched) {
          const elapsed = Date.now() - new Date(lastFetched).getTime();
          if (elapsed < 60 * 60 * 1000) return; // 1 hour cooldown
        }

        set({ loading: true });

        try {
          const res = await fetch("/api/ai-insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId,
              personaProfile: selectedPersona ? getProfileForAIPrompt(selectedPersona) : undefined,
            }),
          });

          const data = await res.json();
          if (data.insights && data.insights.length > 0) {
            const newInsights: ClientInsight[] = data.insights.map(
              (i: Omit<ClientInsight, "id" | "createdAt" | "dismissed">) => ({
                ...i,
                id: generateId(),
                dismissed: false,
                createdAt: new Date().toISOString(),
              }),
            );

            // Replace old undismissed insights with fresh ones
            const dismissed = get().insights.filter((i) => i.dismissed);
            set({
              insights: [...dismissed, ...newInsights],
              lastFetchedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error("[ai-insights] fetchInsights failed:", err);
        } finally {
          set({ loading: false });
        }
      },

      syncToSupabase: async (_workspaceId: string) => {
        // AI insights are generated on-demand and persisted in localStorage.
        // No server-side sync needed -- they're regenerated per session.
      },

      loadFromSupabase: async (_workspaceId: string) => {
        // AI insights are generated on-demand via the fetchInsights method.
        // localStorage persistence is sufficient.
      },
    }),
    { name: "magic-crm-ai-insights" }
  )
);
