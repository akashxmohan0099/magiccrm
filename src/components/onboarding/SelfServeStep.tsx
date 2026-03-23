"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Inbox, Calendar, Receipt, FolderKanban, Megaphone,
  MessageCircle, Headphones, FileText, Check, ArrowLeft,
  ArrowRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import {
  FEATURE_CATEGORIES,
  FeatureDetail,
  NeedsAssessment,
  INDUSTRY_CONFIGS,
} from "@/types/onboarding";
import { FEATURE_BLOCKS } from "@/types/features";
import { getPersonaQuestions } from "@/lib/persona-questions";
import { getAddonModules } from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Megaphone, MessageCircle, Headphones, FileText,
};

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

// Need key to module ID
const NEED_TO_MODULE: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_TO_NEED).map(([mod, need]) => [need, mod])
);

/**
 * Step 4 (self-serve path): Manual Module Picker
 *
 * Shows all modules as toggle cards with expandable sub-feature lists.
 * Pre-selects modules based on industry smart defaults.
 * Filters hidden modules/features based on persona visibility config.
 */
export function SelfServeStep() {
  const {
    selectedPersona,
    selectedIndustry,
    setFeatureSelections,
    setNeed,
    nextStep,
    prevStep,
  } = useOnboardingStore();

  // Get persona question config for visibility filtering
  const personaConfig = useMemo(() => {
    if (selectedPersona) {
      return getPersonaQuestions(selectedPersona);
    }
    return null;
  }, [selectedPersona]);

  // Get industry config for smart defaults
  const industryConfig = useMemo(() => {
    return INDUSTRY_CONFIGS.find((c) => c.id === selectedIndustry);
  }, [selectedIndustry]);

  // Compute smart defaults for this persona (industry defaults + persona overrides)
  const smartDefaults = useMemo(() => {
    if (!industryConfig) return {} as Partial<Record<keyof NeedsAssessment, boolean>>;
    const base = { ...industryConfig.smartDefaults };
    // Apply persona-specific overrides if available
    if (selectedPersona && industryConfig.personas) {
      const persona = industryConfig.personas.find((p) => p.id === selectedPersona);
      if (persona?.smartDefaultOverrides) {
        Object.assign(base, persona.smartDefaultOverrides);
      }
    }
    return base;
  }, [industryConfig, selectedPersona]);

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
  }, [personaConfig]);

  // Build auto-enable rules from FEATURE_BLOCKS
  // Maps: needKey -> list of needKeys that should auto-enable this block
  const autoEnableRules = useMemo(() => {
    const rules: Record<string, (keyof NeedsAssessment)[]> = {};
    for (const block of FEATURE_BLOCKS) {
      if (block.autoEnabledBy) {
        const needKey = MODULE_TO_NEED[block.id];
        if (needKey) {
          rules[needKey] = block.autoEnabledBy;
        }
      }
    }
    return rules;
  }, []);

  // Module toggle state: which modules are ON
  const [moduleToggles, setModuleToggles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const cat of visibleCategories) {
      // Check if smart defaults say this module should be on
      const needKey = cat.id as keyof NeedsAssessment;
      initial[cat.id] = smartDefaults[needKey] === true;
    }
    return initial;
  });

  // Feature selections within each module
  const [featureToggles, setFeatureToggles] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    for (const cat of visibleCategories) {
      initial[cat.id] = {};
      const needKey = cat.id as keyof NeedsAssessment;
      const isModuleOn = smartDefaults[needKey] === true;
      for (const feature of cat.features) {
        // Pre-select features with `selected: true` or `defaultOn: true` when module is on
        initial[cat.id][feature.id] = isModuleOn && feature.selected;
      }
    }
    return initial;
  });

  // Track expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (catId: string) => {
    // Only expand if module is on
    if (!moduleToggles[catId]) return;
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // When a module is toggled on, initialize its features and check auto-enable rules
  const toggleModule = useCallback((catId: string) => {
    setModuleToggles((prev) => {
      const newState = !prev[catId];
      const next = { ...prev, [catId]: newState };

      if (newState) {
        // Initialize features for the toggled-on module with default selected values
        setFeatureToggles((prevFeat) => {
          const cat = visibleCategories.find((c) => c.id === catId);
          if (!cat) return prevFeat;
          const featState: Record<string, boolean> = {};
          for (const feature of cat.features) {
            // Preserve existing selections if any, otherwise use the default
            featState[feature.id] = prevFeat[catId]?.[feature.id] !== undefined
              ? prevFeat[catId][feature.id]
              : feature.selected;
          }
          return { ...prevFeat, [catId]: featState };
        });

        // Auto-enable dependent modules
        // For each module that has autoEnabledBy rules, check if toggling this one on
        // satisfies any of those rules
        const toggledNeedKey = catId as keyof NeedsAssessment;
        for (const [targetNeedKey, triggers] of Object.entries(autoEnableRules)) {
          if (triggers.includes(toggledNeedKey) && !next[targetNeedKey]) {
            // Check if this category is visible
            const isVisible = visibleCategories.some((c) => c.id === targetNeedKey);
            if (isVisible) {
              next[targetNeedKey] = true;
              // Also initialize features for auto-enabled modules
              setFeatureToggles((prevFeat) => {
                const cat = visibleCategories.find((c) => c.id === targetNeedKey);
                if (!cat) return prevFeat;
                const featState: Record<string, boolean> = {};
                for (const feature of cat.features) {
                  featState[feature.id] = feature.selected;
                }
                return { ...prevFeat, [targetNeedKey]: featState };
              });
            }
          }
        }
      } else {
        // Collapse section when toggled off
        setExpandedSections((prevExp) => {
          const nextExp = new Set(prevExp);
          nextExp.delete(catId);
          return nextExp;
        });
      }

      return next;
    });
  }, [autoEnableRules, visibleCategories]);

  const toggleFeature = (catId: string, featureId: string) => {
    setFeatureToggles((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], [featureId]: !prev[catId]?.[featureId] },
    }));
  };

  const getSelectedFeatureCount = useCallback(
    (catId: string) => {
      if (!moduleToggles[catId]) return 0;
      const catSelections = featureToggles[catId] || {};
      return Object.values(catSelections).filter(Boolean).length;
    },
    [moduleToggles, featureToggles]
  );

  const enabledModuleCount = useMemo(
    () => Object.values(moduleToggles).filter(Boolean).length,
    [moduleToggles]
  );

  const handleContinue = () => {
    // Persist selections to the store
    for (const cat of visibleCategories) {
      const features: FeatureDetail[] = cat.features.map((f) => ({
        id: f.id,
        label: f.label,
        description: f.description,
        selected: moduleToggles[cat.id] ? (featureToggles[cat.id]?.[f.id] ?? false) : false,
      }));
      setFeatureSelections(cat.id, features);

      // Also write under the module registry ID so the sidebar can find it
      const moduleId = NEED_TO_MODULE[cat.id];
      if (moduleId) {
        setFeatureSelections(moduleId, features);
      }

      // Set needs assessment based on module toggle
      const needKey = cat.id as keyof NeedsAssessment;
      setNeed(needKey, moduleToggles[cat.id] ?? false);
    }

    // Auto-enable add-on modules that the persona's smart defaults imply
    // In self-serve mode there are no discovery answers, but if industry config
    // indicates certain add-ons should be on, enable them here.
    const addonModules = getAddonModules();
    const addonsStore = useAddonsStore.getState();
    // Check if any toggled-on modules are actually addon IDs (future-proofing)
    const addonIds = new Set(addonModules.map((m) => m.id));
    for (const [catId, isOn] of Object.entries(moduleToggles)) {
      const moduleId = NEED_TO_MODULE[catId] ?? catId;
      if (isOn && addonIds.has(moduleId)) {
        const addonDef = addonModules.find((m) => m.id === moduleId);
        if (addonDef && !addonsStore.isAddonEnabled(moduleId)) {
          addonsStore.enableAddon(moduleId, addonDef.name);
        }
      }
    }

    // Auto-enable defaultChannels as selected communication sub-features
    if (personaConfig?.defaultChannels && personaConfig.defaultChannels.length > 0) {
      const commCat = visibleCategories.find((c) => NEED_TO_MODULE[c.id] === "communication");
      if (commCat && moduleToggles[commCat.id]) {
        const currentFeatures: FeatureDetail[] = commCat.features.map((f) => ({
          id: f.id,
          label: f.label,
          description: f.description,
          selected: featureToggles[commCat.id]?.[f.id] ?? false,
        }));
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
            Build your workspace
          </h2>
          <p className="text-[15px] text-text-secondary leading-relaxed">
            Select the modules you need, then customize features within each.
          </p>
          <p className="text-[13px] text-text-tertiary mt-1">
            {enabledModuleCount} module{enabledModuleCount !== 1 ? "s" : ""} selected
          </p>
        </div>
      </div>

      {/* Scrollable module list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-3">
          {visibleCategories.map((cat, catIdx) => {
            const IconComp = ICON_MAP[cat.icon];
            const isOn = moduleToggles[cat.id] ?? false;
            const isExpanded = expandedSections.has(cat.id);
            const selectedCount = getSelectedFeatureCount(cat.id);

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIdx * 0.04 }}
                className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                  isOn
                    ? "border-foreground/15 bg-card-bg"
                    : "border-border-light bg-card-bg opacity-60"
                }`}
              >
                {/* Module header row */}
                <div className="flex items-center gap-3 p-4">
                  {/* Clickable body area — expands if on */}
                  <button
                    onClick={() => toggleSection(cat.id)}
                    className="flex items-center gap-3 flex-1 cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                      {IconComp && <IconComp className="w-4 h-4 text-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-semibold text-foreground tracking-tight">
                        {cat.name}
                      </h3>
                      <p className="text-[12px] text-text-tertiary">{cat.description}</p>
                    </div>
                  </button>

                  {/* Selected count badge + expand chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isOn && selectedCount > 0 && (
                      <span className="px-2 py-0.5 bg-foreground text-white text-[11px] font-semibold rounded-full">
                        {selectedCount}
                      </span>
                    )}
                    {isOn && (
                      <button
                        onClick={() => toggleSection(cat.id)}
                        className="cursor-pointer p-0.5"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-text-tertiary" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-text-tertiary" />
                        )}
                      </button>
                    )}

                    {/* Toggle switch */}
                    <button
                      onClick={() => toggleModule(cat.id)}
                      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                        isOn ? "bg-foreground" : "bg-border-light"
                      }`}
                    >
                      <motion.div
                        className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm"
                        animate={{ left: isOn ? 20 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>

                {/* Expandable feature list */}
                <AnimatePresence>
                  {isOn && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-1.5">
                        {cat.features.map((feature, fi) => {
                          const isFeatureOn = featureToggles[cat.id]?.[feature.id] ?? false;

                          return (
                            <motion.button
                              key={feature.id}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: fi * 0.02 }}
                              onClick={() => toggleFeature(cat.id, feature.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer text-left ${
                                isFeatureOn
                                  ? "bg-surface"
                                  : "hover:bg-surface/30"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                                  isFeatureOn
                                    ? "bg-foreground"
                                    : "border-2 border-border-light"
                                }`}
                              >
                                {isFeatureOn && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-foreground">
                                  {feature.label}
                                </p>
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
