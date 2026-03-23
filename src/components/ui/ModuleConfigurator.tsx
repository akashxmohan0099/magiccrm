"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, SlidersHorizontal, Puzzle, ArrowRight, Search, Link2, Copy } from "lucide-react";
import { FEATURE_BLOCKS, ADDON_FEATURE_BLOCKS } from "@/types/features";
import { useOnboardingStore } from "@/store/onboarding";
import { useAddonsStore } from "@/store/addons";
import { useEnabledModules } from "@/hooks/useFeature";
import { getFeatureOverrides, getRelatedFeatures, RelatedFeature } from "@/lib/feature-dedup";
import { toast } from "@/components/ui/Toast";

interface ModuleConfiguratorProps {
  moduleId: string;
  moduleName: string;
}

export function ModuleConfigurator({ moduleId, moduleName }: ModuleConfiguratorProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const featureSelections = useOnboardingStore((s) => s.featureSelections);
  const setFeatureSelectionsForModule = useOnboardingStore((s) => s.setFeatureSelections);

  useEffect(() => { queueMicrotask(() => setMounted(true)); }, []);

  // Find the feature block for this module (core or addon)
  const coreBlock = FEATURE_BLOCKS.find((b) => b.id === moduleId);
  const addonBlock = ADDON_FEATURE_BLOCKS.find((b) => b.id === moduleId);
  const block = coreBlock || null;
  const addonSubs = addonBlock?.subFeatures || [];

  // Get current selections
  const currentFeatures = featureSelections[moduleId] || [];

  const isFeatureEnabled = (featureId: string): boolean => {
    const feature = currentFeatures.find((f) => f.id === featureId);
    return feature?.selected ?? false;
  };

  const toggleFeature = (featureId: string, label: string, description: string) => {
    const existing = currentFeatures.find((f) => f.id === featureId);
    let updated;
    if (existing) {
      updated = currentFeatures.map((f) =>
        f.id === featureId ? { ...f, selected: !f.selected } : f
      );
    } else {
      updated = [...currentFeatures, { id: featureId, label, description, selected: true }];
    }
    setFeatureSelectionsForModule(moduleId, updated);
  };

  // Feature dedup: check which features should be deferred to another module
  const enabledModules = useEnabledModules();
  const enabledAddons = useAddonsStore((s) => s.enabledAddons);
  const overrides = getFeatureOverrides(
    enabledModules.map((m) => m.id),
    enabledAddons
  );

  const isOverridden = (featureId: string): string | null => {
    const key = `${moduleId}:${featureId}`;
    return overrides[key]?.reason ?? null;
  };

  const getManagedBy = (featureId: string): string | null => {
    const key = `${moduleId}:${featureId}`;
    return overrides[key]?.managedBy ?? null;
  };

  // Related features from other modules
  const relatedFeatures = getRelatedFeatures(moduleId, enabledModules.map((m) => m.id));
  const [mirroredIds, setMirroredIds] = useState<Set<string>>(new Set());

  const mirrorFeature = (related: RelatedFeature) => {
    if (related.canMirror) {
      setMirroredIds((prev) => new Set(prev).add(related.featureId));
      toast(`"${related.featureLabel}" is now accessible from ${moduleName} too`);
    }
  };

  const hasSubFeatures = (block && block.subFeatures.length > 0) || addonSubs.length > 0;
  const hasRelated = relatedFeatures.length > 0;
  if (!hasSubFeatures && !hasRelated) return null;

  const allSubs = block ? block.subFeatures : [];
  const activeSubs = [...allSubs, ...addonSubs].filter((s) => !isOverridden(s.id));
  const enabledCount = activeSubs.filter((s) => isFeatureEnabled(s.id)).length;
  const totalCount = activeSubs.length;

  const panel = open && mounted ? createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="absolute top-0 right-0 w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-[16px] font-bold text-foreground">Customize {moduleName}</h2>
            <p className="text-[12px] text-text-tertiary mt-0.5">{enabledCount} of {totalCount} features enabled</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Core features — always on */}
          {block && block.coreFeatures.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                Always included
              </p>
              <div className="space-y-2">
                {block.coreFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface/50">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">{feature.label}</p>
                      <p className="text-[11px] text-text-tertiary">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toggleable sub-features */}
          {allSubs.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                Features
              </p>
              <div className="space-y-2">
                {allSubs.map((feature) => {
                  const overrideReason = isOverridden(feature.id);
                  const managedBy = getManagedBy(feature.id);

                  // Feature is managed by another module — show as deferred
                  if (overrideReason) {
                    return (
                      <div key={feature.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface/30 border border-border-light/50 opacity-60">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-text-secondary">{feature.label}</p>
                          <p className="text-[10px] text-text-tertiary flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> {overrideReason}
                          </p>
                        </div>
                        <span className="text-[10px] text-text-tertiary font-medium flex-shrink-0">{managedBy}</span>
                      </div>
                    );
                  }

                  const enabled = isFeatureEnabled(feature.id);
                  return (
                    <label
                      key={feature.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                        enabled ? "bg-primary/5 border-primary/20" : "bg-card-bg border-border-light hover:border-foreground/15"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground">{feature.label}</p>
                        <p className="text-[11px] text-text-tertiary">{feature.description}</p>
                      </div>
                      <div
                        onClick={(e) => { e.preventDefault(); toggleFeature(feature.id, feature.label, feature.description); }}
                        className={`w-10 h-[22px] rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 cursor-pointer ${
                          enabled ? "bg-primary justify-end" : "bg-gray-200 justify-start"
                        }`}
                      >
                        <div className="w-[18px] h-[18px] bg-white rounded-full shadow-sm" />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Addon sub-features */}
          {addonSubs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Puzzle className="w-3.5 h-3.5 text-text-tertiary" />
                <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                  Add-on features
                </p>
              </div>
              <div className="space-y-2">
                {addonSubs.map((feature) => {
                  const overrideReason = isOverridden(feature.id);
                  const managedBy = getManagedBy(feature.id);

                  if (overrideReason) {
                    return (
                      <div key={feature.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface/30 border border-border-light/50 opacity-60">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-text-secondary">{feature.label}</p>
                          <p className="text-[10px] text-text-tertiary flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> {overrideReason}
                          </p>
                        </div>
                        <span className="text-[10px] text-text-tertiary font-medium flex-shrink-0">{managedBy}</span>
                      </div>
                    );
                  }

                  const enabled = isFeatureEnabled(feature.id);
                  return (
                    <label
                      key={feature.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                        enabled ? "bg-primary/5 border-primary/20" : "bg-card-bg border-border-light hover:border-foreground/15"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground">{feature.label}</p>
                        <p className="text-[11px] text-text-tertiary">{feature.description}</p>
                      </div>
                      <div
                        onClick={(e) => { e.preventDefault(); toggleFeature(feature.id, feature.label, feature.description); }}
                        className={`w-10 h-[22px] rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 cursor-pointer ${
                          enabled ? "bg-primary justify-end" : "bg-gray-200 justify-start"
                        }`}
                      >
                        <div className="w-[18px] h-[18px] bg-white rounded-full shadow-sm" />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Related features from other modules */}
          {relatedFeatures.length > 0 && (
            <div className="mt-2 pt-4 border-t border-border-light">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-3.5 h-3.5 text-text-tertiary" />
                <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                  Features you might look for
                </p>
              </div>
              <div className="space-y-2">
                {relatedFeatures.map((related) => {
                  const isMirrored = mirroredIds.has(related.featureId);

                  return (
                    <div
                      key={`${related.livesIn}:${related.featureId}`}
                      className={`px-3 py-2.5 rounded-xl border transition-all ${
                        isMirrored
                          ? "bg-primary/5 border-primary/20"
                          : "bg-surface/30 border-border-light/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground">{related.featureLabel}</p>
                          <p className="text-[11px] text-text-tertiary">{related.description}</p>
                          <p className="text-[10px] text-text-tertiary mt-1 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            Lives in <span className="font-medium text-text-secondary">{related.livesInLabel}</span>
                          </p>
                        </div>
                      </div>
                      {!isMirrored && (
                        <div className="flex gap-2 mt-2">
                          {related.canMirror && (
                            <button
                              onClick={() => mirrorFeature(related)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-card-bg border border-border-light rounded-lg text-[11px] font-medium text-foreground hover:border-primary/30 cursor-pointer transition-colors"
                            >
                              <Copy className="w-3 h-3" /> Show here too
                            </button>
                          )}
                          <button
                            onClick={() => toast(`Open ${related.livesInLabel} and enable "${related.featureLabel}" from there`, "info")}
                            className="flex items-center gap-1 px-2.5 py-1 bg-card-bg border border-border-light rounded-lg text-[11px] font-medium text-text-secondary hover:text-foreground cursor-pointer transition-colors"
                          >
                            <Link2 className="w-3 h-3" /> Go to {related.livesInLabel}
                          </button>
                        </div>
                      )}
                      {isMirrored && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-primary" />
                          <span className="text-[11px] text-primary font-medium">Connected — visible in both {moduleName} and {related.livesInLabel}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-text-secondary hover:text-foreground bg-surface border border-border-light rounded-xl hover:border-foreground/20 transition-all cursor-pointer"
        title={`Customize ${moduleName}`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Customize</span>
        {enabledCount > 0 && (
          <span className="ml-0.5 text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full leading-none">
            {enabledCount}/{totalCount}
          </span>
        )}
      </button>
      {panel}
    </>
  );
}
