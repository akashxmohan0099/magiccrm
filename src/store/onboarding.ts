import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BusinessContext,
  NeedsAssessment,
  TeamSize,
  FeatureDetail,
  INDUSTRY_CONFIGS,
  IndustryConfig,
  PersonaConfig,
} from "@/types/onboarding";
import type { PresentationPatch } from "@/types/workspace-blueprint";
import {
  saveOnboardingState,
  fetchWorkspaceSettings,
  saveWorkspaceModules,
} from "@/lib/db/workspace-settings";
import { computeEnabledModuleIds, getCoreModules, getModuleById } from "@/lib/module-registry";
import { extractTuningState } from "@/lib/onboarding-tuning";
import { getProfileForAIPrompt } from "@/lib/persona-profiles";

interface AIQuestionCategory {
  title: string;
  subtitle: string;
  questions: { question: string; module: string }[];
}

// Step constants (0=Welcome, 1=Persona+Business, 2=Bubbles, 3=Follow-ups+Channels, 4=Summary, 5=Signup)
const FINAL_STEP_INDEX = 5;
export const TOTAL_PROGRESS_STEPS = FINAL_STEP_INDEX + 1;

interface OnboardingStore {
  step: number;
  selectedIndustry: string;
  selectedPersona: string;
  businessContext: BusinessContext;
  needs: NeedsAssessment;
  teamSize: TeamSize;
  operatingModel: {
    workLocation: "" | "fixed" | "mobile" | "both";
    clientele: "" | "women" | "men" | "everyone";
    sellProducts: boolean;
  };
  featureSelections: Record<string, FeatureDetail[]>;
  discoveryAnswers: Record<string, boolean>;
  isBuilding: boolean;
  buildComplete: boolean;

  // Persisted step-level state (survives back/refresh)
  chipSelections: string[];
  aiCategories: AIQuestionCategory[];
  aiAnswers: Record<string, boolean>;
  deepDiveAnswers: Record<string, boolean | string[]>;
  featureActivationLog: import("@/lib/deep-dive-analytics").FeatureActivation[];

  // Tuning API results (personalized module presentation)
  tuningPatches: PresentationPatch[];
  tuningModuleMeta: Record<string, { label: string; description: string }>;
  tuningCombinations: string[];
  tuningLoaded: boolean;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSelectedIndustry: (id: string) => void;
  setSelectedPersona: (id: string) => void;
  getIndustryConfig: () => IndustryConfig | undefined;
  getPersonaConfig: () => PersonaConfig | undefined;
  setBusinessContext: (ctx: Partial<BusinessContext>) => void;
  setNeed: (key: keyof NeedsAssessment, value: boolean) => void;
  toggleNeed: (key: keyof NeedsAssessment) => void;
  applySmartDefaults: () => void;
  setTeamSize: (size: TeamSize) => void;
  setOperatingModel: (model: Partial<{ workLocation: "" | "fixed" | "mobile" | "both"; clientele: "" | "women" | "men" | "everyone"; sellProducts: boolean }>) => void;
  setFeatureSelections: (categoryId: string, features: FeatureDetail[]) => void;
  toggleFeature: (categoryId: string, featureId: string) => void;
  hasAtLeastOneNeed: () => boolean;
  setDiscoveryAnswer: (questionId: string, value: boolean) => void;
  setIsBuilding: (v: boolean) => void;
  setBuildComplete: (v: boolean) => void;
  setChipSelections: (chips: string[]) => void;
  toggleChip: (chipId: string) => void;
  setAICategories: (cats: AIQuestionCategory[]) => void;
  setAIAnswer: (key: string, value: boolean) => void;
  setDeepDiveAnswer: (key: string, value: boolean | string[]) => void;
  addFeatureActivation: (activation: import("@/lib/deep-dive-analytics").FeatureActivation) => void;

