"use client";

import { motion } from "framer-motion";
import {
  Users, Calendar, Receipt, Inbox, FolderKanban,
  Package, Megaphone, Headphones, FileText,
  ArrowRight, ArrowLeft, Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";
import { FeatureCategory } from "@/types/onboarding";

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Calendar, Receipt, Inbox, FolderKanban,
  Package, Megaphone, Headphones, FileText,
};

interface Props {
  category: FeatureCategory;
  categoryIndex: number;
  totalCategories: number;
}

export function FeatureDrilldownStep({ category, categoryIndex, totalCategories }: Props) {
  const { featureSelections, toggleFeature, nextStep, prevStep } =
    useOnboardingStore();

  const features = featureSelections[category.id] || category.features;
  const selectedCount = features.filter((f) => f.selected).length;
  const IconComponent = ICON_COMPONENTS[category.icon];

  return (
    <motion.div
      key={category.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="max-w-xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-surface rounded-lg">
          {IconComponent && <IconComponent className="w-5 h-5 text-foreground" />}
        </div>
        <div>
          <p className="text-xs text-foreground font-medium">
            Feature {categoryIndex + 1} of {totalCategories}
          </p>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">{category.name}</h2>
        </div>
      </div>
      <p className="text-text-secondary mb-6">{category.description}. Pick the specific features you want.</p>

      <div className="space-y-2">
        {features.map((feature, i) => (
          <motion.button
            key={feature.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => toggleFeature(category.id, feature.id)}
            className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 cursor-pointer ${
              feature.selected
                ? "border-brand bg-surface"
                : "border-border-light bg-card-bg hover:border-[#D4CDB8]"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                feature.selected
                  ? "bg-brand border-brand"
                  : "border-border-light"
              }`}
            >
              {feature.selected && <Check className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1">
              <p className={`font-medium tracking-tight ${feature.selected ? "text-foreground" : "text-foreground"}`}>
                {feature.label}
              </p>
              <p className="text-sm text-text-secondary">{feature.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-between items-center mt-8">
        <Button variant="ghost" onClick={prevStep}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">
            {selectedCount} of {features.length} selected
          </span>
          <Button onClick={nextStep}>
            {categoryIndex < totalCategories - 1 ? "Next Category" : "Review Summary"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
