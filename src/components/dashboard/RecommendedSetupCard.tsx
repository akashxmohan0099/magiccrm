"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X } from "lucide-react";
import { useRecommendedSetupStore } from "@/store/recommended-setup";
import { useOnboardingStore } from "@/store/onboarding";
import { FEATURE_BLOCKS } from "@/types/features";

export function RecommendedSetupCard() {
  const items = useRecommendedSetupStore((s) => s.items);
  const acceptItem = useRecommendedSetupStore((s) => s.acceptItem);
  const dismissItem = useRecommendedSetupStore((s) => s.dismissItem);
  const setFeatureSelections = useOnboardingStore((s) => s.setFeatureSelections);
  const featureSelections = useOnboardingStore((s) => s.featureSelections);

  const pendingItems = useMemo(
    () => items.filter((i) => i.status === "pending").sort((a, b) => b.priority - a.priority).slice(0, 3),
    [items],
  );

  if (pendingItems.length === 0) return null;

  const handleAccept = (item: typeof pendingItems[0]) => {
    // Enable the feature in featureSelections
    const block = FEATURE_BLOCKS.find((b) => b.id === item.moduleId);
    if (block) {
      const current = featureSelections[item.moduleId] || block.subFeatures.map((sf) => ({
        id: sf.id, label: sf.label, description: sf.description, selected: sf.defaultOn,
      }));
      const updated = current.map((f) =>
        f.id === item.featureId ? { ...f, selected: true } : f
      );
      setFeatureSelections(item.moduleId, updated);
    }
    acceptItem(item.featureId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-border-light p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Complete your setup</h3>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {pendingItems.map((item) => (
            <motion.div
              key={item.featureId}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">{item.reason}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleAccept(item)}
                  className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors cursor-pointer"
                  title="Enable"
                >
                  <Check className="w-3.5 h-3.5 text-primary" />
                </button>
                <button
                  onClick={() => dismissItem(item.featureId)}
                  className="w-7 h-7 rounded-lg bg-surface hover:bg-border-light flex items-center justify-center transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5 text-text-tertiary" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
