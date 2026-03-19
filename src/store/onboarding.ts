import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BusinessContext,
  NeedsAssessment,
  TeamSize,
  FeatureDetail,
  FEATURE_CATEGORIES,
  INDUSTRY_CONFIGS,
  IndustryConfig,
} from "@/types/onboarding";

interface OnboardingStore {
  step: number;
  selectedIndustry: string;
  businessContext: BusinessContext;
  needs: NeedsAssessment;
  teamSize: TeamSize;
  featureSelections: Record<string, FeatureDetail[]>;
  isBuilding: boolean;
  buildComplete: boolean;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSelectedIndustry: (id: string) => void;
  getIndustryConfig: () => IndustryConfig | undefined;
  setBusinessContext: (ctx: Partial<BusinessContext>) => void;
  setNeed: (key: keyof NeedsAssessment, value: boolean) => void;
  toggleNeed: (key: keyof NeedsAssessment) => void;
  applySmartDefaults: () => void;
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
      selectedIndustry: "",
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

      setSelectedIndustry: (id) => {
        const config = INDUSTRY_CONFIGS.find((c) => c.id === id);
        set({
          selectedIndustry: id,
          businessContext: {
            ...get().businessContext,
            industry: config?.label || "",
          },
        });
      },

      getIndustryConfig: () => {
        const { selectedIndustry } = get();
        return INDUSTRY_CONFIGS.find((c) => c.id === selectedIndustry);
      },

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

      applySmartDefaults: () => {
        const config = get().getIndustryConfig();
        if (!config || !config.smartDefaults) return;
        set((s) => ({
          needs: { ...s.needs, ...config.smartDefaults },
          teamSize: config.suggestedTeamSize || s.teamSize,
        }));
      },

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
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          // Reset step to 0 on schema change to avoid broken state
          return { ...persisted, step: 0, selectedIndustry: persisted.selectedIndustry || "", isBuilding: false, buildComplete: false };
        }
        return persisted;
      },
    }
  )
);
