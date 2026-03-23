import { useMemo } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { useWorkflowSettingsStore } from "@/store/workflow-settings";
import { getIndustryAdaptiveConfig } from "@/lib/industry-configs";
import type { IndustryAdaptiveConfig } from "@/types/industry-config";

export function useBaseIndustryConfig(): IndustryAdaptiveConfig {
  const selectedIndustry = useOnboardingStore((s) => s.selectedIndustry);
  const selectedPersona = useOnboardingStore((s) => s.selectedPersona);

  return useMemo(
    () => getIndustryAdaptiveConfig(selectedIndustry, selectedPersona),
    [selectedIndustry, selectedPersona]
  );
}

/** Returns the full IndustryAdaptiveConfig for the current user's selected industry + persona. */
export function useIndustryConfig(): IndustryAdaptiveConfig {
  const baseConfig = useBaseIndustryConfig();
  const leadStages = useWorkflowSettingsStore((s) => s.leadStages);
  const jobStages = useWorkflowSettingsStore((s) => s.jobStages);

  return useMemo(
    () => ({
      ...baseConfig,
      leadStages: leadStages.length > 0 ? leadStages : baseConfig.leadStages,
      jobStages: jobStages.length > 0 ? jobStages : baseConfig.jobStages,
    }),
    [baseConfig, leadStages, jobStages]
  );
}
