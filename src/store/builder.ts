import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomFeature, CustomCollection } from "@/types/custom-feature";

interface BuilderStore {
  credits: number;
  prompt: string;
  customFeatures: CustomFeature[];

  // Prompt
  setPrompt: (prompt: string) => void;

  // Credits
  useCredits: (amount: number) => boolean;
  addCredits: (amount: number) => void;

  // Features
  addFeature: (feature: CustomFeature) => void;
  updateFeatureStatus: (id: string, status: CustomFeature["status"]) => void;
  removeFeature: (id: string) => void;
  getFeature: (id: string) => CustomFeature | undefined;
  getReadyFeatures: () => CustomFeature[];

  // Collection data (records within custom collections)
  addRecord: (featureId: string, collectionId: string, record: Record<string, unknown>) => void;
  updateRecord: (featureId: string, collectionId: string, recordIndex: number, data: Record<string, unknown>) => void;
  deleteRecord: (featureId: string, collectionId: string, recordIndex: number) => void;
}

export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set, get) => ({
      credits: 25,
      prompt: "",
      customFeatures: [],

      setPrompt: (prompt) => set({ prompt }),

      useCredits: (amount) => {
        if (get().credits < amount) return false;
        set((s) => ({ credits: s.credits - amount }));
        return true;
      },

      addCredits: (amount) => set((s) => ({ credits: s.credits + amount })),

      addFeature: (feature) =>
        set((s) => ({
          customFeatures: [...s.customFeatures, feature],
        })),

      updateFeatureStatus: (id, status) =>
        set((s) => ({
          customFeatures: s.customFeatures.map((f) =>
            f.id === id ? { ...f, status } : f
          ),
        })),

      removeFeature: (id) =>
        set((s) => ({
          customFeatures: s.customFeatures.filter((f) => f.id !== id),
        })),

      getFeature: (id) => get().customFeatures.find((f) => f.id === id),

      getReadyFeatures: () => get().customFeatures.filter((f) => f.status === "ready"),

      // Record CRUD within sandboxed collections
      addRecord: (featureId, collectionId, record) =>
        set((s) => ({
          customFeatures: s.customFeatures.map((f) => {
            if (f.id !== featureId) return f;
            return {
              ...f,
              collections: f.collections.map((c) => {
                if (c.id !== collectionId) return c;
                return { ...c, records: [...c.records, { ...record, _id: crypto.randomUUID() }] };
              }),
            };
          }),
        })),

      updateRecord: (featureId, collectionId, recordIndex, data) =>
        set((s) => ({
          customFeatures: s.customFeatures.map((f) => {
            if (f.id !== featureId) return f;
            return {
              ...f,
              collections: f.collections.map((c) => {
                if (c.id !== collectionId) return c;
                const records = [...c.records];
                records[recordIndex] = { ...records[recordIndex], ...data };
                return { ...c, records };
              }),
            };
          }),
        })),

      deleteRecord: (featureId, collectionId, recordIndex) =>
        set((s) => ({
          customFeatures: s.customFeatures.map((f) => {
            if (f.id !== featureId) return f;
            return {
              ...f,
              collections: f.collections.map((c) => {
                if (c.id !== collectionId) return c;
                return { ...c, records: c.records.filter((_, i) => i !== recordIndex) };
              }),
            };
          }),
        })),
    }),
    { name: "magic-crm-builder" }
  )
);
