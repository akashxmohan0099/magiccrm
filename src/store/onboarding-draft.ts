// Persisted draft for the v2 onboarding flow. Survives page reloads so
// users can resume mid-questionnaire without losing answers. Cleared
// once signup completes and the answers are written to workspace_settings.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  emptyDraft,
  type OnboardingDraft,
  type PersonaSlug,
} from "@/lib/onboarding-v2";

type Category = "solutions" | "marketing" | "billing" | "engagement";

interface DraftState {
  draft: OnboardingDraft;
  setPersona: (p: PersonaSlug) => void;
  setStructure: (key: string, value: string) => void;
  toggleSelection: (category: Category, id: string) => void;
  reset: () => void;
}

export const useOnboardingDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      draft: emptyDraft(),
      setPersona: (persona) =>
        set((s) => ({ draft: { ...s.draft, persona } })),
      setStructure: (key, value) =>
        set((s) => ({
          draft: { ...s.draft, structure: { ...s.draft.structure, [key]: value } },
        })),
      toggleSelection: (category, id) =>
        set((s) => {
          const current = s.draft[category];
          const next = current.includes(id)
            ? current.filter((x) => x !== id)
            : [...current, id];
          return { draft: { ...s.draft, [category]: next } };
        }),
      reset: () => set({ draft: emptyDraft() }),
    }),
    { name: "magic-crm:onboarding-draft", version: 1 },
  ),
);
