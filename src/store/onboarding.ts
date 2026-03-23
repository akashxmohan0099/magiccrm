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
  PersonaConfig,
} from "@/types/onboarding";
import {
  saveOnboardingState,
  fetchWorkspaceSettings,
  saveWorkspaceModules,
} from "@/lib/db/workspace-settings";

interface OnboardingStore {
  step: number;
  setupMethod: "guided" | "self-serve" | null;
  selectedIndustry: string;
  selectedPersona: string;
  businessContext: BusinessContext;
  needs: NeedsAssessment;
  teamSize: TeamSize;
  featureSelections: Record<string, FeatureDetail[]>;
  discoveryAnswers: Record<string, boolean>;
  drilldownAnswers: Record<string, boolean>;
  isBuilding: boolean;
  buildComplete: boolean;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSetupMethod: (method: "guided" | "self-serve") => void;
  setSelectedIndustry: (id: string) => void;
  setSelectedPersona: (id: string) => void;
  getIndustryConfig: () => IndustryConfig | undefined;
  getPersonaConfig: () => PersonaConfig | undefined;
  setBusinessContext: (ctx: Partial<BusinessContext>) => void;
  setNeed: (key: keyof NeedsAssessment, value: boolean) => void;
  toggleNeed: (key: keyof NeedsAssessment) => void;
  applySmartDefaults: () => void;
  setTeamSize: (size: TeamSize) => void;
  setFeatureSelections: (categoryId: string, features: FeatureDetail[]) => void;
  toggleFeature: (categoryId: string, featureId: string) => void;
  getActiveCategories: () => typeof FEATURE_CATEGORIES;
  hasAtLeastOneNeed: () => boolean;
  setDiscoveryAnswer: (questionId: string, value: boolean) => void;
  setDrilldownAnswer: (questionId: string, value: boolean) => void;
  setIsBuilding: (v: boolean) => void;
  setBuildComplete: (v: boolean) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

/** Extract only the serializable data keys from the store (no functions). */
function getOnboardingData(state: OnboardingStore) {
  return {
    step: state.step,
    setupMethod: state.setupMethod,
    selectedIndustry: state.selectedIndustry,
    selectedPersona: state.selectedPersona,
    businessContext: state.businessContext,
    needs: state.needs,
    teamSize: state.teamSize,
    featureSelections: state.featureSelections,
    discoveryAnswers: state.discoveryAnswers,
    drilldownAnswers: state.drilldownAnswers,
    isBuilding: state.isBuilding,
    buildComplete: state.buildComplete,
  };
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      step: 0,
      setupMethod: null,
      selectedIndustry: "",
      selectedPersona: "",
      businessContext: {
        businessName: "",
        businessDescription: "",
        industry: "",
        industryOther: "",
        location: "",
      },
      needs: {
        // Always-on modules — default true
        manageCustomers: true,
        receiveInquiries: true,
        communicateClients: true,
        sendInvoices: true,
        // Question-gated modules — default false until user answers
        acceptBookings: false,
        manageProjects: false,
        runMarketing: false,
        // Now add-ons — kept for backward compat
        handleSupport: false,
        manageDocuments: false,
      },
      teamSize: "",
      featureSelections: {},
      discoveryAnswers: {},
      drilldownAnswers: {},
      isBuilding: false,
      buildComplete: false,

      setStep: (step) => set({ step }),
      nextStep: () => set((s) => ({ step: s.step + 1 })),
      prevStep: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
      setSetupMethod: (method) => set({
        setupMethod: method,
        // Clear path-specific data when switching
        discoveryAnswers: {},
        drilldownAnswers: {},
        featureSelections: {},
      }),

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

      setSelectedPersona: (id) => set({ selectedPersona: id }),

      getIndustryConfig: () => {
        const { selectedIndustry } = get();
        return INDUSTRY_CONFIGS.find((c) => c.id === selectedIndustry);
      },

      getPersonaConfig: () => {
        const { selectedIndustry, selectedPersona } = get();
        const industry = INDUSTRY_CONFIGS.find((c) => c.id === selectedIndustry);
        if (!industry?.personas || !selectedPersona) return undefined;
        return industry.personas.find((p) => p.id === selectedPersona);
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
        if (!config) return;
        const persona = get().getPersonaConfig();
        // Only set team size — needs stay blank for the user to answer fresh
        const teamSize = persona?.suggestedTeamSize || config.suggestedTeamSize || get().teamSize;
        set({ teamSize });
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

      setDiscoveryAnswer: (questionId, value) =>
        set((s) => ({
          discoveryAnswers: { ...s.discoveryAnswers, [questionId]: value },
        })),

      setDrilldownAnswer: (questionId, value) =>
        set((s) => ({
          drilldownAnswers: { ...s.drilldownAnswers, [questionId]: value },
        })),

      setIsBuilding: (v) => {
        set({ isBuilding: v });

        // When building starts (end of onboarding), sync to Supabase.
        // workspaceId is not available here — callers should invoke
        // syncToSupabase explicitly after setIsBuilding(true).
      },

      setBuildComplete: (v) => set({ buildComplete: v }),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const data = getOnboardingData(get());

          // 1. Save onboarding state to workspace_settings.onboarding
          await saveOnboardingState(workspaceId, data);

          // 2. Also persist feature selections to workspace_modules
          const { featureSelections, needs } = get();
          const modules = FEATURE_CATEGORIES
            .filter((cat) => needs[cat.id])
            .map((cat) => ({
              moduleId: cat.id,
              enabled: true,
              featureSelections: featureSelections[cat.id] ?? [],
            }));

          if (modules.length > 0) {
            await saveWorkspaceModules(workspaceId, modules);
          }
        } catch (err) {
          console.error("[onboarding] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const settings = await fetchWorkspaceSettings(workspaceId);
          if (!settings?.onboarding) return;

          const remote = settings.onboarding as Record<string, unknown>;

          // Only hydrate if the remote has meaningful data
          if (remote.selectedIndustry || remote.buildComplete) {
            set({
              step: (remote.step as number) ?? get().step,
              setupMethod: (remote.setupMethod as "guided" | "self-serve" | null) ?? get().setupMethod,
              selectedIndustry: (remote.selectedIndustry as string) ?? get().selectedIndustry,
              selectedPersona: (remote.selectedPersona as string) ?? get().selectedPersona,
              businessContext: (remote.businessContext as BusinessContext) ?? get().businessContext,
              needs: (remote.needs as NeedsAssessment) ?? get().needs,
              teamSize: (remote.teamSize as TeamSize) ?? get().teamSize,
              featureSelections: (remote.featureSelections as Record<string, FeatureDetail[]>) ?? get().featureSelections,
              discoveryAnswers: (remote.discoveryAnswers as Record<string, boolean>) ?? get().discoveryAnswers,
              drilldownAnswers: (remote.drilldownAnswers as Record<string, boolean>) ?? get().drilldownAnswers,
              isBuilding: (remote.isBuilding as boolean) ?? get().isBuilding,
              buildComplete: (remote.buildComplete as boolean) ?? get().buildComplete,
            });
          }
        } catch (err) {
          console.error("[onboarding] loadFromSupabase failed:", err);
        }
      },
    }),
    {
      name: "magic-crm-onboarding",
      version: 8,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persisted: any, version: number) => {
        if (version < 8) {
          // v8: always-on modules, simplified questions, documents+support moved to add-ons.
          return {
            ...persisted,
            step: 0,
            setupMethod: null,
            featureSelections: {},
            discoveryAnswers: {},
            drilldownAnswers: {},
            needs: {
              manageCustomers: true,
              receiveInquiries: true,
              communicateClients: true,
              sendInvoices: true,
              acceptBookings: false,
              manageProjects: false,
              runMarketing: false,
              handleSupport: false,
              manageDocuments: false,
            },
          };
        }
        return persisted;
      },
    }
  )
);
