"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Headphones, Megaphone, FileText, MessageCircle, CreditCard,
  Zap, BarChart3, Check, ArrowLeft, ArrowRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";
import { FEATURE_BLOCKS, FeatureBlock, SubFeature } from "@/types/features";

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

  // ── Visible modules based on needs ──
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
    (block: FeatureBlock): SubFeature[] =>
      block.subFeatures.filter((sf) => !(isSolo && sf.requiresTeam)),
    [isSolo]
  );

  // ── Selections state ──
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

  // ── Module-by-module navigation ──
  const [moduleIndex, setModuleIndex] = useState(-1); // -1 = intro
  const [direction, setDirection] = useState(1);

  const toggleSelection = (blockId: string, featureId: string) => {
    setSelections((prev) => ({
      ...prev,
      [blockId]: { ...prev[blockId], [featureId]: !prev[blockId]?.[featureId] },
    }));
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

  const handleSelectAll = () => {
    for (const block of visibleBlocks) {
      const visibleSubs = getVisibleSubFeatures(block);
      const features = visibleSubs.map((sf) => ({
        id: sf.id, label: sf.label, description: sf.description, selected: true,
      }));
      setFeatureSelections(block.id, features);
    }
    nextStep();
  };

  const handleNext = () => {
    setDirection(1);
    if (moduleIndex < visibleBlocks.length - 1) {
      setModuleIndex((prev) => prev + 1);
    } else {
      persistAndAdvance();
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (moduleIndex <= -1) {
      prevStep();
    } else if (moduleIndex === 0) {
      setModuleIndex(-1);
    } else {
      setModuleIndex((prev) => prev - 1);
    }
  };

  const totalSelected = useMemo(() => {
    let count = 0;
    for (const block of visibleBlocks) {
      for (const sf of getVisibleSubFeatures(block)) {
        if (selections[block.id]?.[sf.id]) count++;
      }
    }
    return count;
  }, [visibleBlocks, selections, getVisibleSubFeatures]);

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  // ── Intro screen ──
  if (moduleIndex === -1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        <button
          onClick={() => prevStep()}
          className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors cursor-pointer mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="text-center mb-10">
          <h2 className="text-[24px] font-bold text-foreground tracking-tight mb-3">
            Let&apos;s fine-tune your setup
          </h2>
          <p className="text-text-secondary text-[15px]">
            We&apos;ve selected {visibleBlocks.length} modules based on your answers.
            Now pick the specific features you want in each one.
          </p>
        </div>

        {/* Module preview chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {visibleBlocks.map((block, i) => {
            const IconComp = ICON_MAP[block.icon];
            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="flex items-center gap-2 px-3 py-2 bg-card-bg border border-border-light rounded-lg"
              >
                {IconComp && <IconComp className="w-3.5 h-3.5 text-text-secondary" />}
                <span className="text-[12px] font-medium text-foreground">{block.name}</span>
              </motion.div>
            );
          })}
        </div>

        <div className="space-y-3">
          <Button size="lg" onClick={() => { setDirection(1); setModuleIndex(0); }} className="w-full">
            Customize features <ArrowRight className="w-5 h-5" />
          </Button>
          <button
            onClick={handleSelectAll}
            className="w-full px-4 py-3 rounded-xl border border-border-light bg-card-bg hover:bg-surface transition-all cursor-pointer flex items-center justify-center gap-2 text-[13px] font-medium text-text-secondary hover:text-foreground"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Give me everything
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Module feature screen ──
  const currentBlock = visibleBlocks[moduleIndex];
  const IconComp = ICON_MAP[currentBlock.icon] || Zap;
  const visibleSubs = getVisibleSubFeatures(currentBlock);
  const selectedInBlock = visibleSubs.filter((sf) => selections[currentBlock.id]?.[sf.id]).length;
  const progress = ((moduleIndex + 1) / visibleBlocks.length) * 100;
  const isLast = moduleIndex === visibleBlocks.length - 1;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-text-secondary">
            Module {moduleIndex + 1} of {visibleBlocks.length}
          </span>
          <span className="text-[12px] font-semibold text-foreground">
            {totalSelected} features selected
          </span>
        </div>
        <div className="w-full h-1 bg-border-light rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        {/* Dots */}
        <div className="flex items-center gap-1.5 mt-3 justify-center">
          {visibleBlocks.map((block, i) => (
            <button
              key={block.id}
              onClick={() => { setDirection(i > moduleIndex ? 1 : -1); setModuleIndex(i); }}
              className={`transition-all cursor-pointer rounded-full ${
                i === moduleIndex
                  ? "w-6 h-1.5 bg-primary"
                  : i < moduleIndex
                  ? "w-1.5 h-1.5 bg-primary/40"
                  : "w-1.5 h-1.5 bg-border-light"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Module card with AnimatePresence */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={moduleIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
        >
          {/* Module header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 250, damping: 18 }}
              className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <IconComp className="w-7 h-7 text-foreground" />
            </motion.div>
            <h2 className="text-[20px] font-bold text-foreground tracking-tight mb-1">
              {currentBlock.name}
            </h2>
            <p className="text-[13px] text-text-secondary">
              {currentBlock.description}
            </p>
          </div>

          {/* Feature toggles */}
          <div className="space-y-2">
            {visibleSubs.map((sf, i) => {
              const isOn = selections[currentBlock.id]?.[sf.id] ?? false;
              return (
                <motion.button
                  key={sf.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.03 }}
                  onClick={() => toggleSelection(currentBlock.id, sf.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all cursor-pointer text-left ${
                    isOn
                      ? "bg-primary text-white shadow-sm"
                      : "bg-card-bg border border-border-light hover:border-primary/20"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                    isOn
                      ? "bg-white/20"
                      : "border border-border-light"
                  }`}>
                    {isOn && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] font-medium tracking-tight ${
                      isOn ? "text-white" : "text-foreground"
                    }`}>
                      {sf.label}
                    </p>
                    <p className={`text-[12px] mt-0.5 ${
                      isOn ? "text-white/60" : "text-text-tertiary"
                    }`}>
                      {sf.description}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Selected count */}
          <div className="text-center mt-4">
            <span className="text-[12px] text-text-tertiary">
              {selectedInBlock} of {visibleSubs.length} features enabled
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-foreground transition-colors cursor-pointer py-2 px-3 rounded-lg hover:bg-surface"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Button size="lg" onClick={handleNext} className="flex-1">
          {isLast ? "Review my setup" : "Next module"} <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
