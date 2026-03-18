"use client";

import { ReactNode } from "react";
import { useFeature } from "@/hooks/useFeature";

interface FeatureSectionProps {
  moduleId: string;
  featureId: string;
  children: ReactNode;
}

export function FeatureSection({ moduleId, featureId, children }: FeatureSectionProps) {
  const enabled = useFeature(moduleId, featureId);
  if (!enabled) return null;
  return <>{children}</>;
}
