"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { FEATURE_CATEGORIES, FeatureDetail, NeedsAssessment } from "@/types/onboarding";
import { getPersonaQuestions, getIndustryFallbackQuestions } from "@/lib/persona-questions";
import { getAddonModules } from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";

const MODULE_TO_NEED: Record<string, keyof NeedsAssessment> = {
  "client-database": "manageCustomers",
  "leads-pipeline": "receiveInquiries",
  "communication": "communicateClients",
  "bookings-calendar": "acceptBookings",
  "quotes-invoicing": "sendInvoices",
  "jobs-projects": "manageProjects",
  "marketing": "runMarketing",
  "support": "handleSupport",
  "documents": "manageDocuments",
};

const NEED_TO_MODULE: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_TO_NEED).map(([mod, need]) => [need, mod])
);

// Only show the top N most important features per module to keep cognition low
const MAX_FEATURES_SHOWN = 6;

export function FeatureSelectionStep() {
  const {
    selectedPersona,
    discoveryAnswers,
    setFeatureSelections,
    setNeed,
    nextStep,
    prevStep,
  } = useOnboardingStore();

  const selectedIndustry = useOnboardingStore((s) => s.selectedIndustry);

  const personaConfig = useMemo(() => {
    if (selectedPersona) return getPersonaQuestions(selectedPersona);
    return null;
  }, [selectedPersona]);

  const discoveryQuestions = useMemo(() => {
    if (selectedPersona) return getPersonaQuestions(selectedPersona).questions;
    const fallback = getIndustryFallbackQuestions(selectedIndustry);
    return fallback?.questions ?? getPersonaQuestions("hair-salon").questions;
  }, [selectedPersona, selectedIndustry]);

  const recommendedFeatures = useMemo(() => {
    const recommended = new Set<string>();
    for (const question of discoveryQuestions) {
      if (discoveryAnswers[question.id] === true) {
        for (const feat of question.defaultOnFeatures) {
          recommended.add(`${feat.moduleId}:${feat.featureId}`);
        }
      }
    }
    return recommended;
  }, [discoveryQuestions, discoveryAnswers]);

  const activatedModuleIds = useMemo(() => {
    const activated = new Set<string>();
    for (const question of discoveryQuestions) {
      if (discoveryAnswers[question.id] === true) {
        for (const moduleId of question.activatesModules) {
          activated.add(moduleId);
        }
      }
    }
    return activated;
  }, [discoveryQuestions, discoveryAnswers]);

  // Filter to only modules that are activated + visible
  const visibleCategories = useMemo(() => {
    const hiddenModuleIds = new Set(personaConfig?.visibility.hiddenModules || []);
    const hiddenFeatureKeys = new Set(
      (personaConfig?.visibility.hiddenFeatures || []).map(
        (f) => `${f.moduleId}:${f.featureId}`
      )
    );

    return FEATURE_CATEGORIES
      .filter((cat) => {
        const moduleId = NEED_TO_MODULE[cat.id];
        if (hiddenModuleIds.has(moduleId) || hiddenModuleIds.has(cat.id)) return false;
        // Only show modules that were activated by discovery answers or are always-on
        const isAlwaysOn = ["manageCustomers", "receiveInquiries", "communicateClients", "sendInvoices"].includes(cat.id);
        return isAlwaysOn || activatedModuleIds.has(moduleId);
      })
      .map((cat) => ({
        ...cat,
        features: cat.features
          .filter((f) => {
            const moduleId = NEED_TO_MODULE[cat.id];
            return !hiddenFeatureKeys.has(`${moduleId}:${f.id}`) && !hiddenFeatureKeys.has(`${cat.id}:${f.id}`);
          })
          .slice(0, MAX_FEATURES_SHOWN), // Only show top N
      }));
  }, [personaConfig, activatedModuleIds]);

  // Build initial selections
  const [selections, setSelections] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    for (const cat of visibleCategories) {
      initial[cat.id] = {};
      const moduleId = NEED_TO_MODULE[cat.id];
      const isModuleActivated = activatedModuleIds.has(moduleId);
      for (const feature of cat.features) {
        const isRecommended = recommendedFeatures.has(`${moduleId}:${feature.id}`);
        initial[cat.id][feature.id] = isRecommended || (isModuleActivated && feature.selected);
      }
    }
    return initial;
  });

  // One module at a time
  const [moduleIndex, setModuleIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const currentCategory = visibleCategories[moduleIndex];
  const totalModules = visibleCategories.length;
  const progress = ((moduleIndex + 1) / totalModules) * 100;

  const toggleFeature = (catId: string, featureId: string) => {
    setSelections((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], [featureId]: !prev[catId]?.[featureId] },
    }));
  };

  const handleNext = () => {
    setDirection(1);
    if (moduleIndex < totalModules - 1) {
      setModuleIndex((prev) => prev + 1);
    } else {
      // Last module — persist everything and continue
      persistSelections();
      nextStep();
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (moduleIndex <= 0) {
      prevStep();
    } else {
      setModuleIndex((prev) => prev - 1);
    }
  };

  const persistSelections = () => {
    for (const cat of visibleCategories) {
      const features: FeatureDetail[] = cat.features.map((f) => ({
        id: f.id,
        label: f.label,
        description: f.description,
        selected: selections[cat.id]?.[f.id] ?? false,
      }));
      setFeatureSelections(cat.id, features);
      const moduleId = NEED_TO_MODULE[cat.id];
      if (moduleId) setFeatureSelections(moduleId, features);
      const needKey = cat.id as keyof NeedsAssessment;
      const hasAnySelected = features.some((f) => f.selected);
      setNeed(needKey, hasAnySelected);
    }

    // Enable add-ons from discovery answers
    const addonModules = getAddonModules();
    const addonIds = new Set(addonModules.map((m) => m.id));
    const addonsStore = useAddonsStore.getState();
    for (const addonId of activatedModuleIds) {
      if (addonIds.has(addonId)) {
        const addonDef = addonModules.find((m) => m.id === addonId);
        if (addonDef && !addonsStore.isAddonEnabled(addonId)) {
          addonsStore.enableAddon(addonId, addonDef.name);
        }
      }
    }

    // Enable default channels
    if (personaConfig?.defaultChannels && personaConfig.defaultChannels.length > 0) {
      const commCat = visibleCategories.find((c) => NEED_TO_MODULE[c.id] === "communication");
      if (commCat) {
        const currentFeatures: FeatureDetail[] = commCat.features.map((f) => ({
          id: f.id,
          label: f.label,
          description: f.description,
          selected: selections[commCat.id]?.[f.id] ?? false,
        }));
        const channelSet = new Set(personaConfig.defaultChannels);
        for (const feat of currentFeatures) {
          if (channelSet.has(feat.id) && !feat.selected) feat.selected = true;
        }
        setFeatureSelections(commCat.id, currentFeatures);
        setNeed(commCat.id as keyof NeedsAssessment, true);
      }
    }
  };

  if (!currentCategory) return null;

  const catSelections = selections[currentCategory.id] || {};
  const selectedCount = Object.values(catSelections).filter(Boolean).length;

  // Sort: checked items first, then unchecked
  const sortedFeatures = [...currentCategory.features].sort((a, b) => {
    const aOn = catSelections[a.id] ? 1 : 0;
    const bOn = catSelections[b.id] ? 1 : 0;
    return bOn - aOn;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Top bar — full width */}
      <div className="pt-6 px-6 lg:px-20">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <span className="text-[12px] text-text-tertiary font-medium tabular-nums">
            {moduleIndex + 1}/{totalModules}
          </span>
        </div>
      </div>

      {/* Module card */}
      <div className="flex-1 flex flex-col justify-center px-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentCategory.id}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
            transition={{ duration: 0.2 }}
          >
            {/* Module header */}
            <div className="mb-6">
              <h2 className="text-[24px] font-bold text-foreground tracking-tight mb-1">
                {currentCategory.name}
              </h2>
              <p className="text-[14px] text-text-tertiary">
                {currentCategory.description}
              </p>
              <p className="text-[12px] text-text-tertiary mt-1">
                {selectedCount} of {currentCategory.features.length} features enabled
              </p>
            </div>

            {/* Feature toggles */}
            <div className="space-y-2 mb-6">
              {sortedFeatures.map((feature) => {
                const isOn = catSelections[feature.id] ?? false;
                return (
                  <motion.button
                    key={feature.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleFeature(currentCategory.id, feature.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-150 cursor-pointer text-left ${
                      isOn
                        ? "bg-primary/[0.06] border border-primary/20"
                        : "bg-card-bg border border-border-light hover:border-foreground/15"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                        isOn
                          ? "bg-primary"
                          : "border-2 border-border-light"
                      }`}
                    >
                      {isOn && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium ${isOn ? "text-foreground" : "text-text-secondary"}`}>
                        {feature.label}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Hint */}
            <p className="text-[12px] text-text-tertiary text-center">
              You can access more features from settings after setup.
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next button */}
      <div className="px-4 pb-8 pt-4">
        <button
          onClick={handleNext}
          className="w-full py-4 bg-foreground text-white rounded-2xl text-[15px] font-semibold cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          {moduleIndex < totalModules - 1 ? "Next" : "Finish Setup"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