  // Tuning API
  requestTuning: () => Promise<void>;
  setTuningCombinationChoice: (combinationId: string, accepted: boolean) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<boolean>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

/** Extract only the serializable data keys from the store (no functions). */
function getOnboardingData(state: OnboardingStore) {
  return {
    step: state.step,
    selectedIndustry: state.selectedIndustry,
    selectedPersona: state.selectedPersona,
    businessContext: state.businessContext,
    needs: state.needs,
    teamSize: state.teamSize,
    operatingModel: state.operatingModel,
    featureSelections: state.featureSelections,
    discoveryAnswers: state.discoveryAnswers,
    // isBuilding is transient UI state (animation only) — always false when persisting
    isBuilding: false,
    // buildComplete must be persisted so returning users skip onboarding
    buildComplete: state.buildComplete,
    chipSelections: state.chipSelections,
    aiCategories: state.aiCategories,
    aiAnswers: state.aiAnswers,
    deepDiveAnswers: state.deepDiveAnswers,
    featureActivationLog: state.featureActivationLog,
    tuningPatches: state.tuningPatches,
    tuningModuleMeta: state.tuningModuleMeta,
    tuningCombinations: state.tuningCombinations,
    tuningLoaded: state.tuningLoaded,
  };
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      step: 0,
      selectedIndustry: "beauty-wellness",
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
      operatingModel: {
        workLocation: "",
        clientele: "",
        sellProducts: false,
      },
      featureSelections: {},
      discoveryAnswers: {},
      isBuilding: false,
      buildComplete: false,
      chipSelections: [],
      aiCategories: [],
      aiAnswers: {},
      deepDiveAnswers: {},
      featureActivationLog: [],
      tuningPatches: [],
      tuningModuleMeta: {},
      tuningCombinations: [],
      tuningLoaded: false,

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
        const teamSize = persona?.suggestedTeamSize || config.suggestedTeamSize || get().teamSize;

        // Apply industry smart defaults to needs, then overlay persona overrides
        const smartNeeds: Partial<NeedsAssessment> = {
          ...config.smartDefaults,
          ...(persona?.smartDefaultOverrides || {}),
        };
        const currentNeeds = get().needs;
        const mergedNeeds = { ...currentNeeds };
        for (const [key, val] of Object.entries(smartNeeds)) {
          if (val !== undefined) {
            mergedNeeds[key as keyof NeedsAssessment] = val;
          }
        }

        set({ teamSize, needs: mergedNeeds });

        // Auto-enable products/services for industries that always need a service menu
        const serviceIndustries = new Set(["beauty-wellness", "health-fitness", "education-coaching"]);
        if (serviceIndustries.has(config.id)) {
          get().setDiscoveryAnswer("module:products", true);
        }
      },

      setTeamSize: (size) => set({ teamSize: size }),
      setOperatingModel: (model: Partial<{ workLocation: "" | "fixed" | "mobile" | "both"; clientele: "" | "women" | "men" | "everyone"; sellProducts: boolean }>) =>
        set((s) => ({ operatingModel: { ...s.operatingModel, ...model } })),

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

      hasAtLeastOneNeed: () => {
        const { needs } = get();
        return Object.values(needs).some(Boolean);
      },

      setDiscoveryAnswer: (questionId, value) =>
        set((s) => ({
          discoveryAnswers: { ...s.discoveryAnswers, [questionId]: value },
        })),

      setIsBuilding: (v) => {
        set({ isBuilding: v });

        // When building starts (end of onboarding), sync to Supabase.
        // workspaceId is not available here — callers should invoke
        // syncToSupabase explicitly after setIsBuilding(true).
      },

      setBuildComplete: (v) => set({ buildComplete: v }),

      setChipSelections: (chips) => set({ chipSelections: chips }),
      toggleChip: (chipId) =>
        set((s) => {
          const set_ = new Set(s.chipSelections);
          if (set_.has(chipId)) set_.delete(chipId);
          else set_.add(chipId);
          return { chipSelections: Array.from(set_) };
        }),
      setAICategories: (cats) => set({ aiCategories: cats }),
      setAIAnswer: (key, value) =>
        set((s) => ({ aiAnswers: { ...s.aiAnswers, [key]: value } })),
      setDeepDiveAnswer: (key, value) =>
        set((s) => ({ deepDiveAnswers: { ...s.deepDiveAnswers, [key]: value } })),
      addFeatureActivation: (activation) =>
        set((s) => ({ featureActivationLog: [...s.featureActivationLog, activation] })),

      // ---------------------------------------------------------------
      // Tuning API — personalize module presentation
      // ---------------------------------------------------------------

