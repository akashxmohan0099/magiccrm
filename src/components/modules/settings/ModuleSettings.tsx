"use client";

import { useOnboardingStore } from "@/store/onboarding";
import { MODULE_REGISTRY } from "@/lib/module-registry";
import { FEATURE_BLOCKS } from "@/types/features";

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
  const { featureSelections, setFeatureSelections } = useOnboardingStore();

  const isModuleEnabled = (moduleId: string) => {
    const features = featureSelections[moduleId];
    return features && features.length > 0 && features.some((f) => f.selected);
  };

  const toggleModule = (moduleId: string) => {
    const enabled = isModuleEnabled(moduleId);
    if (enabled) {
      // Disable: set all features to not selected
      const features = featureSelections[moduleId] || [];
      setFeatureSelections(
        moduleId,
        features.map((f) => ({ ...f, selected: false }))
      );
    } else {
      // Enable: use existing features or load defaults
      const existing = featureSelections[moduleId];
      if (existing && existing.length > 0) {
        // Re-enable with default-on features
        setFeatureSelections(
          moduleId,
          existing.map((f) => {
            const block = FEATURE_BLOCKS.find((b) => b.id === moduleId);
            const sub = block?.subFeatures.find((sf) => sf.id === f.id);
            return { ...f, selected: sub?.defaultOn ?? true };
          })
        );
      } else {
        // Load defaults
        setFeatureSelections(moduleId, getDefaultFeatures(moduleId));
      }
    }
  };

  return (
    <div className="bg-card-bg border border-border-warm rounded-xl p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
        Module Settings
      </h2>
      <p className="text-sm text-text-secondary mb-5">
        Enable or disable modules to customize your CRM experience.
      </p>

      <div className="space-y-0">
        {MODULE_REGISTRY.map((mod) => {
          const enabled = isModuleEnabled(mod.id);

          return (
            <div
              key={mod.id}
              className="flex items-center justify-between py-3.5 border-b border-border-light last:border-b-0"
            >
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  {mod.name}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {mod.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleModule(mod.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ml-4 ${
                  enabled ? "bg-brand" : "bg-border-warm"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
