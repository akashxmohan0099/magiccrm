"use client";

import { ReactNode } from "react";
import { useFeature } from "@/hooks/useFeature";

interface FeatureSectionProps {
  moduleId: string;
  featureId: string;
  children: ReactNode;
  featureLabel?: string;
  /** If true, show a minimal "not enabled" message instead of hiding completely. Use for tab-level content only. */
  showDisabledState?: boolean;
}

export function FeatureSection({ moduleId, featureId, children, featureLabel, showDisabledState }: FeatureSectionProps) {
  const enabled = useFeature(moduleId, featureId);

  if (!enabled) {
    if (showDisabledState) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-text-tertiary">
            {featureLabel || "This feature"} is available — enable it from <span className="font-medium text-text-secondary">Customize</span> in the top bar.
          </p>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