      requestTuning: async () => {
        try {
          const state = get();
          const enabledIds = Array.from(
            computeEnabledModuleIds(state.needs, state.discoveryAnswers)
          );
          const personaProfile = getProfileForAIPrompt(state.selectedPersona);

          const res = await fetch("/api/onboarding/tune", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              industry: state.selectedIndustry,
              persona: state.selectedPersona,
              businessName: state.businessContext.businessName,
              businessDescription: state.businessContext.businessDescription,
              location: state.businessContext.location,
              chipSelections: state.chipSelections,
              enabledModuleIds: enabledIds,
              personaProfile,
            }),
          });

          if (!res.ok) {
            set({ tuningLoaded: true });
            return;
          }

          const data = await res.json();
          const { patches, moduleMeta, combinationIds } = extractTuningState(data);

          set({
            tuningPatches: patches,
            tuningModuleMeta: moduleMeta,
            tuningCombinations: combinationIds,
            tuningLoaded: true,
          });
        } catch (err) {
          if (process.env.NODE_ENV === "development") console.error("[onboarding] requestTuning failed:", err);
          set({ tuningLoaded: true });
        }
      },

      setTuningCombinationChoice: (combinationId, accepted) => {
        const state = get();
        if (accepted) {
          // Add combination if not already present
          if (!state.tuningCombinations.includes(combinationId)) {
            set({ tuningCombinations: [...state.tuningCombinations, combinationId] });
          }
        } else {
          // Remove combination and its patches
          set({
            tuningCombinations: state.tuningCombinations.filter((id) => id !== combinationId),
            tuningPatches: state.tuningPatches.filter(
              (p) => !(p.op === "apply-module-combination" && (p as { combinationId: string }).combinationId === combinationId)
            ),
          });
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const data = getOnboardingData(get());

          // 1. Save onboarding state to workspace_settings.onboarding
          await saveOnboardingState(workspaceId, data);

          // 2. Also persist enabled modules to workspace_modules
          // Use computeEnabledModuleIds for the canonical set of enabled module IDs
          const { needs: currentNeeds, discoveryAnswers: currentDA, featureSelections } = get();
          const enabledIds = computeEnabledModuleIds(currentNeeds, currentDA);
          const persistedModuleIds = new Set([
            ...getCoreModules().map((mod) => mod.id),
            ...Array.from(enabledIds).filter((modId) => getModuleById(modId)?.kind === "addon"),
          ]);

          const modules = Array.from(persistedModuleIds).map((modId) => ({
            moduleId: modId,
            enabled: enabledIds.has(modId),
            featureSelections: featureSelections[modId] ?? [],
          }));

          if (modules.length > 0) {
            await saveWorkspaceModules(workspaceId, modules);
          }
          return true;
        } catch (err) {
          const { handleSyncError } = await import("@/lib/sync-error-handler");
          handleSyncError(err, { context: "saving workspace setup" });
          return false;
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
              selectedIndustry: (remote.selectedIndustry as string) ?? get().selectedIndustry,
              selectedPersona: (remote.selectedPersona as string) ?? get().selectedPersona,
              businessContext: (remote.businessContext as BusinessContext) ?? get().businessContext,
              needs: (remote.needs as NeedsAssessment) ?? get().needs,
              teamSize: (remote.teamSize as TeamSize) ?? get().teamSize,
              featureSelections: (remote.featureSelections as Record<string, FeatureDetail[]>) ?? get().featureSelections,
              discoveryAnswers: (remote.discoveryAnswers as Record<string, boolean>) ?? get().discoveryAnswers,
              isBuilding: (remote.isBuilding as boolean) ?? get().isBuilding,
              buildComplete: (remote.buildComplete as boolean) ?? get().buildComplete,
            });
          }
        } catch (err) {
          if (process.env.NODE_ENV === "development") console.error("[onboarding] loadFromSupabase failed:", err);
          // Don't toast on load — user may be offline or first-time
        }
      },
    }),
    {
      name: "magic-crm-onboarding",
      version: 19,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persisted: any, version: number) => {
        if (version < 17) {
          // Full reset — v17: universal travel chip (chip IDs changed),
          // hybrid local + AI questions, persona profiles
          return {
            ...persisted,
            step: 0,
            featureSelections: {},
            discoveryAnswers: {},
            isBuilding: false,
            buildComplete: false,
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
            chipSelections: [],
            aiCategories: [],
            aiAnswers: {},
            deepDiveAnswers: {},
            featureActivationLog: [],
            tuningPatches: [],
            tuningModuleMeta: {},
            tuningCombinations: [],
            tuningLoaded: false,
          };
        }
        if (version < 18) {
          // v18: Module tuning system — add tuning fields
          return {
            ...persisted,
            tuningPatches: [],
            tuningModuleMeta: {},
            tuningCombinations: [],
            tuningLoaded: false,
          };
        }
        if (version < 19) {
          return {
            ...persisted,
            chipSelections: [],
            aiCategories: [],
            aiAnswers: {},
            deepDiveAnswers: {},
            featureActivationLog: [],
          };
        }
        return persisted;
      },
    }
  )
);
