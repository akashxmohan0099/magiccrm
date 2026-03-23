"use client";

import { useEffect } from "react";
import { useOnboardingStore } from "@/store/onboarding";

/**
 * Step 5: Follow-Up Drill-Downs (removed)
 *
 * Follow-up drilldowns have been removed — questions are yes/no only now.
 * This step auto-skips to the next step.
 */
export function FeatureDrilldownStep() {
  const { nextStep } = useOnboardingStore();

  useEffect(() => {
    nextStep();
  }, [nextStep]);

  return null;
}
