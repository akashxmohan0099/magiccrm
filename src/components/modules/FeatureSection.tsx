"use client";

import { ReactNode } from "react";

interface FeatureSectionProps {
  moduleId: string;
  featureId: string;
  children: ReactNode;
  featureLabel?: string;
  /** If true, show a minimal "not enabled" message instead of hiding completely. */
  showDisabledState?: boolean;
}

/**
 * FeatureSection stub.
 * The old feature toggle system (useFeature hook, onboarding-driven feature
 * selections) was removed. All features are now always enabled.
 * This wrapper simply renders its children.
 */
export function FeatureSection({ children }: FeatureSectionProps) {
  return <>{children}</>;
}
