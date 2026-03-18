import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BusinessContext,
  NeedsAssessment,
  TeamSize,
  FeatureDetail,
  FEATURE_CATEGORIES,
} from "@/types/onboarding";

interface OnboardingStore {
  step: number;
  businessContext: BusinessContext;
  needs: NeedsAssessment;
  teamSize: TeamSize;
  featureSelections: Record<string, FeatureDetail[]>;
  isBuilding: boolean;
  buildComplete: boolean;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setBusinessContext: (ctx: Partial<BusinessContext>) => void;
  setNeed: (key: keyof NeedsAssessment, value: boolean) => void;
  toggleNeed: (key: keyof NeedsAssessment) => void;
  setTeamSize: (size: TeamSize) => void;
  setFeatureSelections: (categoryId: string, features: FeatureDetail[]) => void;
  toggleFeature: (categoryId: string, featureId: string) => void;
  getActiveCategories: () => typeof FEATURE_CATEGORIES;
  hasAtLeastOneNeed: () => boolean;
  setIsBuilding: (v: boolean) => void;
  setBuildComplete: (v: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      step: 0,
      businessContext: {
        businessName: "",
        businessDescription: "",
        industry: "",
        industryOther: "",
        location: "",
      },
      needs: {
        manageCustomers: false,
        receiveInquiries: false,
        communicateClients: false,
        acceptBookings: false,
        sendInvoices: false,
        manageProjects: false,
        runMarketing: false,
        handleSupport: false,
        manageDocuments: false,
      },
      teamSize: "",
      featureSelections: {},
      isBuilding: false,
      buildComplete: false,

      setStep: (step) => set({ step }),
      nextStep: () => set((s) => ({ step: s.step + 1 })),
      prevStep: () => set((s) => ({ step: Math.max(0, s.step - 1) })),

      setBusinessContext: (ctx) =>
        set((s) => ({ businessContext: { ...s.businessContext, ...ctx } })),

      setNeed: (key, value) =>
        set((s) => ({
          needs: { ...s.needs, [key]: value },
        })),

      toggleNeed: (key) =>
        set((s) => ({
          needs: { ...s.needs, [key]: !s.needs[key] },
        })),

      setTeamSize: (size) => set({ teamSize: size }),

      setFeatureSelections: (categoryId, features) =>
        set((s) => ({
          featureSelections: { ...s.featureSelections, [categoryId]: features },
        })),

      toggleFeature: (categoryId, featureId) =>
        set((s) => {
          const features = s.featureSelections[categoryId] || [];
          return {
            featureSelections: {
              ...s.featureSelections,
              [categoryId]: features.map((f) =>
                f.id === featureId ? { ...f, selected: !f.selected } : f
              ),
            },
          };
        }),

      getActiveCategories: () => {
        const { needs } = get();
        return FEATURE_CATEGORIES.filter((cat) => needs[cat.id]);
      },

      hasAtLeastOneNeed: () => {
        const { needs } = get();
        return Object.values(needs).some(Boolean);
      },

      setIsBuilding: (v) => set({ isBuilding: v }),
      setBuildComplete: (v) => set({ buildComplete: v }),
    }),
    {
      name: "magic-crm-onboarding",
    }
  )
);
