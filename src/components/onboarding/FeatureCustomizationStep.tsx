"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Headphones, Megaphone, FileText, MessageCircle, CreditCard,
  Zap, BarChart3, ChevronDown, Check, ArrowLeft, ArrowRight,
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

  const visibleBlocks = useMemo(() => {
    const blocks: (FeatureBlock & { autoEnabled?: boolean })[] = [];
    for (const block of FEATURE_BLOCKS) {
      if (block.alwaysShow) { blocks.push(block); continue; }
      if (block.triggeredBy && needs[block.triggeredBy]) { blocks.push(block); continue; }
      if (block.autoEnabledBy && block.autoEnabledBy.some((key) => needs[key])) {
        blocks.push({ ...block, autoEnabled: true });
      }
    }
    return blocks;
  }, [needs]);

  const getVisibleSubFeatures = useCallback(
    (block: FeatureBlock): SubFeature[] => {
      return block.subFeatures.filter((sf) => {
        if (isSolo && sf.requiresTeam) return false;
        return true;
      });
    },
    [isSolo]
  );

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
      [blockId]: { ...prev[blockId], [featureId]: !prev[blockId]?.[featureId] },
    }));
  };

  const toggleSelectAll = (block: FeatureBlock) => {
    const visibleSubs = getVisibleSubFeatures(block);
    const allSelected = visibleSubs.every((sf) => selections[block.id]?.[sf.id]);
    const newValue = !allSelected;
    setSelections((prev) => {
      const updated = { ...prev[block.id] };
      for (const sf of visibleSubs) { updated[sf.id] = newValue; }
      return { ...prev, [block.id]: updated };
    });
  };

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

  const handleGiveEverything = () => {
    for (const block of visibleBlocks) {
      const visibleSubs = getVisibleSubFeatures(block);
      const features = visibleSubs.map((sf) => ({
        id: sf.id, label: sf.label, description: sf.description, selected: true,
      }));
      setFeatureSelections(block.id, features);
    }
    nextStep();
  };

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
      className="max-w-2xl mx-auto pb-24"
    >
      <button
        onClick={prevStep}
        className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors cursor-pointer mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <div className="mb-8">
        <h2 className="text-[24px] font-bold text-foreground tracking-tight mb-2">
          Customize your modules
        </h2>
        <p className="text-text-secondary text-[15px]">
          Toggle individual features within each module. Defaults are pre-selected based on your industry.
        </p>
      </div>

      {/* Skip customization shortcut */}
      <button
        onClick={handleGiveEverything}
        className="w-full mb-5 px-4 py-3 rounded-xl border border-border-light bg-card-bg hover:bg-surface transition-all cursor-pointer flex items-center justify-center gap-2 text-[13px] font-medium text-text-secondary hover:text-foreground"
      >
        Select all features and continue
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      <div className="space-y-2">
        {visibleBlocks.map((block, blockIdx) => {
          const IconComp = ICON_MAP[block.icon];
          const isOpen = !collapsed[block.id];
          const visibleSubs = getVisibleSubFeatures(block);
          const selectedInBlock = visibleSubs.filter((sf) => selections[block.id]?.[sf.id]).length;
          const allSelected = selectedInBlock === visibleSubs.length;
          const isAutoEnabled = "autoEnabled" in block && block.autoEnabled;

          return (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: blockIdx * 0.03 }}
              className="bg-card-bg border border-border-light rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleCollapse(block.id)}
                className="w-full px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-surface/50 transition-colors"
              >
                <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                  {IconComp ? <IconComp className="w-4 h-4 text-foreground" /> : <Zap className="w-4 h-4 text-foreground" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground tracking-tight text-[14px]">{block.name}</h3>
                    {isAutoEnabled && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface text-text-secondary">Auto-added</span>
                    )}
                    {block.alwaysShow && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface text-text-secondary">Included</span>
                    )}
                  </div>
                  <p className="text-[12px] text-text-tertiary mt-0.5">{block.description}</p>
                </div>
                <span className="text-[12px] text-text-secondary font-medium mr-2 tabular-nums">
                  {selectedInBlock}/{visibleSubs.length}
                </span>
                <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-1 space-y-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelectAll(block); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface transition-colors cursor-pointer text-left mb-1"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                          allSelected ? "bg-foreground border-foreground" : "border-border-light bg-card-bg"
                        }`}>
                          {allSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="text-[12px] font-semibold text-foreground">Select all</span>
                      </button>

                      {visibleSubs.map((sf) => (
                        <button
                          key={sf.id}
                          onClick={() => toggleSelection(block.id, sf.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left ${
                            selections[block.id]?.[sf.id] ? "bg-surface/60" : "hover:bg-surface/40"
                          }`}
                        >
                          <div className={`w-[18px] h-[18px] rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                            selections[block.id]?.[sf.id] ? "bg-foreground border-foreground" : "border-border-light bg-card-bg"
                          }`}>
                            {selections[block.id]?.[sf.id] && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-medium tracking-tight ${
                              selections[block.id]?.[sf.id] ? "text-foreground" : "text-foreground/70"
                            }`}>{sf.label}</p>
                            <p className="text-[11px] text-text-tertiary truncate">{sf.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8">
        <Button size="lg" onClick={persistAndAdvance} className="w-full">
          Review my platform <ArrowRight className="w-5 h-5" />
        </Button>
        <p className="text-center text-[12px] text-text-tertiary mt-3">
          {totalSelected} features selected across {visibleBlocks.length} modules
        </p>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border-light bg-background/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground">
              {totalSelected} features selected
            </span>
            <span className="text-[12px] text-text-secondary">
              across {visibleBlocks.length} modules
            </span>
          </div>
          <Button size="sm" onClick={persistAndAdvance} className="flex items-center gap-2">
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
