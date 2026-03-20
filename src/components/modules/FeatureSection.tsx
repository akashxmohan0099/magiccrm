"use client";

import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useFeature } from "@/hooks/useFeature";

interface FeatureSectionProps {
  moduleId: string;
  featureId: string;
  children: ReactNode;
  featureLabel?: string;
}

export function FeatureSection({ moduleId, featureId, children, featureLabel }: FeatureSectionProps) {
  const enabled = useFeature(moduleId, featureId);

  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center mb-4 text-text-tertiary">
          <Lock className="w-5 h-5" />
        </div>
        <h3 className="text-[15px] font-semibold text-foreground mb-1">
          {featureLabel || "This feature"} is not enabled
        </h3>
        <p className="text-[13px] text-text-secondary max-w-xs">
          Enable it from the <span className="font-medium">Customize</span> button in the top bar to start using it.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
