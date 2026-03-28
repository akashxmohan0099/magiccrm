"use client";

import { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { getCoreModules, getAddonModules } from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";
import { FEATURE_BLOCKS } from "@/types/features";
import { NeedsAssessment } from "@/types/onboarding";
import { Puzzle, ChevronDown, ChevronRight } from "lucide-react";
import { ALWAYS_ON_MODULES } from "@/lib/module-registry";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Map module registry IDs to NeedsAssessment keys
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

function getDefaultFeatures(moduleId: string) {
  const block = FEATURE_BLOCKS.find((b) => b.id === moduleId);
  if (!block) return [];
  return block.subFeatures.map((sf) => ({
    id: sf.id,
    label: sf.label,
    description: sf.description,
    selected: sf.defaultOn,
  }));
}

export function ModuleSettings() {
  const { featureSelections, setFeatureSelections, setNeed, toggleFeature, setDiscoveryAnswer } = useOnboardingStore();
  const { enabledAddons } = useAddonsStore();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const coreModules = getCoreModules();
  const addonModules = getAddonModules();

  const isModuleEnabled = (moduleId: string) => {
    const features = featureSelections[moduleId];
    return features && features.length > 0 && features.some((f) => f.selected);
  };

  const toggleModule = (moduleId: string) => {
    if (ALWAYS_ON_MODULES.has(moduleId)) return; // can't disable always-on modules

    const enabled = isModuleEnabled(moduleId);
    const needKey = MODULE_TO_NEED[moduleId];

    if (enabled) {
      const features = featureSelections[moduleId] || [];
      const disabledFeatures = features.map((f) => ({ ...f, selected: false }));
      setFeatureSelections(moduleId, disabledFeatures);
      // Write discoveryAnswer so computeEnabledModuleIds respects the disable
      setDiscoveryAnswer(`module:${moduleId}`, false);
      if (needKey) {
        setFeatureSelections(needKey, disabledFeatures);
        setNeed(needKey, false);
      }
    } else {
      let newFeatures;
      const existing = featureSelections[moduleId];
      if (existing && existing.length > 0) {
        newFeatures = existing.map((f) => {
          const block = FEATURE_BLOCKS.find((b) => b.id === moduleId);
          const sub = block?.subFeatures.find((sf) => sf.id === f.id);
          return { ...f, selected: sub?.defaultOn ?? true };
        });
      } else {
        newFeatures = getDefaultFeatures(moduleId);
      }
      setFeatureSelections(moduleId, newFeatures);
      // Re-enable in discoveryAnswers
      setDiscoveryAnswer(`module:${moduleId}`, true);
      if (needKey) {
        setFeatureSelections(needKey, newFeatures);
        setNeed(needKey, true);
      }
    }
  };

  // Wrapper around toggleFeature that also syncs the need key and needs store
  const handleToggleFeature = (moduleId: string, featureId: string) => {
    toggleFeature(moduleId, featureId);
    // After toggling, sync needs and dual-write under the need key
    const needKey = MODULE_TO_NEED[moduleId];
    if (needKey) {
      // Re-read features after the toggle (store is sync, so read current state)
      const store = useOnboardingStore.getState();
      const updatedFeatures = store.featureSelections[moduleId] || [];
      const hasAnySelected = updatedFeatures.some((f) => f.selected);
      setFeatureSelections(needKey, updatedFeatures);
      setNeed(needKey, hasAnySelected);
    }
  };

  const enabledAddonCount = addonModules.filter((a) => enabledAddons.includes(a.id)).length;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Core Modules */}
      <div className="bg-card-bg border border-border-light rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">
          Core Modules
        </h2>
        <p className="text-sm text-text-secondary mb-5">
          The building blocks of your workspace. Enable what you need.
        </p>

        <div className="space-y-0">
          {coreModules.map((mod) => {
            const enabled = isModuleEnabled(mod.id);
            const isExpanded = expandedModule === mod.id;
            const features = featureSelections[mod.id] || [];
            const enabledFeatureCount = features.filter((f) => f.selected).length;

            return (
              <div key={mod.id} className="border-b border-border-light last:border-b-0">
                <div className="flex items-center justify-between py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">
                        {mod.name}
                      </h3>
                      {enabled && features.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                          className="text-[11px] text-primary hover:text-primary-hover font-medium flex items-center gap-0.5 cursor-pointer"
                        >
                          {enabledFeatureCount}/{features.length} features
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {mod.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ml-4 ${
                      enabled ? "bg-brand" : "bg-border-light"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-card-bg transition-transform ${
                        enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <AnimatePresence>
                  {isExpanded && enabled && features.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-4 pl-2 space-y-1">
                        {features.map((feature) => (
                          <div
                            key={feature.id}
                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface transition-colors"
                          >
                            <div className="min-w-0">
                              <p className={`text-[13px] font-medium ${feature.selected ? "text-foreground" : "text-text-tertiary"}`}>
                                {feature.label}
                              </p>
                              {feature.description && (
                                <p className="text-[11px] text-text-tertiary mt-0.5">{feature.description}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleFeature(mod.id, feature.id)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0 ml-3 ${
                                feature.selected ? "bg-primary" : "bg-border-light"
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-card-bg transition-transform ${
                                  feature.selected ? "translate-x-4" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add-ons — link to add-ons page */}
      <div className="bg-card-bg border border-border-light rounded-xl p-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              Add-ons
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {enabledAddonCount} of {addonModules.length} add-ons enabled. Manage them from the Add-ons page.
            </p>
          </div>
          <Link
            href="/dashboard/addons"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-foreground bg-surface border border-border-light rounded-xl hover:border-foreground/20 transition-all"
          >
            <Puzzle className="w-3.5 h-3.5" /> Manage
          </Link>
        </div>

        <div className="mt-4 space-y-0">
          {addonModules.map((addon) => {
            const isEnabled = enabledAddons.includes(addon.id);

            return (
              <div
                key={addon.id}
                className="flex items-center justify-between py-3 border-b border-border-light last:border-b-0"
              >
                <div>
                  <h3 className={`text-sm font-medium ${isEnabled ? "text-foreground" : "text-text-tertiary"}`}>
                    {addon.name}
                  </h3>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {addon.description}
                  </p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-4 ${
                  isEnabled
                    ? "bg-primary/10 text-primary"
                    : "bg-surface text-text-tertiary"
                }`}>
                  {isEnabled ? "Active" : "Off"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
