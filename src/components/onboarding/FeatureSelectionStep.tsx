"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Inbox, Calendar, Receipt, FolderKanban, Megaphone,
  MessageCircle, Headphones, FileText, Check, ArrowLeft,
  ArrowRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { FEATURE_CATEGORIES, FeatureDetail, NeedsAssessment } from "@/types/onboarding";
import { getPersonaQuestions, getIndustryFallbackQuestions } from "@/lib/persona-questions";
import { getAddonModules } from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Megaphone, MessageCircle, Headphones, FileText,
};

/**
 * Step 6: Feature Review
 *
 * Shows ALL features organized by module as collapsible sections.
 * Features are PRE-CHECKED based on discovery + drill-down answers.
 * Hidden modules/features from persona visibility config are filtered out.
 * User can freely check/uncheck anything.
 */
export function FeatureSelectionStep() {
  const {
    selectedPersona,
    discoveryAnswers,
    drilldownAnswers,
    featureSelections: _featureSelections,
    setFeatureSelections,
    setNeed,
    nextStep,
    prevStep,
    getPersonaConfig,
    businessContext,
  } = useOnboardingStore();

  const _persona = getPersonaConfig();

  // Get persona question config for visibility + feature mapping
  const personaConfig = useMemo(() => {
    if (selectedPersona) {
      return getPersonaQuestions(selectedPersona);
    }
    return null;
  }, [selectedPersona]);

  const selectedIndustry = useOnboardingStore((s) => s.selectedIndustry);

  // Get discovery questions for feature mapping
  const discoveryQuestions = useMemo(() => {
    if (selectedPersona) {
      return getPersonaQuestions(selectedPersona).questions;
    }
    const fallback = getIndustryFallbackQuestions(selectedIndustry);
    return fallback?.questions ?? getPersonaQuestions("hair-salon").questions;
  }, [selectedPersona, selectedIndustry]);

  // Build the set of recommended feature IDs based on discovery + drilldown answers
  const recommendedFeatures = useMemo(() => {
    const recommended = new Set<string>();

    for (const question of discoveryQuestions) {
      if (discoveryAnswers[question.id] === true) {
        // Add default-on features for "yes" discovery questions
        for (const feat of question.defaultOnFeatures) {
          recommended.add(`${feat.moduleId}:${feat.featureId}`);
        }

        // (follow-up drilldowns removed — questions are yes/no only now)
      }
    }

    return recommended;
  }, [discoveryQuestions, discoveryAnswers, drilldownAnswers]);

  // Determine which modules are activated by discovery answers
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

  // Map module IDs back to NeedsAssessment keys for the store
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

  // Need key to module ID for matching
  const NEED_TO_MODULE: Record<string, string> = Object.fromEntries(
    Object.entries(MODULE_TO_NEED).map(([mod, need]) => [need, mod])
  );

  // Filter visible categories based on persona visibility
  const visibleCategories = useMemo(() => {
    const hiddenModuleIds = new Set(personaConfig?.visibility.hiddenModules || []);
    const hiddenFeatureKeys = new Set(
      (personaConfig?.visibility.hiddenFeatures || []).map(
        (f) => `${f.moduleId}:${f.featureId}`
      )
    );

    return FEATURE_CATEGORIES
      .filter((cat) => {
        // Map needs key to module ID and check if hidden
        const moduleId = NEED_TO_MODULE[cat.id];
        return !hiddenModuleIds.has(moduleId) && !hiddenModuleIds.has(cat.id);
      })
      .map((cat) => ({
        ...cat,
        features: cat.features.filter((f) => {
          const moduleId = NEED_TO_MODULE[cat.id];
          return !hiddenFeatureKeys.has(`${moduleId}:${f.id}`) && !hiddenFeatureKeys.has(`${cat.id}:${f.id}`);
        }),
      }));
  }, [personaConfig, NEED_TO_MODULE]);

  // Build initial selections: pre-check based on recommendations
  const [selections, setSelections] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    for (const cat of visibleCategories) {
      initial[cat.id] = {};
      const moduleId = NEED_TO_MODULE[cat.id];
      const isModuleActivated = activatedModuleIds.has(moduleId);

      for (const feature of cat.features) {
        // Check if this specific feature was recommended
        const isRecommended = recommendedFeatures.has(`${moduleId}:${feature.id}`);
        // Use the feature's default `selected` state if the module is activated,
        // or if this specific feature was recommended
        initial[cat.id][feature.id] = isRecommended || (isModuleActivated && feature.selected);
      }
    }
    return initial;
  });

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Auto-expand sections that have activated modules
    const expanded = new Set<string>();
    for (const cat of visibleCategories) {
      const moduleId = NEED_TO_MODULE[cat.id];
      if (activatedModuleIds.has(moduleId)) {
        expanded.add(cat.id);
      }
    }
    return expanded;
  });

  const toggleSection = (catId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const toggleFeature = (catId: string, featureId: string) => {
    setSelections((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], [featureId]: !prev[catId]?.[featureId] },
    }));
  };

  const getSelectedCount = useCallback(
    (catId: string) => {
      const catSelections = selections[catId] || {};
      return Object.values(catSelections).filter(Boolean).length;
    },
    [selections]
  );

  const totalSelected = useMemo(
    () => Object.values(selections).reduce(
      (acc, catSel) => acc + Object.values(catSel).filter(Boolean).length,
      0
    ),
    [selections]
  );

  const handleContinue = () => {
    // Persist selections to the store
    for (const cat of visibleCategories) {
      const features: FeatureDetail[] = cat.features.map((f) => ({
        id: f.id,
        label: f.label,
        description: f.description,
        selected: selections[cat.id]?.[f.id] ?? false,
      }));
      setFeatureSelections(cat.id, features);

      // Also write under the module registry ID so the sidebar can find it
      const moduleId = NEED_TO_MODULE[cat.id];
      if (moduleId) {
        setFeatureSelections(moduleId, features);
      }

      // Also set the needs assessment based on whether any features are selected
      const needKey = cat.id as keyof NeedsAssessment;
      const hasAnySelected = features.some((f) => f.selected);
      setNeed(needKey, hasAnySelected);
    }

    // Finding 1: Auto-enable add-on modules activated by discovery answers
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

    // Finding 3: Auto-enable defaultChannels as selected communication sub-features
    if (personaConfig?.defaultChannels && personaConfig.defaultChannels.length > 0) {
      const commCat = visibleCategories.find((c) => NEED_TO_MODULE[c.id] === "communication");
      if (commCat) {
        const currentFeatures: FeatureDetail[] = commCat.features.map((f) => ({
          id: f.id,
          label: f.label,
          description: f.description,
          selected: selections[commCat.id]?.[f.id] ?? false,
        }));
        // Enable any defaultChannel sub-features that exist in the communication block
        const channelSet = new Set(personaConfig.defaultChannels);
        let changed = false;
        for (const feat of currentFeatures) {
          if (channelSet.has(feat.id) && !feat.selected) {
            feat.selected = true;
            changed = true;
          }
        }
        if (changed) {
          setFeatureSelections(commCat.id, currentFeatures);
          setNeed(commCat.id as keyof NeedsAssessment, true);
        }
      }
    }

    nextStep();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="pt-6 px-4">
        <button
          onClick={prevStep}
          className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="mb-6">
          <h2 className="text-[24px] font-bold text-foreground tracking-tight mb-2">
            {businessContext.businessName
              ? `${businessContext.businessName}'s feature kit`
              : "Your feature kit"}
          </h2>
          <p className="text-[15px] text-text-secondary leading-relaxed">
            We&apos;ve pre-selected features based on your answers. Review and customize.
          </p>
          <p className="text-[13px] text-text-tertiary mt-1">
            {totalSelected} features selected across {visibleCategories.length} modules
          </p>
        </div>
      </div>

      {/* Scrollable module list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-3">
          {visibleCategories.map((cat, catIdx) => {
            const IconComp = ICON_MAP[cat.icon];
            const isExpanded = expandedSections.has(cat.id);
            const selectedCount = getSelectedCount(cat.id);
            const _totalFeatures = cat.features.length;
            const moduleId = NEED_TO_MODULE[cat.id];
            const isActivated = activatedModuleIds.has(moduleId);

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.04 }}
                className={`rounded-xl border overflow-hidden transition-colors ${
                  isActivated
                    ? "border-foreground/15 bg-card-bg"
                    : "border-border-light bg-card-bg"
                }`}
              >
                {/* Section header */}
                <button
                  onClick={() => toggleSection(cat.id)}
                  className="w-full flex items-center gap-3 p-4 cursor-pointer hover:bg-surface/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    {IconComp && <IconComp className="w-4 h-4 text-foreground" />}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-[14px] font-semibold text-foreground tracking-tight">
                      {cat.name}
                    </h3>
                    <p className="text-[12px] text-text-tertiary">{cat.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedCount > 0 && (
                      <span className="px-2 py-0.5 bg-foreground text-white text-[11px] font-semibold rounded-full">
                        {selectedCount}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-text-tertiary" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-tertiary" />
                    )}
                  </div>
                </button>

                {/* Expandable feature list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-1.5">
                        {cat.features.map((feature, fi) => {
                          const isOn = selections[cat.id]?.[feature.id] ?? false;
                          const featureKey = `${moduleId}:${feature.id}`;
                          const isRecommended = recommendedFeatures.has(featureKey);

                          return (
                            <motion.button
                              key={feature.id}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: fi * 0.02 }}
                              onClick={() => toggleFeature(cat.id, feature.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer text-left ${
                                isOn
                                  ? "bg-surface"
                                  : "hover:bg-surface/30"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                                  isOn
                                    ? "bg-foreground"
                                    : "border-2 border-border-light"
                                }`}
                              >
                                {isOn && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-[13px] font-medium text-foreground">
                                    {feature.label}
                                  </p>
                                  {isRecommended && isOn && (
                                    <span className="text-[10px] font-medium text-text-tertiary bg-surface px-1.5 py-0.5 rounded">
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-text-tertiary mt-0.5 leading-snug">
                                  {feature.description}
                                </p>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Continue button */}
      <div className="px-4 pb-8 pt-4 border-t border-border-light bg-background">
        <button
          onClick={handleContinue}
          className="w-full py-3.5 bg-foreground text-white rounded-full text-[15px] font-medium cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Review Summary
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
