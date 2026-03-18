"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Headphones, Megaphone, FileText, MessageCircle, CreditCard,
  Zap, BarChart3, ChevronDown, Check, ArrowLeft, ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";
import {
  FEATURE_BLOCKS,
  FeatureBlock,
  SubFeature,
} from "@/types/features";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Headphones, Megaphone, FileText, MessageCircle, CreditCard,
  Zap, BarChart3,
};

type Selections = Record<string, Record<string, boolean>>;

export function FeatureCustomizationStep() {
  const { needs, teamSize, prevStep, nextStep, setFeatureSelections } =
    useOnboardingStore();
  const isSolo = teamSize === "Just me";

  // ── Determine which blocks are visible ─────────────────────
  const visibleBlocks = useMemo(() => {
    const blocks: (FeatureBlock & { autoEnabled?: boolean })[] = [];

    for (const block of FEATURE_BLOCKS) {
      // Always-show blocks
      if (block.alwaysShow) {
        blocks.push(block);
        continue;
      }

      // Directly triggered by a Screen 2 yes
      if (block.triggeredBy && needs[block.triggeredBy]) {
        blocks.push(block);
        continue;
      }

      // Auto-enabled by dependency
      if (
        block.autoEnabledBy &&
        block.autoEnabledBy.some((key) => needs[key])
      ) {
        blocks.push({ ...block, autoEnabled: true });
      }
    }

    return blocks;
  }, [needs]);

  // ── Filter sub-features (hide team-related if solo) ────────
  const getVisibleSubFeatures = useCallback(
    (block: FeatureBlock): SubFeature[] => {
      return block.subFeatures.filter((sf) => {
        if (isSolo && sf.requiresTeam) return false;
        return true;
      });
    },
    [isSolo]
  );

  // ── Selections state ──────────────────────────────────────
  const [selections, setSelections] = useState<Selections>(() => {
    const initial: Selections = {};
    for (const block of FEATURE_BLOCKS) {
      initial[block.id] = {};
      for (const sf of block.subFeatures) {
        initial[block.id][sf.id] = sf.defaultOn;
      }
    }
    return initial;
  });

  // ── Collapsed state ───────────────────────────────────────
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const c: Record<string, boolean> = {};
    for (const block of FEATURE_BLOCKS) {
      c[block.id] = false;
    }
    return c;
  });

  const toggleCollapse = (blockId: string) => {
    setCollapsed((prev) => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  const toggleSelection = (blockId: string, featureId: string) => {
    setSelections((prev) => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        [featureId]: !prev[blockId]?.[featureId],
      },
    }));
  };

  const toggleSelectAll = (block: FeatureBlock) => {
    const visibleSubs = getVisibleSubFeatures(block);
    const allSelected = visibleSubs.every((sf) => selections[block.id]?.[sf.id]);
    const newValue = !allSelected;
    setSelections((prev) => {
      const updated = { ...prev[block.id] };
      for (const sf of visibleSubs) {
        updated[sf.id] = newValue;
      }
      return { ...prev, [block.id]: updated };
    });
  };

  // ── Persist selections to store ────────────────────────────
  const persistAndAdvance = () => {
    for (const block of visibleBlocks) {
      const features = getVisibleSubFeatures(block).map((sf) => ({
        id: sf.id,
        label: sf.label,
        description: sf.description,
        selected: selections[block.id]?.[sf.id] ?? sf.defaultOn,
      }));
      setFeatureSelections(block.id, features);
    }
    nextStep();
  };

  // ── "Give me everything" ───────────────────────────────────
  const handleGiveEverything = () => {
    for (const block of visibleBlocks) {
      const visibleSubs = getVisibleSubFeatures(block);
      const features = visibleSubs.map((sf) => ({
        id: sf.id,
        label: sf.label,
        description: sf.description,
        selected: true,
      }));
      setFeatureSelections(block.id, features);
    }
    nextStep();
  };

  // ── Count selected features ────────────────────────────────
  const totalSelected = useMemo(() => {
    let count = 0;
    for (const block of visibleBlocks) {
      const visible = getVisibleSubFeatures(block);
      for (const sf of visible) {
        if (selections[block.id]?.[sf.id]) count++;
      }
    }
    return count;
  }, [visibleBlocks, selections, getVisibleSubFeatures]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
          Customize your platform
        </h2>
        <p className="text-text-secondary">
          Toggle the features you want in each module. We&apos;ll assemble everything into your custom platform.
        </p>
      </div>

      {/* "Give me everything" shortcut */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleGiveEverything}
        className="w-full mb-5 px-4 py-3 rounded-xl border-2 border-dashed border-brand/30 bg-brand-light/40 hover:bg-brand-light hover:border-brand/50 transition-all cursor-pointer flex items-center justify-center gap-2 group"
      >
        <Sparkles className="w-4 h-4 text-brand group-hover:scale-110 transition-transform" />
        <span className="text-sm font-semibold text-brand">
          Give me everything
        </span>
      </motion.button>

      <div className="space-y-3">
        {visibleBlocks.map((block, blockIdx) => {
          const IconComp = ICON_MAP[block.icon];
          const isOpen = !collapsed[block.id];
          const visibleSubs = getVisibleSubFeatures(block);
          const selectedInBlock = visibleSubs.filter(
            (sf) => selections[block.id]?.[sf.id]
          ).length;
          const allSelected = selectedInBlock === visibleSubs.length;

          const isAutoEnabled = "autoEnabled" in block && block.autoEnabled;

          return (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: blockIdx * 0.04 }}
              className="bg-card-bg border border-border-warm rounded-xl overflow-hidden"
            >
              {/* Block header */}
              <button
                onClick={() => toggleCollapse(block.id)}
                className="w-full px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-surface/50 transition-colors"
              >
                <div className="p-2 bg-brand-light rounded-lg flex-shrink-0">
                  {IconComp ? (
                    <IconComp className="w-4 h-4 text-brand" />
                  ) : (
                    <Zap className="w-4 h-4 text-brand" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground tracking-tight text-sm">
                      {block.name}
                    </h3>
                    {isAutoEnabled && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-light text-brand">
                        Auto-added
                      </span>
                    )}
                    {block.alwaysShow && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface text-text-secondary">
                        Always included
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {block.description}
                  </p>
                </div>
                <span className="text-xs text-text-secondary font-medium mr-2">
                  {selectedInBlock}/{visibleSubs.length}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Sub-features */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-1 space-y-1">
                      {/* Select all toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectAll(block);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface transition-colors cursor-pointer text-left mb-1"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                            allSelected
                              ? "bg-brand border-brand"
                              : "border-border-warm bg-card-bg"
                          }`}
                        >
                          {allSelected && (
                            <Check className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-brand">
                          Select all
                        </span>
                      </button>

                      {visibleSubs.map((sf) => (
                        <FeatureToggleRow
                          key={sf.id}
                          label={sf.label}
                          description={sf.description}
                          enabled={selections[block.id]?.[sf.id] ?? false}
                          onToggle={() => toggleSelection(block.id, sf.id)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="mt-8 flex items-center gap-3">
        <Button variant="ghost" onClick={prevStep}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button size="lg" onClick={persistAndAdvance} className="flex-1">
          Review My Platform <ArrowRight className="w-5 h-5" />
        </Button>
      </div>

      <p className="text-center text-xs text-text-secondary mt-3">
        {totalSelected} features selected across {visibleBlocks.length} modules
      </p>
    </motion.div>
  );
}

// ── Sub-component: individual feature toggle row ─────────────

function FeatureToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left ${
        enabled ? "bg-brand-light/60" : "hover:bg-surface"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
          enabled
            ? "bg-brand border-brand"
            : "border-border-warm bg-card-bg"
        }`}
      >
        {enabled && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium tracking-tight ${
            enabled ? "text-foreground" : "text-foreground/80"
          }`}
        >
          {label}
        </p>
        <p className="text-xs text-text-secondary truncate">{description}</p>
      </div>
    </button>
  );
}
