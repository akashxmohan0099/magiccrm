import { useMemo } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { getIndustryAdaptiveConfig } from "@/lib/industry-configs";
import type { IndustryAdaptiveConfig } from "@/types/industry-config";

/** Returns the full IndustryAdaptiveConfig for the current user's selected industry + persona. */
export function useIndustryConfig(): IndustryAdaptiveConfig {
  const selectedIndustry = useOnboardingStore((s) => s.selectedIndustry);
  const selectedPersona = useOnboardingStore((s) => s.selectedPersona);

  return useMemo(
    () => getIndustryAdaptiveConfig(selectedIndustry, selectedPersona),
    [selectedIndustry, selectedPersona]
  );
}
