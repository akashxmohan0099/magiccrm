import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecommendedSetupItem {
  featureId: string;
  moduleId: string;
  reason: string;
  triggerQuestionId: string;
  priority: number;
  status: "pending" | "accepted" | "dismissed";
}

interface RecommendedSetupStore {
  items: RecommendedSetupItem[];
  addItem: (item: Omit<RecommendedSetupItem, "status">) => void;
  acceptItem: (featureId: string) => void;
  dismissItem: (featureId: string) => void;
  getPendingItems: () => RecommendedSetupItem[];
}

export const useRecommendedSetupStore = create<RecommendedSetupStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        // Don't add duplicates
        if (get().items.some((i) => i.featureId === item.featureId)) return;
        set((s) => ({
          items: [...s.items, { ...item, status: "pending" }],
        }));
      },

      acceptItem: (featureId) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.featureId === featureId ? { ...i, status: "accepted" as const } : i
          ),
        })),

      dismissItem: (featureId) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.featureId === featureId ? { ...i, status: "dismissed" as const } : i
          ),
        })),

      getPendingItems: () =>
        get()
          .items.filter((i) => i.status === "pending")
          .sort((a, b) => b.priority - a.priority)
          .slice(0, 3),
    }),
    { name: "magic-crm-recommended-setup" }
  )
);
